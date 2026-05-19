"""
Re-ranking, Filtering & Feed Assembly — Layer 5
Also contains the A/B experiment assignment helper.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

import redis.asyncio as aioredis

from packages.candidate_gen.candidates import Candidate
from packages.ranking.ranker import ScoredCandidate

logger = logging.getLogger(__name__)


class FeedFilter:
    """Quality, diversity, and business-rule filters."""

    # ------------------------------------------------------------------ #
    #  Quality filters                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def apply_quality_filters(
        candidates: List[ScoredCandidate],
        blocked_ids: set,
    ) -> List[ScoredCandidate]:
        filtered: List[ScoredCandidate] = []
        seen_embeddings: List[np.ndarray] = []

        for sc in candidates:
            cand = sc.candidate

            # Skip blocked/reported/hidden content
            if cand.content_id in blocked_ids:
                continue

            # Skip spam (flagged ≥ 3 times by users)
            spam_flags = cand.metadata.get("spam_flag_count", 0)
            if spam_flags >= 3:
                continue

            # Near-duplicate filter (cosine sim > 0.95 with already-added item)
            if cand.embedding is not None and seen_embeddings:
                norm = np.linalg.norm(cand.embedding)
                if norm > 1e-9:
                    normed = cand.embedding / norm
                    for prev in seen_embeddings[-10:]:
                        sim = float(np.dot(normed, prev))
                        if sim > 0.95:
                            break
                    else:
                        filtered.append(sc)
                        seen_embeddings.append(normed)
                        continue
                    continue  # near-duplicate — skip

            filtered.append(sc)
            if cand.embedding is not None:
                norm = np.linalg.norm(cand.embedding)
                if norm > 1e-9:
                    seen_embeddings.append(cand.embedding / norm)

        return filtered

    # ------------------------------------------------------------------ #
    #  Diversity rules                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def apply_diversity_rules(
        candidates: List[ScoredCandidate],
        feed_type: str = "home",
        user_top_topics: Optional[List[str]] = None,
    ) -> List[ScoredCandidate]:
        result: List[ScoredCandidate] = []
        slot_topic_counts: Dict[str, int] = {}
        slot_author_counts: Dict[str, int] = {}
        wildcard_quota = 0  # 1 per 10 for Discover

        for i, sc in enumerate(candidates):
            cand = sc.candidate
            slot = i // 10  # reset every 10 items

            # Reset slot counters at each new slot
            if i % 10 == 0:
                slot_topic_counts = {}
                slot_author_counts = {}
                wildcard_quota = 0

            # Topic diversity: ≤ 3 same topic per 10
            topics = cand.topics or []
            max_topic_count = max(
                (slot_topic_counts.get(t, 0) for t in topics), default=0
            )
            if max_topic_count >= 3:
                continue

            # Author diversity: ≤ 2 same author per 10
            author = cand.author_id
            if slot_author_counts.get(author, 0) >= 2:
                continue

            # Discover wildcard: 1 outside-user-interests per 10
            is_wildcard = (
                feed_type == "discover"
                and user_top_topics
                and not any(t in user_top_topics for t in topics)
            )
            if is_wildcard:
                if wildcard_quota >= 1:
                    continue
                wildcard_quota += 1

            for t in topics:
                slot_topic_counts[t] = slot_topic_counts.get(t, 0) + 1
            slot_author_counts[author] = slot_author_counts.get(author, 0) + 1

            result.append(sc)

        return result

    # ------------------------------------------------------------------ #
    #  Business rules                                                       #
    # ------------------------------------------------------------------ #

    @staticmethod
    async def apply_business_rules(
        candidates: List[ScoredCandidate],
        redis: aioredis.Redis,
        feed_type: str = "home",
        max_age_days: int = 7,
    ) -> List[ScoredCandidate]:
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(days=max_age_days)

        # Priority content pinned by admin
        priority_ids = await redis.smembers("priority:content")

        result: List[ScoredCandidate] = []
        promoted_count = 0
        pinned: List[ScoredCandidate] = []
        normal: List[ScoredCandidate] = []

        for sc in candidates:
            cand = sc.candidate

            # Age filter
            if cand.created_at:
                created = cand.created_at
                if created.tzinfo is None:
                    created = created.replace(tzinfo=timezone.utc)
                if created < cutoff:
                    continue

            is_promoted = cand.metadata.get("is_promoted", False)
            is_priority = cand.content_id in priority_ids

            if is_priority:
                pinned.append(sc)
            elif is_promoted:
                normal.append(sc)
            else:
                normal.append(sc)

        # Pin priority content at top
        result.extend(pinned)

        # Interleave promoted (≤ 1 per 10)
        promo_iter = iter([sc for sc in normal if sc.candidate.metadata.get("is_promoted")])
        organic_iter = iter([sc for sc in normal if not sc.candidate.metadata.get("is_promoted")])
        slot = 0

        for sc in organic_iter:
            result.append(sc)
            slot += 1
            if slot % 10 == 0 and promoted_count < 1:
                promo = next(promo_iter, None)
                if promo:
                    result.append(promo)
                    promoted_count += 1

        return result

    # ------------------------------------------------------------------ #
    #  Diversity score metric                                               #
    # ------------------------------------------------------------------ #

    @staticmethod
    def compute_diversity_score(candidates: List[ScoredCandidate], top_n: int = 20) -> float:
        embs = [
            sc.candidate.embedding
            for sc in candidates[:top_n]
            if sc.candidate.embedding is not None
        ]
        if len(embs) < 2:
            return 0.0

        normed = []
        for e in embs:
            n = np.linalg.norm(e)
            normed.append(e / (n + 1e-9))

        sims = []
        for i in range(len(normed)):
            for j in range(i + 1, len(normed)):
                sims.append(float(np.dot(normed[i], normed[j])))

        return 1.0 - float(np.mean(sims))


class FeedBuilder:
    """Assembles the final paginated feed response."""

    def __init__(self, redis: aioredis.Redis, feed_cache_ttl: int = 300):
        self.redis = redis
        self.feed_cache_ttl = feed_cache_ttl

    async def build(
        self,
        user_id: str,
        feed_type: str,
        scored: List[ScoredCandidate],
        content_rows: Dict[str, Any],
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """Paginate, cache, and format the final feed."""
        total = len(scored)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = scored[start:end]

        items = []
        for sc in page_items:
            cand = sc.candidate
            row = content_rows.get(cand.content_id, {})

            explanation, primary_reason = self._build_explanation(sc)

            items.append({
                "content_id": cand.content_id,
                "title": row.get("title", ""),
                "author": row.get("author_username", ""),
                "author_id": cand.author_id,
                "topics": cand.topics,
                "content_type": row.get("content_type", ""),
                "created_at": cand.created_at.isoformat() if cand.created_at else None,
                "recommendation_score": round(sc.final_score, 4),
                "retrieval_source": list(set(cand.retrieval_sources)),
                "explanation": {
                    "primary_reason": primary_reason,
                    "signals_used": explanation,
                },
                "debug": {
                    "embedding_sim": round(sc.features.user_content_embedding_similarity, 4),
                    "topic_score": round(sc.features.topic_affinity_score, 4),
                    "network_score": round(sc.features.network_signal_strength, 4),
                    "recency_score": round(sc.features.content_recency_score, 4),
                    "quality_score": round(sc.features.content_quality_score, 4),
                    "viral_velocity": round(sc.features.viral_velocity, 4),
                },
            })

        feed = {
            "user_id": user_id,
            "feed_type": feed_type,
            "page": page,
            "page_size": page_size,
            "total_candidates": total,
            "items": items,
            "generated_at": datetime.utcnow().isoformat(),
        }

        cache_key = f"feed:{user_id}:{feed_type}:{page}"
        await self.redis.setex(cache_key, self.feed_cache_ttl, json.dumps(feed))
        return feed

    @staticmethod
    def _build_explanation(sc: ScoredCandidate) -> Tuple[List[str], str]:
        feats = sc.features
        signals: List[str] = []
        primary = "Recommended based on your activity"

        if feats.is_from_followed_entity > 0:
            signals.append("followed_author")
            primary = "From someone you follow"
        if feats.network_signal_strength > 0.5:
            signals.append("trending_in_network")
            if not signals or primary == "Recommended based on your activity":
                primary = "Trending in your network"
        if feats.topic_affinity_score > 0.5:
            signals.append("matches_interests")
            if primary == "Recommended based on your activity":
                primary = "Matches your interests"
        if feats.user_content_embedding_similarity > 0.7:
            signals.append("similar_to_liked_content")
        if feats.content_recency_score > 0.9:
            signals.append("recently_published")
        if feats.viral_velocity > 0.5:
            signals.append("trending")
        if feats.diversity_novelty_score > 0.6:
            signals.append("new_to_you")
            if primary == "Recommended based on your activity":
                primary = "Discover something new"

        return signals or ["personalized"], primary


class ABExperimentService:
    """Assigns users to experiment variants and logs assignments."""

    def __init__(self, db, redis: aioredis.Redis):
        self.db = db
        self.redis = redis

    def assign_variant(self, user_id: str, experiment_id: str, variants: List[Dict]) -> str:
        """Deterministic, hash-based variant assignment."""
        hash_val = int(
            hashlib.md5(f"{user_id}:{experiment_id}".encode()).hexdigest(), 16
        ) % 100

        cumulative = 0
        for variant in variants:
            cumulative += variant.get("traffic_pct", 0)
            if hash_val < cumulative:
                return variant["id"]
        return variants[-1]["id"]

    async def log_assignment(
        self,
        experiment_id: str,
        user_id: str,
        variant_id: str,
        request_id: Optional[str] = None,
    ) -> None:
        from packages.models.database import ExperimentLog
        from sqlalchemy import insert

        await self.db.execute(
            insert(ExperimentLog).values(
                experiment_id=experiment_id,
                user_id=user_id,
                variant_id=variant_id,
                request_id=request_id,
            )
        )
