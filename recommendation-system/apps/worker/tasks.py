"""
Celery tasks — Layer 6 real-time feedback loop.
All DB/Redis operations use synchronous drivers inside Celery workers.
"""

import json
import logging
import os
import pickle
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import faiss
import numpy as np
import redis as sync_redis
from sqlalchemy import and_, create_engine, func, select, text, update
from sqlalchemy.orm import Session, sessionmaker

from apps.api.config import get_settings
from apps.worker.celery_app import celery_app

logger = logging.getLogger(__name__)
settings = get_settings()

EMBEDDING_DIM = 384

# Sync SQLAlchemy engine for Celery (psycopg2)
_sync_engine = None
_SyncSession = None


def _get_sync_session() -> Session:
    global _sync_engine, _SyncSession
    if _sync_engine is None:
        connect_args = {}
        if "localhost" not in settings.sync_database_url:
            connect_args["sslmode"] = "require"
        _sync_engine = create_engine(
            settings.sync_database_url,
            pool_size=3,
            max_overflow=5,
            connect_args=connect_args,
        )
        _SyncSession = sessionmaker(bind=_sync_engine)
    return _SyncSession()


def _get_redis() -> sync_redis.Redis:
    return sync_redis.from_url(settings.redis_url, decode_responses=True)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 5 minutes — Trending recompute
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.recompute_trending", bind=True, max_retries=3)
def recompute_trending(self):
    """Recompute trending:global and per-topic sorted sets."""
    try:
        r = _get_redis()
        db = _get_sync_session()

        from packages.models.database import Event, Content, ContentStats

        since = datetime.now(timezone.utc) - timedelta(hours=1)

        # Aggregate events in last hour
        rows = db.execute(
            select(
                Event.content_id,
                func.sum(
                    func.case(
                        (Event.event_type == "like", 1),
                        (Event.event_type == "share", 2),
                        (Event.event_type == "comment", 1.5),
                        (Event.event_type == "save", 1.2),
                        else_=0,
                    )
                ).label("score"),
            )
            .where(Event.timestamp >= since)
            .group_by(Event.content_id)
        ).fetchall()

        pipe = r.pipeline()

        for content_id, raw_score in rows:
            if raw_score is None or raw_score <= 0:
                continue

            # Fetch created_at to apply time decay
            content_row = db.execute(
                select(Content.created_at, Content.topics)
                .where(Content.id == content_id)
            ).fetchone()

            if content_row is None:
                continue

            created_at = content_row.created_at
            if created_at and created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)

            if created_at:
                hours_old = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600
                trending_score = float(raw_score) / max(hours_old, 1) ** 0.8
            else:
                trending_score = float(raw_score)

            pipe.zadd("trending:global", {content_id: trending_score})

            # Per-topic
            for topic in (content_row.topics or []):
                pipe.zadd(f"trending:topics:{topic}", {content_id: trending_score})

        # Trim to top 1000 globally; 200 per topic
        pipe.zremrangebyrank("trending:global", 0, -1001)
        pipe.execute()

        # Trim per-topic sets
        for key in r.scan_iter("trending:topics:*"):
            r.zremrangebyrank(key, 0, -201)

        db.close()
        logger.info("Trending recomputed: %d items", len(rows))
    except Exception as exc:
        logger.error("recompute_trending failed: %s", exc)
        raise self.retry(exc=exc, countdown=30)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 30 minutes — Content stats update
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.update_content_stats", bind=True, max_retries=3)
def update_content_stats(self):
    """Recompute content_stats for recently active content."""
    try:
        db = _get_sync_session()
        from packages.models.database import Event, ContentStats

        since = datetime.now(timezone.utc) - timedelta(minutes=30)

        # Get active content IDs
        active_ids = [
            r.content_id
            for r in db.execute(
                select(Event.content_id)
                .where(Event.timestamp >= since)
                .distinct()
            ).fetchall()
        ]

        for content_id in active_ids:
            counts = db.execute(
                select(
                    func.count().filter(Event.event_type == "view").label("views"),
                    func.count().filter(Event.event_type == "like").label("likes"),
                    func.count().filter(Event.event_type == "share").label("shares"),
                    func.count().filter(Event.event_type == "save").label("saves"),
                    func.count().filter(Event.event_type == "comment").label("comments"),
                    func.count().filter(Event.event_type == "skip").label("skips"),
                    func.count().filter(Event.event_type == "hide").label("hides"),
                    func.count().filter(Event.event_type == "report").label("reports"),
                )
                .where(Event.content_id == content_id)
            ).fetchone()

            views = counts.views or 0
            skips = counts.skips or 0
            likes = counts.likes or 0
            shares = counts.shares or 0
            saves = counts.saves or 0
            skip_rate = skips / max(views, 1)
            engagement = (
                (likes + shares * 2 + saves * 1.5 + counts.comments * 1.2)
                / max(views, 1)
            )

            # Upsert
            existing = db.get(ContentStats, content_id)
            if existing:
                existing.views = views
                existing.likes = likes
                existing.shares = shares
                existing.saves = saves
                existing.comments = counts.comments or 0
                existing.skip_count = skips
                existing.hide_count = counts.hides or 0
                existing.report_count = counts.reports or 0
                existing.skip_rate = skip_rate
                existing.engagement_score = engagement
            else:
                db.add(ContentStats(
                    content_id=content_id,
                    views=views, likes=likes, shares=shares, saves=saves,
                    comments=counts.comments or 0,
                    skip_count=skips, hide_count=counts.hides or 0,
                    report_count=counts.reports or 0,
                    skip_rate=skip_rate, engagement_score=engagement,
                ))
        db.commit()
        db.close()
        logger.info("Content stats updated for %d items", len(active_ids))
    except Exception as exc:
        logger.error("update_content_stats failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 30 minutes — Hot user embedding update
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.update_hot_user_embeddings", bind=True, max_retries=3)
def update_hot_user_embeddings(self):
    """Recompute embeddings for users with ≥ 5 new events in last 30 min."""
    try:
        r = _get_redis()
        db = _get_sync_session()
        from packages.models.database import Event, Content, UserFeatures

        since = datetime.now(timezone.utc) - timedelta(minutes=30)
        hot_users = [
            r_.user_id
            for r_ in db.execute(
                select(Event.user_id, func.count().label("cnt"))
                .where(Event.timestamp >= since)
                .group_by(Event.user_id)
                .having(func.count() >= 5)
            ).fetchall()
        ]

        EVENT_WEIGHTS = {
            "like": 1.0, "comment": 0.9, "share": 0.8, "save": 0.7,
            "click": 0.4, "view": 0.3, "follow": 0.5,
            "skip": -0.5, "hide": -1.0, "report": -1.5,
        }

        for user_id in hot_users:
            rows = db.execute(
                select(Event.event_type, Content.embedding)
                .join(Content, Content.id == Event.content_id)
                .where(
                    and_(
                        Event.user_id == user_id,
                        Event.timestamp >= datetime.now(timezone.utc) - timedelta(days=90),
                        Content.embedding.isnot(None),
                    )
                )
                .limit(500)
            ).fetchall()

            if not rows:
                continue

            weighted_sum = np.zeros(EMBEDDING_DIM, dtype=np.float64)
            total_weight = 0.0
            for event_type, emb_json in rows:
                if emb_json is None:
                    continue
                w = EVENT_WEIGHTS.get(event_type, 0.0)
                emb = np.array(emb_json, dtype=np.float64)
                if emb.shape[0] != EMBEDDING_DIM:
                    continue
                weighted_sum += w * emb
                total_weight += abs(w)

            if total_weight == 0:
                continue
            vec = (weighted_sum / total_weight).astype(np.float32)
            norm = np.linalg.norm(vec)
            vec = vec / (norm + 1e-9)

            # Update Redis cache
            r.setex(f"feat:user:{user_id}", 3600, json.dumps(vec.tolist()))

            # Persist to DB
            uf = db.get(UserFeatures, user_id)
            if uf:
                uf.embedding = vec.tolist()
            else:
                db.add(UserFeatures(user_id=user_id, embedding=vec.tolist()))

        db.commit()
        db.close()
        logger.info("Updated embeddings for %d hot users", len(hot_users))
    except Exception as exc:
        logger.error("update_hot_user_embeddings failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 6 hours — Full interest graph recompute
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.full_recompute_interest_graphs", bind=True)
def full_recompute_interest_graphs(self):
    """Flush and recompute interest graph cache for all users."""
    try:
        r = _get_redis()
        db = _get_sync_session()
        from packages.models.database import User

        user_ids = [row.id for row in db.execute(select(User.id)).fetchall()]
        for uid in user_ids:
            r.delete(f"feat:interests:{uid}")
            # The next request will recompute; we just invalidate here

        db.close()
        logger.info("Interest graph cache invalidated for %d users", len(user_ids))
    except Exception as exc:
        logger.error("full_recompute_interest_graphs failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 6 hours — Rebuild FAISS index
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.rebuild_faiss_index", bind=True)
def rebuild_faiss_index(self):
    """Rebuild FAISS index with all content embeddings from DB."""
    try:
        db = _get_sync_session()
        from packages.models.database import Content

        rows = db.execute(
            select(Content.id, Content.embedding)
            .where(Content.embedding.isnot(None))
        ).fetchall()

        if not rows:
            logger.warning("No content embeddings found — skipping FAISS rebuild")
            db.close()
            return

        ids: List[str] = []
        vectors: List[np.ndarray] = []
        for content_id, emb_json in rows:
            if emb_json is None:
                continue
            vec = np.array(emb_json, dtype=np.float32)
            if vec.shape[0] != EMBEDDING_DIM:
                continue
            ids.append(content_id)
            vectors.append(vec)

        if not vectors:
            db.close()
            return

        matrix = np.stack(vectors).astype(np.float32)
        faiss.normalize_L2(matrix)

        index = faiss.IndexFlatIP(EMBEDDING_DIM)
        index.add(matrix)

        os.makedirs("data", exist_ok=True)
        faiss.write_index(index, settings.faiss_index_path)
        with open("data/content_id_map.json", "w") as f:
            json.dump(ids, f)

        db.close()
        logger.info("FAISS index rebuilt: %d vectors", len(ids))
    except Exception as exc:
        logger.error("rebuild_faiss_index failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
#  Every 6 hours — A/B metric aggregation
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.aggregate_ab_metrics", bind=True)
def aggregate_ab_metrics(self):
    """Snapshot A/B metrics into Redis for fast retrieval."""
    try:
        r = _get_redis()
        db = _get_sync_session()
        from packages.models.database import Experiment, ExperimentLog, Event

        experiments = db.execute(
            select(Experiment).where(Experiment.is_active == True)
        ).scalars().all()

        for exp in experiments:
            metrics: Dict = {}
            for variant in exp.variants:
                vid = variant["id"]
                user_ids = [
                    row.user_id
                    for row in db.execute(
                        select(ExperimentLog.user_id)
                        .where(
                            and_(
                                ExperimentLog.experiment_id == exp.id,
                                ExperimentLog.variant_id == vid,
                            )
                        )
                        .distinct()
                    ).fetchall()
                ]
                impressions = len(user_ids)
                clicks = db.execute(
                    select(func.count())
                    .select_from(Event)
                    .where(
                        and_(
                            Event.user_id.in_(user_ids),
                            Event.event_type == "click",
                            Event.timestamp >= exp.start_date,
                        )
                    )
                ).scalar() or 0

                metrics[vid] = {
                    "impressions": impressions,
                    "clicks": clicks,
                    "ctr": clicks / max(impressions, 1),
                }

            r.setex(f"ab:metrics:{exp.id}", 21600, json.dumps(metrics))

        db.close()
        logger.info("A/B metrics aggregated for %d experiments", len(experiments))
    except Exception as exc:
        logger.error("aggregate_ab_metrics failed: %s", exc)


# ─────────────────────────────────────────────────────────────────────────────
#  Immediate feedback tasks (triggered on event ingest)
# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(name="apps.worker.tasks.apply_negative_signal")
def apply_negative_signal(user_id: str, content_id: str, event_type: str):
    """Decrement content score for user on skip/hide/report."""
    r = _get_redis()
    penalties = {"skip": -1, "hide": -3, "report": -5}
    delta = penalties.get(event_type, -1)
    key = f"content:scores:{user_id}"
    r.zincrby(key, delta, content_id)
    r.expire(key, 86400 * 30)

    if event_type in ("hide", "report"):
        r.sadd(f"blocked:{user_id}", content_id)
        r.expire(f"blocked:{user_id}", 86400 * 90)
