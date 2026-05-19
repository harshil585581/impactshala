"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apps.api.config import get_settings
from apps.api.database import close_redis, get_redis
from apps.api.routers import admin, events, experiments, feed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting recommendation system API (env=%s)", settings.app_env)
    try:
        redis = await get_redis()
        pong = await redis.ping()
        logger.info("Redis connected: %s", pong)
    except Exception as e:
        logger.warning("Redis not available at startup (%s) — caching disabled", e)
    yield
    await close_redis()
    logger.info("Redis closed")


app = FastAPI(
    title="Content Recommendation System",
    description=(
        "Production-grade LinkedIn-inspired recommendation engine. "
        "Provides personalized home and discover feeds with full "
        "explainability and A/B testing support."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(feed.router)
app.include_router(admin.router)
app.include_router(experiments.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
