"""SQLAlchemy ORM models — all tables prefixed with recsys_ to coexist with impactshala."""

from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "recsys_users"

    id = Column(String(64), primary_key=True)
    username = Column(String(128), unique=True, nullable=False)
    email = Column(String(256), unique=True, nullable=False)
    interests = Column(ARRAY(String), default=list)
    profession = Column(String(128), nullable=True)
    location = Column(String(128), nullable=True)
    follower_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    events = relationship("Event", back_populates="user", lazy="dynamic")
    features = relationship("UserFeatures", back_populates="user", uselist=False)


class Content(Base):
    __tablename__ = "recsys_content"

    id = Column(String(64), primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String(32), nullable=False)
    author_id = Column(String(64), ForeignKey("recsys_users.id"), nullable=False)
    topics = Column(ARRAY(String), default=list)
    embedding = Column(JSONB, nullable=True)
    metadata_ = Column("metadata", JSONB, default=dict)
    spam_flag_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    author = relationship("User", foreign_keys=[author_id])
    stats = relationship("ContentStats", back_populates="content", uselist=False)


class Event(Base):
    __tablename__ = "recsys_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("recsys_users.id"), nullable=False)
    content_id = Column(String(64), ForeignKey("recsys_content.id"), nullable=False)
    event_type = Column(String(32), nullable=False)
    dwell_time_ms = Column(Integer, nullable=True)
    session_id = Column(String(64), nullable=False)
    context = Column(JSONB, default=dict)
    timestamp = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", back_populates="events")
    content = relationship("Content")


class Follow(Base):
    __tablename__ = "recsys_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "followee_id", "entity_type"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    follower_id = Column(String(64), ForeignKey("recsys_users.id"), nullable=False)
    followee_id = Column(String(64), nullable=False)
    entity_type = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    follower = relationship("User", foreign_keys=[follower_id])


class ContentStats(Base):
    __tablename__ = "recsys_content_stats"

    content_id = Column(String(64), ForeignKey("recsys_content.id"), primary_key=True)
    views = Column(BigInteger, default=0)
    likes = Column(BigInteger, default=0)
    shares = Column(BigInteger, default=0)
    saves = Column(BigInteger, default=0)
    comments = Column(BigInteger, default=0)
    skip_count = Column(BigInteger, default=0)
    hide_count = Column(BigInteger, default=0)
    report_count = Column(BigInteger, default=0)
    skip_rate = Column(Float, default=0.0)
    engagement_score = Column(Float, default=0.0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    content = relationship("Content", back_populates="stats")


class UserFeatures(Base):
    __tablename__ = "recsys_user_features"

    user_id = Column(String(64), ForeignKey("recsys_users.id"), primary_key=True)
    embedding = Column(JSONB, nullable=True)
    interest_vector = Column(JSONB, default=dict)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="features")


class Experiment(Base):
    __tablename__ = "recsys_experiments"

    id = Column(String(64), primary_key=True)
    name = Column(String(256), nullable=False)
    variants = Column(JSONB, nullable=False)
    metric = Column(String(128), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    logs = relationship("ExperimentLog", back_populates="experiment", lazy="dynamic")


class ExperimentLog(Base):
    __tablename__ = "recsys_experiment_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    experiment_id = Column(String(64), ForeignKey("recsys_experiments.id"), nullable=False)
    user_id = Column(String(64), nullable=False)
    variant_id = Column(String(64), nullable=False)
    request_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    metadata_ = Column("metadata", JSONB, default=dict)

    experiment = relationship("Experiment", back_populates="logs")
