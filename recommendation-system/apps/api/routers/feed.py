"""
GET /feed/home       — personalized home feed
GET /feed/discover   — discover feed
GET /feed/explain    — explain a recommendation
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from apps.api.config import get_settings
from apps.api.database import get_db, get_redis
from packages.candidate_gen.candidates import CandidateGenerator
from packages.feature_store.features import FeatureService
from packages.feedback.feedback import ABExperimentService, FeedBuilder, FeedFilter
from packages.models.database import Content, User
from packages.ranking.ranker import RankingModel

router = APIRouter(prefix="/feed", tags=["feed"])
logger = logging.getLogger(__name__)
settings = get_settings()


def _make_services(db: AsyncSession, redis: aioredis.Redis):
    fs = FeatureService(
        db=db,
        redis=redis,
        embedding_model=settings.embedding_model,
        user_embedding_ttl=settings.user_embedding_ttl,
        content_embedding_ttl=settings.content_embedding_ttl,
        interest_graph_ttl=settings.interest_graph_ttl,
        session_window=settings.session_window_size,
    )
    cg = CandidateGenerator(
        db=db,
        redis=redis,
        feature_service=fs,
        faiss_index_path=settings.faiss_index_path,
        faiss_id_map_path="data/content_id_map.json",
    )
    rm = RankingModel(
        db=db,
        redis=redis,
        feature_service=fs,
        model_path=settings.ranking_model_path,
    )
    fb = FeedBuilder(redis=redis, feed_cache_ttl=settings.feed_cache_ttl)
    return fs, cg, rm, fb


async def _fetch_content_rows(db: AsyncSession, content_ids: list) -> dict:
    """Batch-load content title/author/type for feed items."""
    if not content_ids:
        return {}
    result = await db.execute(
        select(Content.id, Content.title, Content.content_type, User.username)
        .join(User, User.id == Content.author_id)
        .where(Content.id.in_(content_ids))
    )
    return {
        row.id: {
            "title": row.title,
            "content_type": row.content_type,
            "author_username": row.username,
        }
        for row in result.fetchall()
    }


async def _serve_from_cache(redis: aioredis.Redis, cache_key: str) -> Optional[dict]:
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)
    return None


# ─────────────────────────────────────────────────────────────────────────────

@router.get("/home")
async def get_home_feed(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    cache_key = f"feed:{user_id}:home:{page}"
    cached = await _serve_from_cache(redis, cache_key)
    if cached:
        return cached

    fs, cg, rm, fb = _make_services(db, redis)

    # Generate candidates
    candidates = await cg.generate(
        user_id=user_id,
        feed_type="home",
        max_candidates=settings.home_feed_max_candidates,
    )

    # Score
    scored = await rm.score_candidates(user_id, candidates, session_id)

    # Rank (home-specific rules)
    interest_graph = await fs.get_interest_graph(user_id)
    scored = rm.rank_home(
        scored,
        freshness_boost_hours=settings.freshness_boost_hours,
        freshness_factor=settings.freshness_boost_factor,
    )

    # Filter quality + diversity + business rules
    blocked = await redis.smembers(f"blocked:{user_id}")
    scored = FeedFilter.apply_quality_filters(scored, blocked)
    top_topics = sorted(interest_graph, key=interest_graph.get, reverse=True)[:5]
    scored = FeedFilter.apply_diversity_rules(scored, feed_type="home", user_top_topics=top_topics)
    scored = await FeedFilter.apply_business_rules(
        scored, redis, feed_type="home", max_age_days=settings.home_max_age_days
    )

    # Fetch titles/authors
    content_ids = [sc.candidate.content_id for sc in scored]
    content_rows = await _fetch_content_rows(db, content_ids)

    return await fb.build(user_id, "home", scored, content_rows, page, page_size)


@router.get("/discover")
async def get_discover_feed(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    cache_key = f"feed:{user_id}:discover:{page}"
    cached = await _serve_from_cache(redis, cache_key)
    if cached:
        return cached

    fs, cg, rm, fb = _make_services(db, redis)

    candidates = await cg.generate(
        user_id=user_id,
        feed_type="discover",
        max_candidates=settings.discover_feed_max_candidates,
    )

    scored = await rm.score_candidates(user_id, candidates, session_id)

    interest_graph = await fs.get_interest_graph(user_id)
    scored = rm.rank_discover(scored, interest_graph)

    blocked = await redis.smembers(f"blocked:{user_id}")
    scored = FeedFilter.apply_quality_filters(scored, blocked)
    top_topics = sorted(interest_graph, key=interest_graph.get, reverse=True)[:5]
    scored = FeedFilter.apply_diversity_rules(scored, feed_type="discover", user_top_topics=top_topics)
    scored = await FeedFilter.apply_business_rules(
        scored, redis, feed_type="discover", max_age_days=settings.discover_max_age_days
    )

    content_ids = [sc.candidate.content_id for sc in scored]
    content_rows = await _fetch_content_rows(db, content_ids)

    return await fb.build(user_id, "discover", scored, content_rows, page, page_size)


@router.get("/explain")
async def explain_recommendation(
    user_id: str = Query(...),
    content_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Return why a specific content item was recommended to a user."""
    from packages.candidate_gen.candidates import Candidate
    import numpy as np

    fs, _, rm, _ = _make_services(db, redis)

    # Build a single-item candidate
    from packages.models.database import Content as ContentModel
    row = await db.execute(
        select(ContentModel).where(ContentModel.id == content_id)
    )
    content = row.scalar_one_or_none()
    if not content:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Content not found")

    cand = Candidate(
        content_id=content_id,
        retrieval_sources=["explain"],
        author_id=content.author_id,
        topics=content.topics or [],
        created_at=content.created_at,
        embedding=np.array(content.embedding, dtype=np.float32) if content.embedding else None,
    )

    scored = await rm.score_candidates(user_id, [cand])
    if not scored:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Scoring failed")

    sc = scored[0]
    feats = sc.features
    from packages.feedback.feedback import FeedBuilder
    signals, primary = FeedBuilder._build_explanation(sc)

    return {
        "user_id": user_id,
        "content_id": content_id,
        "recommendation_score": round(sc.final_score, 4),
        "explanation": {
            "primary_reason": primary,
            "signals_used": signals,
        },
        "debug": {
            "embedding_sim": round(feats.user_content_embedding_similarity, 4),
            "topic_score": round(feats.topic_affinity_score, 4),
            "network_score": round(feats.network_signal_strength, 4),
            "recency_score": round(feats.content_recency_score, 4),
            "quality_score": round(feats.content_quality_score, 4),
            "viral_velocity": round(feats.viral_velocity, 4),
        },
        "feature_breakdown": {
            name: round(float(val), 4)
            for name, val in zip(
                feats.feature_names(), feats.to_vector().tolist()
            )
        },
    }
