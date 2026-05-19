"""Application configuration using pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Async URL used by SQLAlchemy throughout the app.
    # Use the Supavisor pooler URL (port 6543) for the app; direct URL for migrations.
    database_url: str = (
        "postgresql+asyncpg://postgres:password@db.project.supabase.co:5432/postgres"
    )
    # Sync URL for Alembic (psycopg2 driver, no pool)
    sync_database_url: str = (
        "postgresql+psycopg2://postgres:password@db.project.supabase.co:5432/postgres"
    )

    # ── Redis ─────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Celery ────────────────────────────────────────────────────────────────
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # ── App ───────────────────────────────────────────────────────────────────
    app_env: str = "development"
    secret_key: str = "change-me-in-production-32chars-min"
    log_level: str = "INFO"

    # ── ML ────────────────────────────────────────────────────────────────────
    faiss_index_path: str = "data/content_embeddings.index"
    embedding_model: str = "all-MiniLM-L6-v2"
    ranking_model_path: str = "data/ranking_model.pkl"

    # ── Feed ──────────────────────────────────────────────────────────────────
    home_feed_max_candidates: int = 500
    discover_feed_max_candidates: int = 300
    default_page_size: int = 20
    feed_cache_ttl: int = 300
    user_embedding_ttl: int = 3600
    content_embedding_ttl: int = 86400
    interest_graph_ttl: int = 1800
    session_window_size: int = 20

    # ── Ranking ───────────────────────────────────────────────────────────────
    freshness_boost_hours: int = 2
    freshness_boost_factor: float = 1.2
    home_max_age_days: int = 7
    discover_max_age_days: int = 30

    # ── Online learning ───────────────────────────────────────────────────────
    online_learning_rate: float = 0.01

    # ── Trending ──────────────────────────────────────────────────────────────
    trending_update_interval_minutes: int = 5

    @property
    def db_connect_args(self) -> dict:
        """
        SSL is required for Supabase.  asyncpg accepts ssl as a string shortcut
        or as an ssl.SSLContext.  'require' works for both direct and pooler URLs.
        """
        if self.app_env == "development" and "localhost" in self.database_url:
            return {}
        return {"ssl": "require"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
