"""GET /experiments/{id}/results — A/B experiment results."""

import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

import redis.asyncio as aioredis

from apps.api.database import get_db, get_redis
from packages.models.database import Experiment, ExperimentLog, Event

router = APIRouter(prefix="/experiments", tags=["experiments"])
logger = logging.getLogger(__name__)


@router.get("/{experiment_id}/results")
async def get_experiment_results(
    experiment_id: str,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    # Try cached metrics first
    cached = await redis.get(f"ab:metrics:{experiment_id}")
    if cached:
        cached_metrics = json.loads(cached)
    else:
        cached_metrics = {}

    exp_result = await db.execute(
        select(Experiment).where(Experiment.id == experiment_id)
    )
    exp = exp_result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    variants_result = []
    for variant in exp.variants:
        vid = variant["id"]

        # User IDs assigned to this variant
        users_result = await db.execute(
            select(ExperimentLog.user_id)
            .where(
                and_(
                    ExperimentLog.experiment_id == experiment_id,
                    ExperimentLog.variant_id == vid,
                )
            )
            .distinct()
        )
        user_ids = [r.user_id for r in users_result.fetchall()]
        impressions = len(user_ids)

        if not user_ids:
            variants_result.append({
                "variant_id": vid,
                "impressions": 0,
                "clicks": 0,
                "ctr": 0.0,
                "mean_dwell_time_ms": 0.0,
                "engagement_rate": 0.0,
            })
            continue

        # Metrics from events
        clicks = (
            await db.execute(
                select(func.count())
                .select_from(Event)
                .where(
                    and_(
                        Event.user_id.in_(user_ids),
                        Event.event_type == "click",
                        Event.timestamp >= exp.start_date,
                    )
                )
            )
        ).scalar() or 0

        dwell = (
            await db.execute(
                select(func.avg(Event.dwell_time_ms))
                .where(
                    and_(
                        Event.user_id.in_(user_ids),
                        Event.dwell_time_ms.isnot(None),
                        Event.timestamp >= exp.start_date,
                    )
                )
            )
        ).scalar() or 0

        engagements = (
            await db.execute(
                select(func.count())
                .select_from(Event)
                .where(
                    and_(
                        Event.user_id.in_(user_ids),
                        Event.event_type.in_(["like", "share", "save", "comment"]),
                        Event.timestamp >= exp.start_date,
                    )
                )
            )
        ).scalar() or 0

        variants_result.append({
            "variant_id": vid,
            "impressions": impressions,
            "clicks": clicks,
            "ctr": round(clicks / max(impressions, 1), 4),
            "mean_dwell_time_ms": round(float(dwell), 1),
            "engagement_rate": round(engagements / max(impressions, 1), 4),
        })

    return {
        "experiment_id": experiment_id,
        "experiment_name": exp.name,
        "metric": exp.metric,
        "variants": variants_result,
        "start_date": exp.start_date.isoformat(),
        "is_active": exp.is_active,
    }
