"""Unit tests for Feature Store (Layer 2)."""

import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from packages.feature_store.features import (
    EMBEDDING_DIM, EVENT_WEIGHTS, FeatureService,
)


@pytest.fixture
def mock_redis():
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.setex = AsyncMock()
    redis.lrange = AsyncMock(return_value=[])
    redis.pipeline = MagicMock(return_value=AsyncMock())
    return redis


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def feature_service(mock_db, mock_redis):
    return FeatureService(db=mock_db, redis=mock_redis)


# ── Embedding weights ──────────────────────────────────────────────────────

def test_event_weights_positive_for_engagement():
    assert EVENT_WEIGHTS["like"] > 0
    assert EVENT_WEIGHTS["save"] > 0
    assert EVENT_WEIGHTS["share"] > 0


def test_event_weights_negative_for_bad_signals():
    assert EVENT_WEIGHTS["skip"] < 0
    assert EVENT_WEIGHTS["hide"] < 0
    assert EVENT_WEIGHTS["report"] < 0


def test_hide_penalty_greater_than_skip():
    assert abs(EVENT_WEIGHTS["hide"]) > abs(EVENT_WEIGHTS["skip"])


# ── User embedding ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_user_embedding_uses_cache(feature_service, mock_redis):
    cached_vec = np.random.randn(EMBEDDING_DIM).astype(np.float32)
    mock_redis.get.return_value = json.dumps(cached_vec.tolist())

    result = await feature_service.get_user_embedding("user_123")

    assert result.shape == (EMBEDDING_DIM,)
    mock_redis.setex.assert_not_called()  # shouldn't recompute


@pytest.mark.asyncio
async def test_get_user_embedding_cold_start_returns_unit_vector(feature_service, mock_db, mock_redis):
    """When no events exist, return a random unit vector."""
    mock_redis.get.return_value = None
    mock_result = MagicMock()
    mock_result.fetchall.return_value = []
    mock_db.execute = AsyncMock(return_value=mock_result)

    result = await feature_service.get_user_embedding("new_user")

    assert result.shape == (EMBEDDING_DIM,)
    assert abs(np.linalg.norm(result) - 1.0) < 1e-5


@pytest.mark.asyncio
async def test_online_embedding_update_moves_toward_content(feature_service, mock_redis):
    user_emb = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    user_emb[0] = 1.0  # unit vector pointing in dim 0

    content_emb = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    content_emb[1] = 1.0  # unit vector pointing in dim 1

    mock_redis.get.return_value = json.dumps(user_emb.tolist())

    await feature_service.update_user_embedding_online("u1", content_emb, "like", lr=0.1)

    stored = json.loads(mock_redis.setex.call_args[0][2])
    updated = np.array(stored, dtype=np.float32)

    # The updated embedding should have moved toward dim 1
    assert updated[1] > 0.0


# ── Interest graph ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_interest_graph_returns_normalized_scores(feature_service, mock_db, mock_redis):
    mock_redis.get.return_value = None

    # Simulate events with topics
    fake_events = [
        ("like", 0, ["technology", "ai"]),
        ("like", 0, ["technology"]),
        ("view", 60000, ["ai"]),
        ("skip", 0, ["marketing"]),
    ]
    mock_result = MagicMock()
    mock_result.fetchall.side_effect = [fake_events, []]  # events, then no follows
    mock_db.execute = AsyncMock(return_value=mock_result)

    scores = await feature_service._compute_interest_graph("u1")

    if scores:
        assert max(scores.values()) <= 1.0
        assert min(scores.values()) >= 0.0
        # technology should score higher than marketing (which was skipped)
        assert scores.get("technology", 0) > scores.get("marketing", 0)


@pytest.mark.asyncio
async def test_interest_graph_cached_on_first_fetch(feature_service, mock_db, mock_redis):
    mock_redis.get.return_value = json.dumps({"technology": 1.0, "ai": 0.7})

    scores = await feature_service.get_interest_graph("u1")

    assert scores["technology"] == 1.0
    mock_db.execute.assert_not_called()


# ── Session signals ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_empty_session_returns_defaults(feature_service, mock_redis):
    mock_redis.lrange.return_value = []
    signals = await feature_service.get_real_time_session_signals("sess_123")

    assert signals["dominant_topic"] is None
    assert signals["session_length"] == 0
    assert signals["engagement_momentum"] == 0.0


@pytest.mark.asyncio
async def test_session_momentum_positive_on_engagement(feature_service, mock_redis):
    events = [
        json.dumps({"event_type": "like", "content_id": "c1", "topics": ["ai"]}),
        json.dumps({"event_type": "save", "content_id": "c2", "topics": ["ai"]}),
        json.dumps({"event_type": "view", "content_id": "c3", "topics": ["ai"]}),
    ]
    mock_redis.lrange.return_value = events
    signals = await feature_service.get_real_time_session_signals("sess_abc")

    assert signals["engagement_momentum"] > 0
    assert signals["dominant_topic"] == "ai"


@pytest.mark.asyncio
async def test_session_dominant_topic_is_most_common(feature_service, mock_redis):
    events = [
        json.dumps({"event_type": "view", "content_id": "c1", "topics": ["tech", "ai"]}),
        json.dumps({"event_type": "view", "content_id": "c2", "topics": ["tech"]}),
        json.dumps({"event_type": "view", "content_id": "c3", "topics": ["finance"]}),
    ]
    mock_redis.lrange.return_value = events
    signals = await feature_service.get_real_time_session_signals("sess_xyz")

    assert signals["dominant_topic"] == "tech"
