"""Pydantic v2 schemas for API request/response validation."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator


class EventType(str, Enum):
    view = "view"
    click = "click"
    like = "like"
    comment = "comment"
    share = "share"
    save = "save"
    skip = "skip"
    hide = "hide"
    report = "report"
    follow = "follow"


class EventPayload(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=64)
    content_id: str = Field(..., min_length=1, max_length=64)
    event_type: EventType
    dwell_time_ms: Optional[int] = Field(None, ge=0)
    session_id: str = Field(..., min_length=1, max_length=64)
    timestamp: datetime
    context: Dict[str, Any] = Field(default_factory=dict)


class FeedRequest(BaseModel):
    user_id: str
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class DebugInfo(BaseModel):
    embedding_sim: float = 0.0
    topic_score: float = 0.0
    network_score: float = 0.0
    recency_score: float = 0.0
    quality_score: float = 0.0
    viral_velocity: float = 0.0


class ExplanationInfo(BaseModel):
    primary_reason: str
    signals_used: List[str] = Field(default_factory=list)


class FeedItem(BaseModel):
    content_id: str
    title: str
    author: str
    author_id: str
    topics: List[str] = Field(default_factory=list)
    content_type: str
    created_at: datetime
    recommendation_score: float
    retrieval_source: List[str] = Field(default_factory=list)
    explanation: ExplanationInfo
    debug: DebugInfo


class FeedResponse(BaseModel):
    user_id: str
    feed_type: str
    page: int
    page_size: int
    total_candidates: int
    items: List[FeedItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ExplainResponse(BaseModel):
    user_id: str
    content_id: str
    recommendation_score: float
    explanation: ExplanationInfo
    debug: DebugInfo
    feature_breakdown: Dict[str, float]


class VariantResult(BaseModel):
    variant_id: str
    impressions: int
    clicks: int
    ctr: float
    mean_dwell_time_ms: float
    engagement_rate: float


class ExperimentResult(BaseModel):
    experiment_id: str
    experiment_name: str
    metric: str
    variants: List[VariantResult]
    start_date: datetime
    is_active: bool


class CandidatePoolMetrics(BaseModel):
    embedding_similarity: int
    collaborative_filtering: int
    social_graph: int
    trending: int
    emerging_creator: int
    total_after_dedup: int


class MetricsResponse(BaseModel):
    period_hours: int = 24
    ctr: float
    mean_dwell_time_ms: Dict[str, float]   # per feed type
    diversity_score: float
    negative_signal_rate: float
    feed_freshness_hours: float
    candidate_pool_sizes: CandidatePoolMetrics
    total_events_24h: int
    active_users_24h: int
    p_engage_histogram: List[float]        # 10 buckets [0,1]
