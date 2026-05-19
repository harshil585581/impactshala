"""
Data Simulator
Generates 500 users, 2000 content items, 50k events + a power-law follow graph.
Populates Supabase (PostgreSQL) and rebuilds the FAISS index.

Usage:
    python -m apps.simulator.generate
    python -m apps.simulator.generate --users 100 --content 500 --events 5000
"""

import argparse
import json
import logging
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

import faiss
import numpy as np
from faker import Faker
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from apps.api.config import get_settings
from packages.models.database import (
    Base, Content, ContentStats, Event, Follow, User, UserFeatures,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)
fake = Faker()
settings = get_settings()

EMBEDDING_DIM = 384

TOPICS = [
    "technology", "ai", "machine-learning", "data-science", "startups",
    "entrepreneurship", "leadership", "career", "productivity", "finance",
    "marketing", "design", "ux", "product-management", "devops",
    "cloud", "cybersecurity", "blockchain", "sustainability", "health",
    "education", "remote-work", "diversity", "sales", "investing",
]

CONTENT_TYPES = ["article", "video", "post", "image", "newsletter"]

EVENT_WEIGHTS_SIM = {
    "view": 0.40,
    "click": 0.20,
    "like": 0.12,
    "comment": 0.06,
    "share": 0.05,
    "save": 0.07,
    "skip": 0.05,
    "hide": 0.02,
    "follow": 0.02,
    "report": 0.01,
}

EVENT_TYPES = list(EVENT_WEIGHTS_SIM.keys())
EVENT_PROBS = list(EVENT_WEIGHTS_SIM.values())


def _get_engine():
    connect_args = {}
    if "localhost" not in settings.sync_database_url:
        connect_args["sslmode"] = "require"
    return create_engine(
        settings.sync_database_url,
        pool_size=5,
        max_overflow=5,
        connect_args=connect_args,
    )


def _uid() -> str:
    return str(uuid.uuid4())[:16]


def _generate_users(n: int) -> List[User]:
    users: List[User] = []
    professions = [
        "Software Engineer", "Product Manager", "Data Scientist", "Designer",
        "Marketing Manager", "Sales Executive", "Entrepreneur", "CTO",
        "Recruiter", "Consultant", "Analyst", "DevOps Engineer",
    ]
    for i in range(n):
        interests = random.sample(TOPICS, k=random.randint(2, 6))
        users.append(User(
            id=_uid(),
            username=fake.unique.user_name(),
            email=fake.unique.email(),
            interests=interests,
            profession=random.choice(professions),
            location=fake.city(),
            follower_count=0,
            following_count=0,
        ))
    return users


def _generate_content(
    n: int,
    users: List[User],
    model: SentenceTransformer,
) -> Tuple[List[Content], np.ndarray]:
    contents: List[Content] = []
    embeddings: List[np.ndarray] = []
    now = datetime.now(timezone.utc)

    # Time spread: last 30 days, with a few trending spikes
    for i in range(n):
        topics = random.sample(TOPICS, k=random.randint(1, 4))
        ctype = random.choice(CONTENT_TYPES)
        author = random.choice(users)
        days_ago = random.expovariate(0.15)  # most content recent
        days_ago = min(days_ago, 30)
        created_at = now - timedelta(days=days_ago, hours=random.uniform(0, 24))

        title = fake.sentence(nb_words=random.randint(5, 12)).rstrip(".")
        description = fake.paragraph(nb_sentences=random.randint(2, 5))

        text_to_embed = f"{title} {description[:300]} {' '.join(topics)}"
        emb = model.encode(text_to_embed, normalize_embeddings=True)

        content = Content(
            id=_uid(),
            title=title,
            description=description,
            content_type=ctype,
            author_id=author.id,
            topics=topics,
            embedding=emb.tolist(),
            metadata_={"content_type": ctype, "is_promoted": False, "spam_flag_count": 0},
            spam_flag_count=0,
            created_at=created_at,
        )
        contents.append(content)
        embeddings.append(emb)

    return contents, np.stack(embeddings).astype(np.float32)


