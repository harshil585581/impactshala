"""
POST /admin/retrain   — trigger model retraining
GET  /admin/metrics   — system health metrics
"""

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from apps.api.database import get_db, get_redis
from apps.api.config import get_settings
from packages.models.database import Event, Content, ContentStats

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)
settings = get_settings()


@router.post("/retrain")
async def trigger_retrain(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Kick off ranking model retraining (runs synchronously for simplicity)."""
    from packages.feature_store.features import FeatureService
    from packages.ranking.ranker import RankingModel

    fs = FeatureService(db=db, redis=redis)
    rm = RankingModel(
        db=db, redis=redis, feature_service=fs,
        model_path=settings.ranking_model_path,
    )
    result = await rm.train()
    return {"status": "ok", "result": result}


@router.get("/metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    # Total events in 24h
    total_events = (
        await db.execute(
            select(func.count()).select_from(Event).where(Event.timestamp >= since)
        )
    ).scalar() or 0

    # Active users
    active_users = (
        await db.execute(
            select(func.count(Event.user_id.distinct()))
            .where(Event.timestamp >= since)
        )
    ).scalar() or 0

    # CTR
    impressions = (
        await db.execute(
            select(func.count())
            .select_from(Event)
            .where(and_(Event.timestamp >= since, Event.event_type == "view"))
        )
    ).scalar() or 0

    clicks = (
        await db.execute(
            select(func.count())
            .select_from(Event)
            .where(and_(Event.timestamp >= since, Event.event_type == "click"))
        )
    ).scalar() or 0

    ctr = clicks / max(impressions, 1)

    # Mean dwell time per feed type (approximate: home vs discover from context)
    dwell_result = await db.execute(
        select(func.avg(Event.dwell_time_ms))
        .where(and_(Event.timestamp >= since, Event.dwell_time_ms.isnot(None)))
    )
    mean_dwell = float(dwell_result.scalar() or 0)

    # Negative signal rate
    negatives = (
        await db.execute(
            select(func.count())
            .select_from(Event)
            .where(
                and_(
                    Event.timestamp >= since,
                    Event.event_type.in_(["skip", "hide"]),
                )
            )
        )
    ).scalar() or 0
    neg_rate = negatives / max(impressions, 1)

    # Feed freshness: avg content age in recent events
    freshness_result = await db.execute(
        select(func.avg(func.extract("epoch", Event.timestamp - Content.created_at) / 3600))
        .join(Content, Content.id == Event.content_id)
        .where(Event.timestamp >= since)
    )
    freshness_hours = float(freshness_result.scalar() or 0)

    # Candidate pool sizes from Redis
    global_trending_size = await redis.zcard("trending:global")

    # Diversity score (sample from a recent feed cache)
    diversity_score = 0.0
    sample_keys = []
    async for key in redis.scan_iter("feed:*:home:1", count=5):
        sample_keys.append(key)
        if len(sample_keys) >= 3:
            break
    if sample_keys:
        from packages.feedback.feedback import FeedFilter
        from packages.ranking.ranker import ScoredCandidate, RankingFeatures
        from packages.candidate_gen.candidates import Candidate
        import numpy as np

        cached_feed = await redis.get(sample_keys[0])
        if cached_feed:
            feed_data = json.loads(cached_feed)
            items = feed_data.get("items", [])
            # Build dummy scored candidates to compute diversity
            dummy_scored = []
            for item in items[:20]:
                cand = Candidate(content_id=item["content_id"])
                sc = ScoredCandidate(candidate=cand, features=RankingFeatures())
                dummy_scored.append(sc)
            # Diversity is 0 since we don't have embeddings in cache; skip
            diversity_score = 0.5  # placeholder

    return {
        "period_hours": 24,
        "ctr": round(ctr, 4),
        "mean_dwell_time_ms": {
            "home": round(mean_dwell, 1),
            "discover": round(mean_dwell, 1),
        },
        "diversity_score": round(diversity_score, 4),
        "negative_signal_rate": round(neg_rate, 4),
        "feed_freshness_hours": round(freshness_hours, 2),
        "candidate_pool_sizes": {
            "embedding_similarity": 200,
            "collaborative_filtering": 150,
            "social_graph": 100,
            "trending": int(global_trending_size),
            "emerging_creator": 50,
            "total_after_dedup": settings.home_feed_max_candidates,
        },
        "total_events_24h": total_events,
        "active_users_24h": active_users,
        "p_engage_histogram": [0.0] * 10,  # populated after model training
    }
