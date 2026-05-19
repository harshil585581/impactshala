# Content Recommendation System

A production-grade, LinkedIn-inspired content recommendation engine with personalized Home and Discover feeds, real-time feedback loops, and full explainability.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  Client (Web / Mobile)                                     │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTP
┌──────────────────────▼─────────────────────────────────────┐
│  FastAPI  (apps/api)                                       │
│  POST /events/track  GET /feed/home  GET /feed/discover    │
│  GET /feed/explain   POST /admin/retrain  GET /admin/metrics│
└──────┬──────────────────────────────────┬──────────────────┘
       │                                  │
  AsyncPG/                           Redis (cache,
  SQLAlchemy                         streams, sorted sets)
       │                                  │
┌──────▼──────────────────────────────────▼──────────────────┐
│  Supabase PostgreSQL                Redis 7                 │
│  (users, content, events,           (trending, sessions,   │
│   follows, experiments)              feed cache, embeddings)│
└─────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│  Celery Workers  (apps/worker)                              │
│  Beat scheduler: trending (5m), stats (30m), FAISS (6h)    │
└─────────────────────────────────────────────────────────────┘

Recommendation Pipeline (per request):
  1. Candidate Generation (5 strategies → up to 500 candidates)
  2. Feature Engineering  (embeddings, interest graph, session signals)
  3. Gradient-Boosted Ranking  →  P(engage) per candidate
  4. Re-ranking + Diversity Filters + Business Rules
  5. Paginated Feed Response with Explanations
```

### Layer Summary

| Layer | Module | Purpose |
|-------|--------|---------|
| 1 | `apps/api/routers/events.py` | Event ingestion, Redis streaming |
| 2 | `packages/feature_store/` | User/content embeddings, interest graph, session signals |
| 3 | `packages/candidate_gen/` | 5 retrieval strategies → candidate pool |
| 4 | `packages/ranking/` | GBM ranker, home/discover-specific ranking |
| 5 | `packages/feedback/` | Quality filters, diversity rules, feed assembly |
| 6 | `apps/worker/` | Celery beat: trending, stats, FAISS rebuild |

---

## Prerequisites

- Python 3.11+
- Docker & Docker Compose
- A [Supabase](https://supabase.com) project (free tier works)
- Redis (via Docker or [Upstash](https://upstash.com))

---

## Quick Start

### 1. Clone and install

```bash
cd recommendation-system
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in your Supabase credentials:
#   DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
#   SYNC_DATABASE_URL=postgresql+psycopg2://postgres:<password>@db.<ref>.supabase.co:5432/postgres
```

> **Supabase connection strings** are at:
> Dashboard → Project Settings → Database → Connection string

### 3. Run database migrations

```bash
alembic upgrade head
```

### 4. Start Redis and Celery (Docker)

```bash
cd infra
docker compose up redis celery-worker celery-beat -d
```

### 5. Seed with synthetic data

```bash
# Full dataset (≈ 5–10 min, downloads the embedding model on first run)
python -m apps.simulator.generate

# Quick test dataset
python -m apps.simulator.generate --users 50 --content 200 --events 2000
```

### 6. Start the API

```bash
uvicorn apps.api.main:app --reload --port 8000
```

Or run everything via Docker:

```bash
cd infra
docker compose up --build
```

API docs available at `http://localhost:8000/docs`.

---

## API Endpoints

### Track an event

```bash
curl -X POST http://localhost:8000/events/track \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u001",
    "content_id": "c042",
    "event_type": "like",
    "session_id": "sess_abc",
    "timestamp": "2024-01-15T10:30:00Z",
    "context": {"page": "home", "position": 3}
  }'
```

### Get home feed

```bash
curl "http://localhost:8000/feed/home?user_id=u001&page=1"
```

### Get discover feed

```bash
curl "http://localhost:8000/feed/discover?user_id=u001&page=1"
```

### Explain a recommendation

```bash
curl "http://localhost:8000/feed/explain?user_id=u001&content_id=c042"
```

Sample response:
```json
{
  "user_id": "u001",
  "content_id": "c042",
  "recommendation_score": 0.8432,
  "explanation": {
    "primary_reason": "Matches your interests",
    "signals_used": ["matches_interests", "similar_to_liked_content", "recently_published"]
  },
  "debug": {
    "embedding_sim": 0.7821,
    "topic_score": 0.9100,
    "network_score": 0.0,
    "recency_score": 0.9500
  },
  "feature_breakdown": { ... }
}
```