def _generate_follows(users: List[User]) -> List[Follow]:
    """Power-law follow graph: popular users get exponentially more followers."""
    follows: List[Follow] = []
    seen: set = set()
    n = len(users)

    # Hub users: top 5% get ~40% of follows
    hub_count = max(1, n // 20)
    hub_users = random.sample(users, hub_count)
    hub_ids = {u.id for u in hub_users}

    for follower in users:
        # Each user follows 5–30 others (capped at available users)
        max_follows = min(30, len(users) - 1)
        follow_count = random.randint(min(5, max_follows), max_follows)
        candidates = []

        # 60% chance to follow a hub user
        for _ in range(follow_count):
            if random.random() < 0.6:
                target = random.choice(hub_users)
            else:
                target = random.choice(users)

            if target.id == follower.id:
                continue
            key = (follower.id, target.id, "user")
            if key in seen:
                continue
            seen.add(key)
            follows.append(Follow(
                follower_id=follower.id,
                followee_id=target.id,
                entity_type="user",
            ))

        # Also follow 1–3 topics
        pool = follower.interests or TOPICS[:5]
        k = random.randint(1, min(3, len(pool)))
        for topic in random.sample(pool, k=k):
            key = (follower.id, topic, "topic")
            if key in seen:
                continue
            seen.add(key)
            follows.append(Follow(
                follower_id=follower.id,
                followee_id=topic,
                entity_type="topic",
            ))

    return follows


def _update_follower_counts(session: Session, users: List[User], follows: List[Follow]):
    from collections import Counter
    follower_counts = Counter(f.followee_id for f in follows if f.entity_type == "user")
    following_counts = Counter(f.follower_id for f in follows if f.entity_type == "user")
    for user in users:
        user.follower_count = follower_counts.get(user.id, 0)
        user.following_count = following_counts.get(user.id, 0)


def _generate_events(
    users: List[User],
    contents: List[Content],
    n_events: int,
) -> Tuple[List[Event], List[ContentStats]]:
    """Realistic engagement: popular content and hub users attract more events."""
    events: List[Event] = []
    now = datetime.now(timezone.utc)

    # Content popularity weights (power-law)
    pop = np.random.pareto(a=1.5, size=len(contents)) + 1
    pop /= pop.sum()

    # Trending spikes: 5 random content items at random times
    trending_ids = [c.id for c in random.sample(contents, 5)]

    stats_map: Dict[str, Dict] = {
        c.id: {"views": 0, "likes": 0, "shares": 0, "saves": 0,
               "comments": 0, "skips": 0, "hides": 0, "reports": 0}
        for c in contents
    }

    for _ in range(n_events):
        user = random.choice(users)
        content = np.random.choice(contents, p=pop)
        event_type = np.random.choice(EVENT_TYPES, p=EVENT_PROBS)

        # Trending spike: boost events 30 days → now
        if content.id in trending_ids:
            spike_start = now - timedelta(hours=random.uniform(0, 48))
            timestamp = spike_start + timedelta(minutes=random.uniform(0, 60))
        else:
            days_back = random.expovariate(0.1)
            days_back = min(days_back, 30)
            timestamp = now - timedelta(days=days_back, seconds=random.uniform(0, 86400))

        dwell_ms = None
        if event_type in ("view", "click"):
            dwell_ms = int(random.expovariate(1 / 45000))  # avg 45s
            dwell_ms = max(500, min(dwell_ms, 600_000))

        session_id = f"sess_{user.id}_{int(timestamp.timestamp()) // 3600}"

        events.append(Event(
            user_id=user.id,
            content_id=content.id,
            event_type=event_type,
            dwell_time_ms=dwell_ms,
            session_id=session_id,
            context={"page": random.choice(["home", "discover"]), "position": random.randint(0, 20)},
            timestamp=timestamp,
        ))

        # Update stats counters
        s = stats_map[content.id]
        if event_type == "view": s["views"] += 1
        elif event_type == "like": s["likes"] += 1
        elif event_type == "share": s["shares"] += 1
        elif event_type == "save": s["saves"] += 1
        elif event_type == "comment": s["comments"] += 1
        elif event_type == "skip": s["skips"] += 1
        elif event_type == "hide": s["hides"] += 1
        elif event_type == "report": s["reports"] += 1

    # Build ContentStats
    content_stats: List[ContentStats] = []
    for content in contents:
        s = stats_map[content.id]
        views = max(s["views"], 1)
        engagement = (
            s["likes"] + s["shares"] * 2 + s["saves"] * 1.5 + s["comments"] * 1.2
        ) / views
        content_stats.append(ContentStats(
            content_id=content.id,
            views=s["views"],
            likes=s["likes"],
            shares=s["shares"],
            saves=s["saves"],
            comments=s["comments"],
            skip_count=s["skips"],
            hide_count=s["hides"],
            report_count=s["reports"],
            skip_rate=s["skips"] / views,
            engagement_score=engagement,
        ))

    return events, content_stats


def _build_faiss_index(contents: List[Content], embeddings: np.ndarray):
    os.makedirs("data", exist_ok=True)
    faiss.normalize_L2(embeddings)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(embeddings)
    faiss.write_index(index, settings.faiss_index_path)

    id_map = [c.id for c in contents]
    with open("data/content_id_map.json", "w") as f:
        json.dump(id_map, f)

    logger.info("FAISS index written: %d vectors → %s", len(id_map), settings.faiss_index_path)


def _compute_user_features(
    users: List[User],
    events: List[Event],
    contents: List[Content],
) -> List[UserFeatures]:
    content_emb_map = {c.id: c.embedding for c in contents}
    EVENT_WEIGHTS = {
        "like": 1.0, "comment": 0.9, "share": 0.8, "save": 0.7,
        "click": 0.4, "view": 0.3, "follow": 0.5,
        "skip": -0.5, "hide": -1.0, "report": -1.5,
    }

    user_events: Dict[str, List[Event]] = {}
    for ev in events:
        user_events.setdefault(ev.user_id, []).append(ev)

    features: List[UserFeatures] = []
    for user in users:
        evs = user_events.get(user.id, [])
        weighted_sum = np.zeros(EMBEDDING_DIM, dtype=np.float64)
        total_weight = 0.0

        for ev in evs[:500]:
            emb = content_emb_map.get(ev.content_id)
            if emb is None:
                continue
            w = EVENT_WEIGHTS.get(ev.event_type, 0.0)
            weighted_sum += w * np.array(emb, dtype=np.float64)
            total_weight += abs(w)

        if total_weight > 0:
            vec = (weighted_sum / total_weight).astype(np.float32)
        else:
            vec = np.random.randn(EMBEDDING_DIM).astype(np.float32)
        norm = np.linalg.norm(vec)
        vec = vec / (norm + 1e-9)

        features.append(UserFeatures(user_id=user.id, embedding=vec.tolist()))

    return features


def run(n_users: int = 500, n_content: int = 2000, n_events: int = 50_000):
    logger.info("Loading sentence-transformers model…")
    model = SentenceTransformer(settings.embedding_model)

    engine = _get_engine()
    # Ensure tables exist
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session: Session = SessionLocal()

    try:
        # Clear existing data (order matters due to FK constraints)
        logger.info("Clearing existing data…")
        for tbl in ["recsys_experiment_logs", "recsys_experiments", "recsys_user_features",
                    "recsys_content_stats", "recsys_events", "recsys_follows",
                    "recsys_content", "recsys_users"]:
            session.execute(text(f"DELETE FROM {tbl}"))
        session.commit()

        # ── Users ──
        logger.info("Generating %d users…", n_users)
        users = _generate_users(n_users)
        session.bulk_save_objects(users)
        session.commit()

        # ── Content ──
        logger.info("Generating %d content items…", n_content)
        contents, embeddings = _generate_content(n_content, users, model)
        session.bulk_save_objects(contents)
        session.commit()

        # ── Follows ──
        logger.info("Generating follow graph…")
        follows = _generate_follows(users)
        _update_follower_counts(session, users, follows)
        session.bulk_save_objects(follows)
        session.commit()

        # ── Events + Stats ──
        logger.info("Generating %d events…", n_events)
        events, stats = _generate_events(users, contents, n_events)

        batch_size = 5000
        for i in range(0, len(events), batch_size):
            session.bulk_save_objects(events[i:i + batch_size])
            session.commit()
            logger.info("  events %d/%d", min(i + batch_size, len(events)), len(events))

        session.bulk_save_objects(stats)
        session.commit()

        # ── User Features ──
        logger.info("Computing user embeddings…")
        user_features = _compute_user_features(users, events, contents)
        session.bulk_save_objects(user_features)
        session.commit()

        # ── FAISS Index ──
        logger.info("Building FAISS index…")
        _build_faiss_index(contents, embeddings)

        logger.info("✓ Simulation complete!")
        logger.info("  Users:   %d", len(users))
        logger.info("  Content: %d", len(contents))
        logger.info("  Events:  %d", len(events))
        logger.info("  Follows: %d", len(follows))

    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the recommendation system with synthetic data")
    parser.add_argument("--users", type=int, default=500)
    parser.add_argument("--content", type=int, default=2000)
    parser.add_argument("--events", type=int, default=50_000)
    args = parser.parse_args()
    run(n_users=args.users, n_content=args.content, n_events=args.events)
