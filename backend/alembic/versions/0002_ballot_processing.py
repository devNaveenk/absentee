"""voters, absentee applications, application events, tenant processing config

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-27

"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "processing_mode",
            sa.Enum("scan", "manual", name="processingmode"),
            nullable=False,
            server_default="manual",
        ),
    )
    op.add_column("tenants", sa.Column("jurisdiction_state", sa.String(2), nullable=True))
    op.add_column(
        "tenants",
        sa.Column(
            "cure_notification_method",
            sa.Enum("email", "mail", "both", name="curenotificationmethod"),
            nullable=False,
            server_default="email",
        ),
    )

    op.create_table(
        "voters",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tenant_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("external_voter_id", sa.String(50), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("registered_address", sa.String(500), nullable=False),
        sa.Column("date_of_birth", sa.Date, nullable=True),
        sa.Column("dl_number", sa.String(50), nullable=True),
        sa.Column("veteran_id", sa.String(50), nullable=True),
        sa.Column("passport_id", sa.String(50), nullable=True),
        sa.Column("signature_image_path", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "external_voter_id", name="uq_tenant_external_voter"),
    )
    op.create_index("ix_voters_tenant_id", "voters", ["tenant_id"])
    op.create_index("ix_voters_full_name", "voters", ["full_name"])

    op.create_table(
        "absentee_applications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tenant_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("application_number", sa.String(50), nullable=False),
        sa.Column("voter_id", sa.Integer, sa.ForeignKey("voters.id"), nullable=True),
        sa.Column("parent_application_id", sa.Integer, sa.ForeignKey("absentee_applications.id"), nullable=True),
        sa.Column("is_reapproval", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column(
            "status",
            sa.Enum("unprocessed", "rejected", "cure", "reapproved", "abs_sent", name="applicationstatus"),
            nullable=False,
            server_default="unprocessed",
        ),
        sa.Column("submitted_full_name", sa.String(255), nullable=False),
        sa.Column("submitted_address", sa.String(500), nullable=False),
        sa.Column("submitted_dl_number", sa.String(50), nullable=True),
        sa.Column("scan_image_path", sa.String(500), nullable=True),
        sa.Column("ocr_raw_response", sa.JSON, nullable=True),
        sa.Column(
            "rejection_reason",
            sa.Enum("out_of_district", "record_not_found", name="rejectionreason"),
            nullable=True,
        ),
        sa.Column(
            "cure_reason",
            sa.Enum("name_mismatch", "dl_mismatch", "other", name="curereason"),
            nullable=True,
        ),
        sa.Column("cure_notified_via", sa.String(20), nullable=True),
        sa.Column("processed_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("processed_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "application_number", name="uq_tenant_application_number"),
    )
    op.create_index("ix_absentee_applications_tenant_id", "absentee_applications", ["tenant_id"])
    op.create_index("ix_absentee_applications_voter_id", "absentee_applications", ["voter_id"])
    op.create_index("ix_absentee_applications_parent_application_id", "absentee_applications", ["parent_application_id"])
    op.create_index("ix_absentee_applications_status", "absentee_applications", ["status"])
    op.create_index("ix_absentee_applications_created_at", "absentee_applications", ["created_at"])

    op.create_table(
        "application_events",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("application_id", sa.Integer, sa.ForeignKey("absentee_applications.id"), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("actor_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("event_metadata", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])


def downgrade() -> None:
    op.drop_table("application_events")
    op.drop_index("ix_absentee_applications_created_at", table_name="absentee_applications")
    op.drop_index("ix_absentee_applications_status", table_name="absentee_applications")
    op.drop_index("ix_absentee_applications_parent_application_id", table_name="absentee_applications")
    op.drop_index("ix_absentee_applications_voter_id", table_name="absentee_applications")
    op.drop_index("ix_absentee_applications_tenant_id", table_name="absentee_applications")
    op.drop_table("absentee_applications")
    op.drop_index("ix_voters_full_name", table_name="voters")
    op.drop_index("ix_voters_tenant_id", table_name="voters")
    op.drop_table("voters")
    op.drop_column("tenants", "cure_notification_method")
    op.drop_column("tenants", "jurisdiction_state")
    op.drop_column("tenants", "processing_mode")
    sa.Enum(name="curereason").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="rejectionreason").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="applicationstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="curenotificationmethod").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="processingmode").drop(op.get_bind(), checkfirst=True)
