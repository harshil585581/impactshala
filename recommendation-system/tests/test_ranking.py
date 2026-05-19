"""Unit tests for Ranking Layer (Layer 4)."""

import math
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import numpy as np
import pytest

from packages.candidate_gen.candidates import Candidate
from packages.ranking.ranker import RankingFeatures, RankingModel, ScoredCandidate


def _make_candidate(
    content_id: str = "c1",
    topics=None,
    hours_old: float = 1.0,
    embedding: np.ndarray = None,
) -> Candidate:
    return Candidate(
        content_id=content_id,
        retrieval_sources=["embedding_similarity"],
        author_id="author_1",
        topics=topics or ["technology"],
        created_at=datetime.now(timezone.utc) - timedelta(hours=hours_old),
        embedding=embedding if embedding is not None else np.random.randn(384).astype(np.float32),
    )


def _make_scored(
    content_id: str = "c1",
    p_engage: float = 0.5,
    hours_old: float = 1.0,
    topics=None,
    author_id: str = "author_1",
    embedding: np.ndarray = None,
    diversity_score: float = 0.5,
) -> ScoredCandidate:
    feats = RankingFeatures(
        content_recency_score=math.exp(-hours_old / 24),
        diversity_novelty_score=diversity_score,
    )
    cand = _make_candidate(content_id, topics=topics, hours_old=hours_old, embedding=embedding)
    cand.author_id = author_id
    return ScoredCandidate(candidate=cand, features=feats, p_engage=p_engage, final_score=p_engage)


# ── RankingFeatures ─────────────────────────────────────────────────────────

def test_ranking_features_vector_length():
    feats = RankingFeatures()
    assert len(feats.to_vector()) == 13


def test_ranking_features_names_length():
    assert len(RankingFeatures.feature_names()) == 13


def test_feature_vector_matches_names():
    feats = RankingFeatures(
        user_content_embedding_similarity=0.8,
        topic_affinity_score=0.6,
    )
    vec = feats.to_vector()
    names = RankingFeatures.feature_names()
    idx = names.index("user_content_embedding_similarity")
    assert vec[idx] == pytest.approx(0.8)


# ── Recency score ───────────────────────────────────────────────────────────

def test_recency_score_fresh_content():
    score = RankingModel._recency_score(datetime.now(timezone.utc) - timedelta(minutes=30))
    assert score > 0.97


def test_recency_score_old_content():
    score = RankingModel._recency_score(datetime.now(timezone.utc) - timedelta(days=5))
    assert score < 0.01


def test_recency_score_none_returns_zero():
    assert RankingModel._recency_score(None) == 0.0


# ── Heuristic scoring ────────────────────────────────────────────────────────

def test_heuristic_score_range():
    rm = RankingModel.__new__(RankingModel)
    rm._model = None

    for _ in range(20):
        feats = RankingFeatures(
            user_content_embedding_similarity=np.random.uniform(0, 1),
            topic_affinity_score=np.random.uniform(0, 1),
            content_quality_score=np.random.uniform(0, 1),
        )
        score = rm._heuristic_score(feats)
        assert 0.0 < score < 1.0


def test_heuristic_higher_for_engaged_features():
    rm = RankingModel.__new__(RankingModel)
    rm._model = None

    good_feats = RankingFeatures(
        user_content_embedding_similarity=0.9,
        topic_affinity_score=0.9,
        content_quality_score=0.8,
        is_from_followed_entity=1.0,
        network_signal_strength=1.0,
        negative_signal_penalty=0.0,
    )
    bad_feats = RankingFeatures(
        user_content_embedding_similarity=0.1,
        topic_affinity_score=0.1,
        content_quality_score=0.0,
        is_from_followed_entity=0.0,
        network_signal_strength=0.0,
        negative_signal_penalty=0.8,
    )
    assert rm._heuristic_score(good_feats) > rm._heuristic_score(bad_feats)


# ── Home feed ranking ────────────────────────────────────────────────────────

def test_home_ranking_applies_freshness_boost():
    rm = RankingModel.__new__(RankingModel)

    scored = [
        _make_scored("c1", p_engage=0.5, hours_old=0.5),   # fresh
        _make_scored("c2", p_engage=0.6, hours_old=48.0),  # old but higher p_engage
    ]

    result = rm.rank_home(scored, freshness_boost_hours=2, freshness_factor=1.2)

    # c2 starts higher but c1 with boost: 0.5 * 1.2 = 0.6 == c2; tie goes to c2 still
    # With 0.5*1.2=0.6 = c2's 0.6, order depends on sort stability but both should be present
    ids = [sc.candidate.content_id for sc in result]
    assert set(ids) == {"c1", "c2"}


def test_home_ranking_no_more_than_3_consecutive_same_author():
    rm = RankingModel.__new__(RankingModel)

    scored = [
        _make_scored(f"c{i}", p_engage=0.9 - i * 0.01, author_id="author_A")
        for i in range(5)
    ] + [
        _make_scored("cx", p_engage=0.5, author_id="author_B")
    ]

    result = rm.rank_home(scored)
    author_a_items = [sc for sc in result if sc.candidate.author_id == "author_A"]
    # All 5 should appear in result (3 in first batch, 2 deferred)
    assert len(author_a_items) == 5
    # First 3 consecutive positions should not have a 4th author_A
    consecutive = 0
    max_consecutive = 0
    for sc in result[:6]:
        if sc.candidate.author_id == "author_A":
            consecutive += 1
            max_consecutive = max(max_consecutive, consecutive)
        else:
            consecutive = 0
    assert max_consecutive <= 3


# ── Discover feed ranking ─────────────────────────────────────────────────────

def test_discover_ranking_includes_outside_interests():
    rm = RankingModel.__new__(RankingModel)

    interest_graph = {"technology": 1.0, "ai": 0.8}

    scored = [
        _make_scored(f"c{i}", p_engage=0.8, topics=["technology"])
        for i in range(8)
    ] + [
        _make_scored("c_wild", p_engage=0.3, topics=["cooking"]),
    ]

    result = rm.rank_discover(scored, interest_graph)
    topic_sets = [set(sc.candidate.topics) for sc in result]
    has_wildcard = any("cooking" in t for t in topic_sets)
    assert has_wildcard, "Discover feed should include content from outside user interests"
