"""Initial schema — all tables prefixed recsys_ to coexist with impactshala

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # recsys_users
    op.create_table(
        "recsys_users",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("username", sa.String(128), unique=True, nullable=False),
        sa.Column("email", sa.String(256), unique=True, nullable=False),
        sa.Column("interests", ARRAY(sa.String), nullable=True),
        sa.Column("profession", sa.String(128), nullable=True),
        sa.Column("location", sa.String(128), nullable=True),
        sa.Column("follower_count", sa.Integer, server_default="0"),
        sa.Column("following_count", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # recsys_content
    op.create_table(
        "recsys_content",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("content_type", sa.String(32), nullable=False),
        sa.Column("author_id", sa.String(64), sa.ForeignKey("recsys_users.id"), nullable=False),
        sa.Column("topics", ARRAY(sa.String), nullable=True),
        sa.Column("embedding", JSONB, nullable=True),
        sa.Column("metadata", JSONB, server_default="{}"),
        sa.Column("spam_flag_count", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_recsys_content_author_id", "recsys_content", ["author_id"])
    op.create_index("ix_recsys_content_created_at", "recsys_content", ["created_at"])

    # recsys_events
    op.create_table(
        "recsys_events",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("recsys_users.id"), nullable=False),
        sa.Column("content_id", sa.String(64), sa.ForeignKey("recsys_content.id"), nullable=False),
        sa.Column("event_type", sa.String(32), nullable=False),
        sa.Column("dwell_time_ms", sa.Integer, nullable=True),
        sa.Column("session_id", sa.String(64), nullable=False),
        sa.Column("context", JSONB, server_default="{}"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_recsys_events_user_id", "recsys_events", ["user_id"])
    op.create_index("ix_recsys_events_content_id", "recsys_events", ["content_id"])
    op.create_index("ix_recsys_events_timestamp", "recsys_events", ["timestamp"])
    op.create_index("ix_recsys_events_session_id", "recsys_events", ["session_id"])

    # recsys_follows
    op.create_table(
        "recsys_follows",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("follower_id", sa.String(64), sa.ForeignKey("recsys_users.id"), nullable=False),
        sa.Column("followee_id", sa.String(64), nullable=False),
        sa.Column("entity_type", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("follower_id", "followee_id", "entity_type", name="uq_recsys_follows"),
    )
    op.create_index("ix_recsys_follows_follower_id", "recsys_follows", ["follower_id"])
    op.create_index("ix_recsys_follows_followee_id", "recsys_follows", ["followee_id"])

    # recsys_content_stats
    op.create_table(
        "recsys_content_stats",
        sa.Column("content_id", sa.String(64), sa.ForeignKey("recsys_content.id"), primary_key=True),
        sa.Column("views", sa.BigInteger, server_default="0"),
        sa.Column("likes", sa.BigInteger, server_default="0"),
        sa.Column("shares", sa.BigInteger, server_default="0"),
        sa.Column("saves", sa.BigInteger, server_default="0"),
        sa.Column("comments", sa.BigInteger, server_default="0"),
        sa.Column("skip_count", sa.BigInteger, server_default="0"),
        sa.Column("hide_count", sa.BigInteger, server_default="0"),
        sa.Column("report_count", sa.BigInteger, server_default="0"),
        sa.Column("skip_rate", sa.Float, server_default="0.0"),
        sa.Column("engagement_score", sa.Float, server_default="0.0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # recsys_user_features
    op.create_table(
        "recsys_user_features",
        sa.Column("user_id", sa.String(64), sa.ForeignKey("recsys_users.id"), primary_key=True),
        sa.Column("embedding", JSONB, nullable=True),
        sa.Column("interest_vector", JSONB, server_default="{}"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # recsys_experiments
    op.create_table(
        "recsys_experiments",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("variants", JSONB, nullable=False),
        sa.Column("metric", sa.String(128), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default="true"),
    )

    # recsys_experiment_logs
    op.create_table(
        "recsys_experiment_logs",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("experiment_id", sa.String(64), sa.ForeignKey("recsys_experiments.id"), nullable=False),
        sa.Column("user_id", sa.String(64), nullable=False),
        sa.Column("variant_id", sa.String(64), nullable=False),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("metadata", JSONB, server_default="{}"),
    )
    op.create_index("ix_recsys_exp_logs_exp_id", "recsys_experiment_logs", ["experiment_id"])
    op.create_index("ix_recsys_exp_logs_user_id", "recsys_experiment_logs", ["user_id"])


def downgrade() -> None:
    op.drop_table("recsys_experiment_logs")
    op.drop_table("recsys_experiments")
    op.drop_table("recsys_user_features")
    op.drop_table("recsys_content_stats")
    op.drop_table("recsys_follows")
    op.drop_table("recsys_events")
    op.drop_table("recsys_content")
    op.drop_table("recsys_users")
