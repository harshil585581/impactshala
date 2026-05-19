"""POST /events/track — ingest user interaction events."""

import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from apps.api.database import get_db, get_redis
from apps.api.config import get_settings
from packages.models.database import Event
from packages.models.schemas import EventPayload

router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger(__name__)
settings = get_settings()

NEGATIVE_EVENTS = {"skip", "hide", "report"}
NEGATIVE_PENALTIES = {"skip": -1, "hide": -3, "report": -5}


@router.post("/track", status_code=status.HTTP_202_ACCEPTED)
async def track_event(
    payload: EventPayload,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Ingests a user event:
    1. Validates and persists to PostgreSQL (Supabase).
    2. Pushes to Redis stream `events:raw`.
    3. Updates session sliding window.
    4. Applies immediate negative signal penalty if applicable.
    """
    # 1. Persist to DB
    event = Event(
        user_id=payload.user_id,
        content_id=payload.content_id,
        event_type=payload.event_type.value,
        dwell_time_ms=payload.dwell_time_ms,
        session_id=payload.session_id,
        context=payload.context,
        timestamp=payload.timestamp,
    )
    db.add(event)
    # Commit happens in get_db context manager

    # 2. Push to Redis stream
    stream_data = {
        "user_id": payload.user_id,
        "content_id": payload.content_id,
        "event_type": payload.event_type.value,
        "dwell_time_ms": str(payload.dwell_time_ms or 0),
        "session_id": payload.session_id,
        "timestamp": payload.timestamp.isoformat(),
    }
    await redis.xadd("events:raw", stream_data, maxlen=100_000)

    # 3. Session sliding window
    session_key = f"session:{payload.session_id}"
    session_data = json.dumps({
        "user_id": payload.user_id,
        "content_id": payload.content_id,
        "event_type": payload.event_type.value,
        "dwell_time_ms": payload.dwell_time_ms,
        "timestamp": payload.timestamp.isoformat(),
    })
    pipe = redis.pipeline()
    pipe.lpush(session_key, session_data)
    pipe.ltrim(session_key, 0, settings.session_window_size - 1)
    pipe.expire(session_key, 3600)

    # 4. Immediate negative signal
    if payload.event_type.value in NEGATIVE_EVENTS:
        penalty = NEGATIVE_PENALTIES[payload.event_type.value]
        neg_key = f"content:scores:{payload.user_id}"
        pipe.zincrby(neg_key, penalty, payload.content_id)
        pipe.expire(neg_key, 86400 * 30)

        if payload.event_type.value in ("hide", "report"):
            pipe.sadd(f"blocked:{payload.user_id}", payload.content_id)
            pipe.expire(f"blocked:{payload.user_id}", 86400 * 90)

    # Mark content as seen
    pipe.sadd(f"seen:{payload.user_id}", payload.content_id)
    pipe.expire(f"seen:{payload.user_id}", 86400 * 30)

    await pipe.execute()

    # Fire-and-forget async tasks via Celery for heavy processing
    from apps.worker.tasks import apply_negative_signal
    if payload.event_type.value in NEGATIVE_EVENTS:
        apply_negative_signal.delay(
            payload.user_id, payload.content_id, payload.event_type.value
        )

    return {"status": "accepted", "event_id": None}