### System metrics

```bash
curl http://localhost:8000/admin/metrics
```

### Trigger model retrain

```bash
curl -X POST http://localhost:8000/admin/retrain
```

### A/B experiment results

```bash
curl http://localhost:8000/experiments/{experiment_id}/results
```

---

## How to Add a New Ranking Signal

1. **Add the field** to `RankingFeatures` in [packages/ranking/ranker.py](packages/ranking/ranker.py):

```python
@dataclass
class RankingFeatures:
    ...
    my_new_signal: float = 0.0   # add here
```

2. **Update `to_vector()` and `feature_names()`** — both must stay in sync (same order, same length).

3. **Compute the signal** in `_compute_features()`:

```python
# Inside RankingModel._compute_features()
feats.my_new_signal = await self._compute_my_signal(user_id, candidate)
```

4. **Retrain the model**:

```bash
curl -X POST http://localhost:8000/admin/retrain
```

The GBM will automatically learn the weight of your new signal from historical data.

---

## Running Tests

```bash
pytest tests/ -v --tb=short
```

Coverage:

```bash
pytest tests/ --cov=packages --cov-report=term-missing
```

---

## Project Structure

```
recommendation-system/
├── apps/
│   ├── api/                  # FastAPI app + routers
│   │   ├── main.py
│   │   ├── config.py         # pydantic-settings (Supabase URLs, Redis, ML paths)
│   │   ├── database.py       # SQLAlchemy async engine (SSL for Supabase)
│   │   └── routers/
│   │       ├── events.py     # POST /events/track
│   │       ├── feed.py       # GET /feed/home|discover|explain
│   │       ├── admin.py      # POST /admin/retrain, GET /admin/metrics
│   │       └── experiments.py# GET /experiments/{id}/results
│   ├── worker/
│   │   ├── celery_app.py     # Celery + Beat schedule
│   │   └── tasks.py          # Trending, stats, FAISS rebuild, A/B aggregation
│   └── simulator/
│       └── generate.py       # Synthetic data generator (500 users, 2k content, 50k events)
├── packages/
│   ├── models/               # SQLAlchemy ORM + Pydantic v2 schemas
│   ├── feature_store/        # FeatureService: embeddings, interest graph, session signals
│   ├── candidate_gen/        # CandidateGenerator: 5 retrieval strategies
│   ├── ranking/              # RankingModel: GBM + home/discover ranking logic
│   └── feedback/             # FeedFilter, FeedBuilder, ABExperimentService
├── infra/
│   ├── docker-compose.yml    # Redis + API + Celery (Supabase is external)
│   ├── Dockerfile
│   └── redis/redis.conf
├── alembic/                  # DB migrations
├── tests/                    # pytest unit tests
├── data/                     # FAISS index + model artifacts (git-ignored)
├── requirements.txt
└── .env.example
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Supabase** for PostgreSQL | Managed, zero-ops, SSL by default, free tier for dev |
| **FAISS** for ANN | In-process, no extra service; rebuilt every 6h by Celery |
| **Redis sorted sets** for trending | O(log N) updates, instant top-K reads |
| **GBM ranker** (sklearn) | Interpretable, fast inference, works with <100k samples |
| **Online learning** (lr=0.01) | User embedding adapts immediately on like/save/hide |
| **Supavisor** (port 6543) | Transaction-mode pooler; disabled prepared statements to avoid conflicts |

---

## Celery Beat Schedule

| Task | Interval | Effect |
|------|----------|--------|
| `recompute_trending` | 5 min | Refreshes `trending:global` + per-topic sorted sets |
| `update_content_stats` | 30 min | Recomputes `content_stats` for active content |
| `update_hot_user_embeddings` | 30 min | Recomputes embeddings for users with ≥5 new events |
| `full_recompute_interest_graphs` | 6 hours | Flushes and lazily recomputes all interest graphs |
| `rebuild_faiss_index` | 6 hours | Rebuilds FAISS with all content embeddings from DB |
| `aggregate_ab_metrics` | 6 hours | Snapshots A/B CTR/dwell metrics to Redis |
