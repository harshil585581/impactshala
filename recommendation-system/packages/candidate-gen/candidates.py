"""
Candidate Generation — Layer 3
Five retrieval strategies that together fill the candidate pool.
"""

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set

import faiss
import numpy as np
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from packages.feature_store.features import FeatureService

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 384


@dataclass
class Candidate:
    content_id: str
    retrieval_sources: List[str] = field(default_factory=list)
    retrieval_score: float = 0.0
    author_id: str = ""
    topics: List[str] = field(default_factory=list)
    created_at: Optional[datetime] = None
    embedding: Optional[np.ndarray] = None
    # Extra signals populated later by ranking
    metadata: Dict[str, Any] = field(default_factory=dict)


class CandidateGenerator:
    def __init__(
        self,
        db: AsyncSession,
        redis: aioredis.Redis,
        feature_service: FeatureService,
        faiss_index_path: str = "data/content_embeddings.index",
        faiss_id_map_path: str = "data/content_id_map.json",
    ):
        self.db = db
        self.redis = redis
        self.fs = feature_service
        self.faiss_index_path = faiss_index_path
        self.faiss_id_map_path = faiss_id_map_path
        self._faiss_index: Optional[faiss.Index] = None
        self._id_map: Optional[List[str]] = None  # index position → content_id

    # ------------------------------------------------------------------ #
    #  FAISS helpers                                                        #
    # ------------------------------------------------------------------ #

    def _load_faiss(self) -> bool:
        if self._faiss_index is not None:
            return True
        if not os.path.exists(self.faiss_index_path):
            logger.warning("FAISS index not found at %s", self.faiss_index_path)
            return False
        self._faiss_index = faiss.read_index(self.faiss_index_path)
        with open(self.faiss_id_map_path) as f:
            self._id_map = json.load(f)
        logger.info("FAISS index loaded: %d vectors", self._faiss_index.ntotal)
        return True

    def reload_faiss(self) -> None:
        self._faiss_index = None
        self._id_map = None
        self._load_faiss()

    # ------------------------------------------------------------------ #
    #  Seen-content filter                                                  #
    # ------------------------------------------------------------------ #

    async def _get_seen_ids(self, user_id: str) -> Set[str]:
        seen_key = f"seen:{user_id}"
        members = await self.redis.smembers(seen_key)
        return set(members)

    async def _get_blocked_ids(self, user_id: str) -> Set[str]:
        blocked_key = f"blocked:{user_id}"
        members = await self.redis.smembers(blocked_key)
        return set(members)

    # ------------------------------------------------------------------ #
    #  Strategy 1 — Embedding similarity (content-based filtering)         #
    # ------------------------------------------------------------------ #

    async def _strategy_embedding(
        self, user_id: str, seen: Set[str], top_k: int = 200
    ) -> List[Candidate]:
        if not self._load_faiss():
            return []

        user_emb = await self.fs.get_user_embedding(user_id)
        query = np.array([user_emb], dtype=np.float32)
        faiss.normalize_L2(query)

        distances, indices = self._faiss_index.search(query, top_k + len(seen) + 10)

        candidates: List[Candidate] = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < 0 or idx >= len(self._id_map):
                continue
            content_id = self._id_map[idx]
            if content_id in seen:
                continue
            candidates.append(
                Candidate(
                    content_id=content_id,
                    retrieval_sources=["embedding_similarity"],
                    retrieval_score=float(dist),
                )
            )
            if len(candidates) >= top_k:
                break

        return candidates

    # ------------------------------------------------------------------ #
    #  Strategy 2 — Collaborative filtering                                 #
    # ------------------------------------------------------------------ #

    async def _strategy_collaborative(
        self, user_id: str, seen: Set[str], top_k: int = 150
    ) -> List[Candidate]:
        from packages.models.database import UserFeatures, Event

        # Load all user embeddings from DB (for small/medium scale)
        result = await self.db.execute(
            select(UserFeatures.user_id, UserFeatures.embedding).where(
                and_(
                    UserFeatures.user_id != user_id,
                    UserFeatures.embedding.isnot(None),
                )
            )
        )
        rows = result.fetchall()
        if not rows:
            return []

        user_emb = await self.fs.get_user_embedding(user_id)

        # Cosine similarity to find top-50 similar users
        sim_users: List[tuple[str, float]] = []
        for uid, emb_json in rows:
            if emb_json is None:
                continue
            other = np.array(emb_json, dtype=np.float32)
            norm = np.linalg.norm(other)
            if norm < 1e-9:
                continue
            sim = float(np.dot(user_emb, other / norm))
            sim_users.append((uid, sim))

        sim_users.sort(key=lambda x: x[1], reverse=True)
        top_users = [uid for uid, _ in sim_users[:50]]
        user_sim_map = {uid: sim for uid, sim in sim_users[:50]}

        if not top_users:
            return []

        since = datetime.now(timezone.utc) - timedelta(days=7)
        engaged_result = await self.db.execute(
            select(Event.content_id, Event.user_id, Event.event_type)
            .where(
                and_(
                    Event.user_id.in_(top_users),
                    Event.event_type.in_(["like", "share", "save"]),
                    Event.timestamp >= since,
                )
            )
        )
        rows = engaged_result.fetchall()

        QUALITY = {"like": 1.0, "save": 0.9, "share": 0.8}
        score_map: Dict[str, float] = {}
        for content_id, uid, etype in rows:
            if content_id in seen:
                continue
            sim = user_sim_map.get(uid, 0.0)
            quality = QUALITY.get(etype, 0.5)
            score_map[content_id] = score_map.get(content_id, 0.0) + sim * quality

        sorted_items = sorted(score_map.items(), key=lambda x: x[1], reverse=True)
        return [
            Candidate(
                content_id=cid,
                retrieval_sources=["collaborative_filtering"],
                retrieval_score=score,
            )
            for cid, score in sorted_items[:top_k]
        ]

    # ------------------------------------------------------------------ #
    #  Strategy 3 — Social graph                                            #
    # ------------------------------------------------------------------ #

    async def _strategy_social(
        self, user_id: str, seen: Set[str]
    ) -> List[Candidate]:
        signals = await self.fs.get_social_graph_signals(user_id)
        candidates: List[Candidate] = []
        added: Set[str] = set()

        for cid in signals.get("followed_content_ids", []):
            if cid in seen or cid in added:
                continue
            candidates.append(
                Candidate(
                    content_id=cid,
                    retrieval_sources=["social_graph"],
                    retrieval_score=1.5,
                )
            )
            added.add(cid)

        for cid in signals.get("trending_in_network", []):
            if cid in seen or cid in added:
                continue
            candidates.append(
                Candidate(
                    content_id=cid,
                    retrieval_sources=["social_graph_trending"],
                    retrieval_score=1.0,
                )
            )
            added.add(cid)

        return candidates

    # ------------------------------------------------------------------ #
    #  Strategy 4 — Trending                                               #
    # ------------------------------------------------------------------ #

    async def _strategy_trending(
        self,
        user_id: str,
        seen: Set[str],
        feed_type: str = "home",
        top_interests: Optional[List[str]] = None,
    ) -> List[Candidate]:
        candidates: List[Candidate] = []
        added: Set[str] = set()

        # Global trending
        global_items = await self.redis.zrevrangebyscore(
            "trending:global", "+inf", "-inf", start=0, num=100, withscores=True
        )
        for cid, score in global_items:
            if cid in seen or cid in added:
                continue
            candidates.append(
                Candidate(
                    content_id=cid,
                    retrieval_sources=["trending_global"],
                    retrieval_score=score,
                )
            )
            added.add(cid)

        # Per-topic trending (Discover)
        if feed_type == "discover" and top_interests:
            for topic in top_interests[:5]:
                topic_items = await self.redis.zrevrangebyscore(
                    f"trending:topics:{topic}", "+inf", "-inf", start=0, num=30, withscores=True
                )
                for cid, score in topic_items:
                    if cid in seen or cid in added:
                        continue
                    candidates.append(
                        Candidate(
                            content_id=cid,
                            retrieval_sources=[f"trending_topic:{topic}"],
                            retrieval_score=score,
                        )
                    )
                    added.add(cid)

        return candidates

    # ------------------------------------------------------------------ #
    #  Strategy 5 — New / emerging creator boost                           #
    # ------------------------------------------------------------------ #

    async def _strategy_emerging(
        self, seen: Set[str], top_k: int = 50
    ) -> List[Candidate]:
        from packages.models.database import Content, User

        since = datetime.now(timezone.utc) - timedelta(hours=72)
        result = await self.db.execute(
            select(Content.id, User.follower_count)
            .join(User, User.id == Content.author_id)
            .where(
                and_(
                    Content.created_at >= since,
                    User.follower_count < 1000,
                )
            )
            .order_by(Content.created_at.desc())
            .limit(top_k * 2)
        )
        rows = result.fetchall()

        candidates: List[Candidate] = []
        for content_id, follower_count in rows:
            if content_id in seen:
                continue
            exploration_bonus = 1.0 - (follower_count / 1000.0) * 0.5
            candidates.append(
                Candidate(
                    content_id=content_id,
                    retrieval_sources=["emerging_creator"],
                    retrieval_score=exploration_bonus,
                )
            )
            if len(candidates) >= top_k:
                break

        return candidates

    # ------------------------------------------------------------------ #
    #  Public: generate candidates                                          #
    # ------------------------------------------------------------------ #

    async def generate(
        self,
        user_id: str,
        feed_type: str = "home",
        max_candidates: int = 500,
    ) -> List[Candidate]:
        seen = await self._get_seen_ids(user_id)
        blocked = await self._get_blocked_ids(user_id)
        excluded = seen | blocked

        interest_graph = await self.fs.get_interest_graph(user_id)
        top_interests = sorted(interest_graph, key=interest_graph.get, reverse=True)[:5]

        # Run all strategies
        results = await self._strategy_embedding(user_id, excluded)
        collab = await self._strategy_collaborative(user_id, excluded)
        social = await self._strategy_social(user_id, excluded)
        trending = await self._strategy_trending(user_id, excluded, feed_type, top_interests)
        emerging = await self._strategy_emerging(excluded)

        # Merge and deduplicate
        merged: Dict[str, Candidate] = {}
        for cand_list in [results, collab, social, trending, emerging]:
            for c in cand_list:
                if c.content_id in merged:
                    existing = merged[c.content_id]
                    existing.retrieval_sources.extend(c.retrieval_sources)
                    existing.retrieval_score = max(existing.retrieval_score, c.retrieval_score)
                else:
                    merged[c.content_id] = c

        all_candidates = list(merged.values())

        # Enrich with DB metadata
        await self._enrich_candidates(all_candidates)

        # Filter blocked content (double-check)
        all_candidates = [c for c in all_candidates if c.content_id not in blocked]

        # Cap
        cap = min(max_candidates, len(all_candidates))
        return all_candidates[:cap]

    async def _enrich_candidates(self, candidates: List[Candidate]) -> None:
        """Batch-load author, topics, created_at for all candidates."""
        from packages.models.database import Content

        if not candidates:
            return

        ids = [c.content_id for c in candidates]
        result = await self.db.execute(
            select(Content.id, Content.author_id, Content.topics, Content.created_at, Content.embedding)
            .where(Content.id.in_(ids))
        )
        rows = {r.id: r for r in result.fetchall()}

        for c in candidates:
            row = rows.get(c.content_id)
            if row:
                c.author_id = row.author_id or ""
                c.topics = row.topics or []
                c.created_at = row.created_at
                if row.embedding:
                    c.embedding = np.array(row.embedding, dtype=np.float32)
