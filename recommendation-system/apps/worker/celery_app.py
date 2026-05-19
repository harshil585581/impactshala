"""Celery application factory."""

from celery import Celery
from celery.schedules import crontab

from apps.api.config import get_settings

settings = get_settings()

celery_app = Celery(
    "recsys",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["apps.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

celery_app.conf.beat_schedule = {
    # Every 5 minutes: recompute trending
    "recompute-trending": {
        "task": "apps.worker.tasks.recompute_trending",
        "schedule": 300.0,
    },
    # Every 30 minutes: update content stats and hot user embeddings
    "update-content-stats": {
        "task": "apps.worker.tasks.update_content_stats",
        "schedule": 1800.0,
    },
    "update-hot-user-embeddings": {
        "task": "apps.worker.tasks.update_hot_user_embeddings",
        "schedule": 1800.0,
    },
    # Every 6 hours: full recompute
    "full-recompute-interests": {
        "task": "apps.worker.tasks.full_recompute_interest_graphs",
        "schedule": 21600.0,
    },
    "rebuild-faiss-index": {
        "task": "apps.worker.tasks.rebuild_faiss_index",
        "schedule": 21600.0,
    },
    "aggregate-ab-metrics": {
        "task": "apps.worker.tasks.aggregate_ab_metrics",
        "schedule": 21600.0,
    },
}
