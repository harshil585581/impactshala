"""Unit tests for Candidate Generation (Layer 3)."""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from packages.candidate_gen.candidates import Candidate, CandidateGenerator


@pytest.fixture
def mock_redis():
    r = AsyncMock()
    r.smembers = AsyncMock(return_value=set())
    r.zrevrangebyscore = AsyncMock(return_value=[])
    r.zcard = AsyncMock(return_value=0)
    return r


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_fs():
    fs = AsyncMock()
    fs.get_user_embedding = AsyncMock(return_value=np.random.randn(384).astype(np.float32))
    fs.get_interest_graph = AsyncMock(return_value={"technology": 1.0, "ai": 0.8})
    fs.get_social_graph_signals = AsyncMock(return_value={
        "followed_content_ids": [],
        "trending_in_network": [],
        "second_degree_ids": [],
        "followed_user_ids": [],
    })
    return fs


# ── Candidate dataclass ────────────────────────────────────────────────────────

def test_candidate_defaults():
    c = Candidate(content_id="c1")
    assert c.retrieval_sources == []
    assert c.retrieval_score == 0.0
    assert c.topics == []


def test_candidate_multiple_sources():
    c = Candidate(
        content_id="c1",
        retrieval_sources=["embedding_similarity", "collaborative_filtering"],
    )
    assert len(c.retrieval_sources) == 2


# ── Trending strategy ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_strategy_trending_returns_global(mock_db, mock_redis, mock_fs):
    mock_redis.zrevrangebyscore = AsyncMock(return_value=[
        ("content_1", 100.0),
        ("content_2", 80.0),
    ])

    cg = CandidateGenerator(
        db=mock_db, redis=mock_redis, feature_service=mock_fs
    )
    candidates = await cg._strategy_trending("user_1", seen=set(), feed_type="home")

    assert len(candidates) == 2
    assert candidates[0].content_id == "content_1"
    assert candidates[0].retrieval_score == 100.0
    assert "trending_global" in candidates[0].retrieval_sources


@pytest.mark.asyncio
async def test_strategy_trending_skips_seen(mock_db, mock_redis, mock_fs):
    mock_redis.zrevrangebyscore = AsyncMock(return_value=[
        ("content_1", 100.0),
        ("content_2", 80.0),
    ])

    cg = CandidateGenerator(db=mock_db, redis=mock_redis, feature_service=mock_fs)
    candidates = await cg._strategy_trending("user_1", seen={"content_1"}, feed_type="home")

    ids = [c.content_id for c in candidates]
    assert "content_1" not in ids
    assert "content_2" in ids


# ── Deduplication in generate ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_deduplicates_candidates(mock_db, mock_redis, mock_fs):
    """Same content_id from multiple strategies should appear only once."""
    cg = CandidateGenerator(db=mock_db, redis=mock_redis, feature_service=mock_fs)

    # Simulate two strategies returning the same content
    cand_a = Candidate("dup_c1", retrieval_sources=["embedding_similarity"], retrieval_score=0.9)
    cand_b = Candidate("dup_c1", retrieval_sources=["trending_global"], retrieval_score=0.5)
    cand_c = Candidate("unique_c2", retrieval_sources=["social_graph"], retrieval_score=0.7)

    with patch.object(cg, "_strategy_embedding", AsyncMock(return_value=[cand_a])), \
         patch.object(cg, "_strategy_collaborative", AsyncMock(return_value=[cand_b])), \
         patch.object(cg, "_strategy_social", AsyncMock(return_value=[cand_c])), \
         patch.object(cg, "_strategy_trending", AsyncMock(return_value=[])), \
         patch.object(cg, "_strategy_emerging", AsyncMock(return_value=[])), \
         patch.object(cg, "_enrich_candidates", AsyncMock()):

        candidates = await cg.generate("user_1", feed_type="home", max_candidates=500)

    ids = [c.content_id for c in candidates]
    assert ids.count("dup_c1") == 1  # deduplicated

    # Merged candidate should have both sources
    merged = next(c for c in candidates if c.content_id == "dup_c1")
    assert "embedding_similarity" in merged.retrieval_sources
    assert "trending_global" in merged.retrieval_sources


@pytest.mark.asyncio
async def test_generate_respects_max_candidates(mock_db, mock_redis, mock_fs):
    cg = CandidateGenerator(db=mock_db, redis=mock_redis, feature_service=mock_fs)

    many = [Candidate(f"c{i}", retrieval_sources=["embedding_similarity"]) for i in range(200)]

    with patch.object(cg, "_strategy_embedding", AsyncMock(return_value=many)), \
         patch.object(cg, "_strategy_collaborative", AsyncMock(return_value=[])), \
         patch.object(cg, "_strategy_social", AsyncMock(return_value=[])), \
         patch.object(cg, "_strategy_trending", AsyncMock(return_value=[])), \
         patch.object(cg, "_strategy_emerging", AsyncMock(return_value=[])), \
         patch.object(cg, "_enrich_candidates", AsyncMock()):

        result = await cg.generate("user_1", feed_type="home", max_candidates=50)

    assert len(result) <= 50


# ── Social strategy ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_social_strategy_boosts_followed_content(mock_db, mock_redis):
    mock_fs = AsyncMock()
    mock_fs.get_social_graph_signals = AsyncMock(return_value={
        "followed_content_ids": ["followed_c1", "followed_c2"],
        "trending_in_network": ["trend_c1"],
        "second_degree_ids": [],
        "followed_user_ids": ["u2"],
    })

    cg = CandidateGenerator(db=mock_db, redis=mock_redis, feature_service=mock_fs)
    candidates = await cg._strategy_social("user_1", seen=set())

    followed = [c for c in candidates if "social_graph" in c.retrieval_sources]
    assert len(followed) == 2
    assert all(c.retrieval_score == 1.5 for c in followed)

    trending = [c for c in candidates if "social_graph_trending" in c.retrieval_sources]
    assert len(trending) == 1
    assert trending[0].retrieval_score == 1.0
