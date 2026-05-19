"""
Feature Store — Layer 2
Computes and caches user/content features for the recommendation pipeline.
"""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

EVENT_WEIGHTS: Dict[str, float] = {
    "like": 1.0,
    "comment": 0.9,
    "share": 0.8,
    "save": 0.7,
    "click": 0.4,
    "view": 0.3,
    "follow": 0.5,
    "skip": -0.5,
    "hide": -1.0,
    "report": -1.5,
}

EMBEDDING_DIM = 384
_sentence_model: Optional[SentenceTransformer] = None


def get_sentence_model(model_name: str = "all-MiniLM-L6-v2") -> SentenceTransformer:
    global _sentence_model
    if _sentence_model is None:
        logger.info("Loading sentence-transformers model: %s", model_name)
        _sentence_model = SentenceTransformer(model_name)
    return _sentence_model


class FeatureService:
    def __init__(
        self,
        db: AsyncSession,
        redis: aioredis.Redis,
        embedding_model: str = "all-MiniLM-L6-v2",
        user_embedding_ttl: int = 3600,
        content_embedding_ttl: int = 86400,
        interest_graph_ttl: int = 1800,
        session_window: int = 20,
    ):
        self.db = db
        self.redis = redis
        self.embedding_model = embedding_model
        self.user_embedding_ttl = user_embedding_ttl
        self.content_embedding_ttl = content_embedding_ttl
        self.interest_graph_ttl = interest_graph_ttl
        self.session_window = session_window

    async def get_user_embedding(self, user_id: str) -> np.ndarray:
        cache_key = f"feat:user:{user_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return np.array(json.loads(cached), dtype=np.float32)
        embedding = await self._compute_user_embedding(user_id)
        await self.redis.setex(cache_key, self.user_embedding_ttl, json.dumps(embedding.tolist()))
        return embedding

    async def _compute_user_embedding(self, user_id: str) -> np.ndarray:
        from packages.models.database import Event, Content
        since = datetime.now(timezone.utc) - timedelta(days=90)
        result = await self.db.execute(
            select(Event.event_type, Content.embedding)
            .join(Content, Content.id == Event.content_id)
            .where(and_(
                Event.user_id == user_id,
                Event.timestamp >= since,
                Content.embedding.isnot(None),
            ))
            .limit(500)
        )
        rows = result.fetchall()
        if not rows:
            v = np.random.randn(EMBEDDING_DIM).astype(np.float32)
            return v / (np.linalg.norm(v) + 1e-9)

        weighted_sum = np.zeros(EMBEDDING_DIM, dtype=np.float64)
        total_weight = 0.0
        for event_type, emb_json in rows:
            if emb_json is None:
                continue
            weight = EVENT_WEIGHTS.get(event_type, 0.0)
            emb = np.array(emb_json, dtype=np.float64)
            if emb.shape[0] != EMBEDDING_DIM:
                continue
            weighted_sum += weight * emb
            total_weight += abs(weight)

        if total_weight == 0:
            v = np.random.randn(EMBEDDING_DIM).astype(np.float32)
            return v / (np.linalg.norm(v) + 1e-9)

        result_vec = (weighted_sum / total_weight).astype(np.float32)
        norm = np.linalg.norm(result_vec)
        return result_vec / (norm + 1e-9)

    async def update_user_embedding_online(
        self, user_id: str, content_embedding: np.ndarray, event_type: str, lr: float = 0.01
    ) -> None:
        current = await self.get_user_embedding(user_id)
        weight = EVENT_WEIGHTS.get(event_type, 0.0)
        updated = current + lr * weight * (content_embedding - current)
        norm = np.linalg.norm(updated)
        updated = updated / (norm + 1e-9)
        cache_key = f"feat:user:{user_id}"
        await self.redis.setex(cache_key, self.user_embedding_ttl, json.dumps(updated.tolist()))

    async def get_content_embedding(self, content_id: str) -> np.ndarray:
        cache_key = f"feat:content:{content_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return np.array(json.loads(cached), dtype=np.float32)
        embedding = await self._compute_content_embedding(content_id)
        await self.redis.setex(cache_key, self.content_embedding_ttl, json.dumps(embedding.tolist()))
        return embedding

    async def _compute_content_embedding(self, content_id: str) -> np.ndarray:
        from packages.models.database import Content
        result = await self.db.execute(
            select(Content.title, Content.description, Content.topics, Content.embedding)
            .where(Content.id == content_id)
        )
        row = result.fetchone()
        if row is None:
            return np.zeros(EMBEDDING_DIM, dtype=np.float32)
        title, description, topics, stored_emb = row
        if stored_emb is not None:
            return np.array(stored_emb, dtype=np.float32)
        text_parts = [title or ""]
        if description:
            text_parts.append(description[:500])
        if topics:
            text_parts.append(" ".join(topics))
        text = " ".join(text_parts)
        model = get_sentence_model(self.embedding_model)
        return model.encode(text, normalize_embeddings=True).astype(np.float32)

    async def embed_text(self, text: str) -> np.ndarray:
        model = get_sentence_model(self.embedding_model)
        return model.encode(text, normalize_embeddings=True).astype(np.float32)

    async def get_social_graph_signals(self, user_id: str) -> Dict[str, Any]:
        from packages.models.database import Follow, Event
        followee_result = await self.db.execute(
            select(Follow.followee_id, Follow.entity_type).where(Follow.follower_id == user_id)
        )
        follows = followee_result.fetchall()
        followed_user_ids = [f.followee_id for f in follows if f.entity_type == "user"]

        if not followed_user_ids:
            return {"followed_content_ids": [], "trending_in_network": [],
                    "second_degree_ids": [], "followed_user_ids": []}

        since = datetime.now(timezone.utc) - timedelta(hours=48)
        engaged_result = await self.db.execute(
            select(Event.content_id, func.count(Event.id).label("cnt"))
            .where(and_(
                Event.user_id.in_(followed_user_ids),
                Event.event_type.in_(["like", "share", "save", "comment"]),
                Event.timestamp >= since,
            ))
            .group_by(Event.content_id)
            .order_by(func.count(Event.id).desc())
            .limit(100)
        )
        followed_content = [r.content_id for r in engaged_result.fetchall()]

        trending_result = await self.db.execute(
            select(Event.content_id, func.count(Event.id).label("cnt"))
            .where(and_(Event.user_id.in_(followed_user_ids), Event.timestamp >= since))
            .group_by(Event.content_id)
            .order_by(func.count(Event.id).desc())
            .limit(50)
        )
        trending_in_network = [r.content_id for r in trending_result.fetchall()]

        second_degree_result = await self.db.execute(
            select(Follow.followee_id)
            .where(and_(
                Follow.follower_id.in_(followed_user_ids),
                Follow.entity_type == "user",
                Follow.followee_id != user_id,
            ))
            .distinct()
            .limit(50)
        )
        second_degree_ids = [r.followee_id for r in second_degree_result.fetchall()]

        return {
            "followed_content_ids": followed_content,
            "trending_in_network": trending_in_network,
            "second_degree_ids": second_degree_ids,
            "followed_user_ids": followed_user_ids,
        }

    async def get_interest_graph(self, user_id: str) -> Dict[str, float]:
        cache_key = f"feat:interests:{user_id}"
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)
        scores = await self._compute_interest_graph(user_id)
        await self.redis.setex(cache_key, self.interest_graph_ttl, json.dumps(scores))
        return scores

    async def _compute_interest_graph(self, user_id: str) -> Dict[str, float]:
        from packages.models.database import Event, Content, Follow
        since = datetime.now(timezone.utc) - timedelta(days=30)
        topic_scores: Dict[str, float] = {}

        event_result = await self.db.execute(
            select(Event.event_type, Event.dwell_time_ms, Content.topics)
            .join(Content, Content.id == Event.content_id)
            .where(and_(
                Event.user_id == user_id,
                Event.timestamp >= since,
                Content.topics.isnot(None),
            ))
            .limit(2000)
        )
        for event_type, dwell_ms, topics in event_result.fetchall():
            if not topics:
                continue
            base_weight = EVENT_WEIGHTS.get(event_type, 0.0)
            if base_weight <= 0:
                continue
            if event_type == "view" and dwell_ms and dwell_ms > 30000:
                base_weight = 1.0
            for topic in topics:
                topic_scores[topic] = topic_scores.get(topic, 0.0) + base_weight

        follow_result = await self.db.execute(
            select(Follow.followee_id)
            .where(and_(Follow.follower_id == user_id, Follow.entity_type == "topic"))
        )
        for (topic,) in follow_result.fetchall():
            topic_scores[topic] = topic_scores.get(topic, 0.0) + 2.0

        if not topic_scores:
            return {}
        max_score = max(topic_scores.values())
        if max_score > 0:
            topic_scores = {k: v / max_score for k, v in topic_scores.items()}
        return topic_scores

    async def get_real_time_session_signals(self, session_id: str) -> Dict[str, Any]:
        session_key = f"session:{session_id}"
        raw = await self.redis.lrange(session_key, 0, self.session_window - 1)
        if not raw:
            return {"dominant_topic": None, "recent_negative_count": 0,
                    "engagement_momentum": 0.0, "session_length": 0, "recent_content_ids": []}

        events: List[Dict] = [json.loads(e) for e in raw]
        topic_counts: Dict[str, int] = {}
        negative_count = positive_count = 0
        recent_content_ids = []

        for ev in events:
            etype = ev.get("event_type", "")
            if etype in ("skip", "hide", "report"):
                negative_count += 1
            elif etype in ("like", "comment", "share", "save"):
                positive_count += 1
            cid = ev.get("content_id")
            if cid:
                recent_content_ids.append(cid)
            for topic in ev.get("topics", []):
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

        dominant_topic = max(topic_counts, key=topic_counts.get) if topic_counts else None
        session_len = len(events)

        return {
            "dominant_topic": dominant_topic,
            "recent_negative_count": negative_count,
            "engagement_momentum": (positive_count - negative_count) / max(session_len, 1),
            "session_length": session_len,
            "recent_content_ids": recent_content_ids[:20],
            "topic_counts": topic_counts,
        }

    async def push_session_event(
        self, session_id: str, event_data: Dict[str, Any], window: int = 20, ttl: int = 3600
    ) -> None:
        session_key = f"session:{session_id}"
        pipe = self.redis.pipeline()
        pipe.lpush(session_key, json.dumps(event_data))
        pipe.ltrim(session_key, 0, window - 1)
        pipe.expire(session_key, ttl)
        await pipe.execute()
