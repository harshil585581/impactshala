"""Database engine, session factory, and Redis pool — Supabase-aware."""

from typing import AsyncGenerator

import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from apps.api.config import get_settings

settings = get_settings()

# ── PostgreSQL (async via asyncpg) ────────────────────────────────────────────
# Supabase Supavisor (transaction-mode pooler) does NOT support prepared
# statements, so we disable them with prepared_statement_cache_size=0.
engine = create_async_engine(
    settings.database_url,
    connect_args={
        **settings.db_connect_args,
        # Disable server-side prepared statements for Supavisor compatibility
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=(settings.app_env == "development"),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── Redis ─────────────────────────────────────────────────────────────────────
_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


async def close_redis() -> None:
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None
