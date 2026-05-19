"""Unit tests for Feed Filtering (Layer 5)."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import numpy as np
import pytest

from packages.candidate_gen.candidates import Candidate
from packages.feedback.feedback import ABExperimentService, FeedFilter
from packages.ranking.ranker import RankingFeatures, ScoredCandidate


def _scored(
    content_id: str,
    author_id: str = "author_1",
    topics=None,
    embedding: np.ndarray = None,
    spam_flags: int = 0,
    p_engage: float = 0.7,
    hours_old: float = 2.0,
    is_promoted: bool = False,
) -> ScoredCandidate:
    emb = embedding if embedding is not None else np.random.randn(384).astype(np.float32)
    emb = emb / (np.linalg.norm(emb) + 1e-9)
    cand = Candidate(
        content_id=content_id,
        retrieval_sources=["test"],
        author_id=author_id,
        topics=topics or ["technology"],
        created_at=datetime.now(timezone.utc) - timedelta(hours=hours_old),
        embedding=emb,
        metadata={"spam_flag_count": spam_flags, "is_promoted": is_promoted},
    )
    return ScoredCandidate(candidate=cand, features=RankingFeatures(), p_engage=p_engage, final_score=p_engage)


# ── Quality filters ───────────────────────────────────────────────────────────

def test_quality_filter_removes_spam():
    candidates = [
        _scored("c1", spam_flags=0),
        _scored("c2", spam_flags=5),   # should be removed
        _scored("c3", spam_flags=2),
    ]
    result = FeedFilter.apply_quality_filters(candidates, blocked_ids=set())
    ids = {sc.candidate.content_id for sc in result}
    assert "c2" not in ids
    assert "c1" in ids
    assert "c3" in ids


def test_quality_filter_removes_blocked():
    candidates = [_scored("c1"), _scored("c2"), _scored("c3")]
    result = FeedFilter.apply_quality_filters(candidates, blocked_ids={"c2"})
    ids = {sc.candidate.content_id for sc in result}
    assert "c2" not in ids


def test_quality_filter_removes_near_duplicates():
    base_emb = np.ones(384, dtype=np.float32)
    base_emb /= np.linalg.norm(base_emb)

    # c1 and c2 are near-identical (cosine sim ≈ 1.0)
    candidates = [
        _scored("c1", embedding=base_emb.copy()),
        _scored("c2", embedding=base_emb.copy()),         # near-duplicate
        _scored("c3", embedding=np.random.randn(384)),    # different
    ]
    result = FeedFilter.apply_quality_filters(candidates, blocked_ids=set())
    ids = [sc.candidate.content_id for sc in result]
    assert "c1" in ids
    assert "c2" not in ids   # deduplicated
    assert "c3" in ids


def test_quality_filter_keeps_all_unique():
    candidates = [
        _scored("c1", embedding=np.array([1.0] + [0.0] * 383, dtype=np.float32)),
        _scored("c2", embedding=np.array([0.0, 1.0] + [0.0] * 382, dtype=np.float32)),
        _scored("c3", embedding=np.array([0.0, 0.0, 1.0] + [0.0] * 381, dtype=np.float32)),
    ]
    result = FeedFilter.apply_quality_filters(candidates, blocked_ids=set())
    assert len(result) == 3


# ── Diversity rules ───────────────────────────────────────────────────────────

def test_diversity_max_3_same_topic_per_10():
    # 5 items with same topic in same slot of 10
    candidates = [_scored(f"c{i}", topics=["technology"]) for i in range(5)]
    # Pad to make a full slot
    candidates += [_scored(f"cx{i}", topics=["finance"]) for i in range(5)]

    result = FeedFilter.apply_diversity_rules(candidates, feed_type="home")
    tech_count = sum(1 for sc in result[:10] if "technology" in sc.candidate.topics)
    assert tech_count <= 3


def test_diversity_max_2_same_author_per_10():
    candidates = [_scored(f"c{i}", author_id="author_A") for i in range(5)]
    candidates += [_scored(f"cx{i}", author_id="author_B") for i in range(5)]

    result = FeedFilter.apply_diversity_rules(candidates, feed_type="home")
    author_a = sum(1 for sc in result[:10] if sc.candidate.author_id == "author_A")
    assert author_a <= 2


def test_discover_injects_wildcard_per_10():
    user_topics = ["technology", "ai"]
    candidates = [_scored(f"c{i}", topics=["technology"]) for i in range(9)]
    candidates.append(_scored("wildcard", topics=["cooking"]))

    result = FeedFilter.apply_diversity_rules(
        candidates, feed_type="discover", user_top_topics=user_topics
    )
    wildcard_in = any("cooking" in sc.candidate.topics for sc in result)
    assert wildcard_in


# ── Business rules ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_business_rules_removes_stale_content():
    redis = AsyncMock()
    redis.smembers = AsyncMock(return_value=set())

    fresh = _scored("fresh", hours_old=5.0)
    stale = _scored("stale", hours_old=24 * 8)  # 8 days old — beyond 7-day home limit

    result = await FeedFilter.apply_business_rules(
        [fresh, stale], redis, feed_type="home", max_age_days=7
    )
    ids = {sc.candidate.content_id for sc in result}
    assert "fresh" in ids
    assert "stale" not in ids


@pytest.mark.asyncio
async def test_business_rules_caps_promoted_at_1_per_10():
    redis = AsyncMock()
    redis.smembers = AsyncMock(return_value=set())

    # 3 promoted items mixed with 10 organic
    promoted = [_scored(f"p{i}", is_promoted=True) for i in range(3)]
    organic = [_scored(f"o{i}") for i in range(10)]

    result = await FeedFilter.apply_business_rules(
        organic + promoted, redis, feed_type="home", max_age_days=7
    )
    promoted_ids = {sc.candidate.content_id for sc in result if sc.candidate.metadata.get("is_promoted")}
    assert len(promoted_ids) <= 1


# ── Diversity score metric ─────────────────────────────────────────────────────

def test_diversity_score_identical_embeddings_is_zero():
    emb = np.ones(384, dtype=np.float32)
    emb /= np.linalg.norm(emb)
    candidates = [_scored(f"c{i}", embedding=emb.copy()) for i in range(5)]
    score = FeedFilter.compute_diversity_score(candidates)
    assert score < 0.1


def test_diversity_score_orthogonal_is_high():
    candidates = []
    for i in range(4):
        emb = np.zeros(384, dtype=np.float32)
        emb[i] = 1.0
        candidates.append(_scored(f"c{i}", embedding=emb))
    score = FeedFilter.compute_diversity_score(candidates)
    assert score > 0.8


# ── A/B experiment assignment ─────────────────────────────────────────────────

def test_ab_assignment_is_deterministic():
    svc = ABExperimentService(db=None, redis=None)
    variants = [
        {"id": "control", "traffic_pct": 50},
        {"id": "treatment", "traffic_pct": 50},
    ]
    v1 = svc.assign_variant("user_abc", "exp_1", variants)
    v2 = svc.assign_variant("user_abc", "exp_1", variants)
    assert v1 == v2


def test_ab_assignment_distributes_traffic():
    svc = ABExperimentService(db=None, redis=None)
    variants = [
        {"id": "control", "traffic_pct": 50},
        {"id": "treatment", "traffic_pct": 50},
    ]
    assignments = [
        svc.assign_variant(f"user_{i}", "exp_1", variants)
        for i in range(1000)
    ]
    control = assignments.count("control")
    treatment = assignments.count("treatment")
    # Should be roughly 50/50 ± 5%
    assert 450 <= control <= 550
    assert 450 <= treatment <= 550
