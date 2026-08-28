"""returned ballots (Phase 2)

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-27

"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "returned_ballots",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tenant_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("tracking_number", sa.String(50), nullable=False),
        sa.Column("voter_id", sa.Integer, sa.ForeignKey("voters.id"), nullable=True),
        sa.Column("absentee_application_id", sa.Integer, sa.ForeignKey("absentee_applications.id"), nullable=True),
        sa.Column(
            "status",
            sa.Enum("received", "verified", "rejected", name="returnedballotstatus"),
            nullable=False,
            server_default="received",
        ),
        sa.Column("submitted_full_name", sa.String(255), nullable=False),
        sa.Column("submitted_address", sa.String(500), nullable=False),
        sa.Column("envelope_scan_image_path", sa.String(500), nullable=True),
        sa.Column("ocr_raw_response", sa.JSON, nullable=True),
        sa.Column(
            "rejection_reason",
            sa.Enum(
                "already_voted_in_person",
                "moved_outside_jurisdiction",
                "deceased",
                "credential_mismatch",
                "signature_mismatch",
                name="returnedballotrejectionreason",
            ),
            nullable=True,
        ),
        sa.Column("processed_by_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("processed_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_returned_ballots_tenant_id", "returned_ballots", ["tenant_id"])
    op.create_index("ix_returned_ballots_voter_id", "returned_ballots", ["voter_id"])
    op.create_index("ix_returned_ballots_absentee_application_id", "returned_ballots", ["absentee_application_id"])
    op.create_index("ix_returned_ballots_status", "returned_ballots", ["status"])
    op.create_index("ix_returned_ballots_created_at", "returned_ballots", ["created_at"])

    op.create_table(
        "returned_ballot_events",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("returned_ballot_id", sa.Integer, sa.ForeignKey("returned_ballots.id"), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("actor_user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("event_metadata", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_returned_ballot_events_returned_ballot_id", "returned_ballot_events", ["returned_ballot_id"])


def downgrade() -> None:
    op.drop_table("returned_ballot_events")
    op.drop_index("ix_returned_ballots_created_at", table_name="returned_ballots")
    op.drop_index("ix_returned_ballots_status", table_name="returned_ballots")
    op.drop_index("ix_returned_ballots_absentee_application_id", table_name="returned_ballots")
    op.drop_index("ix_returned_ballots_voter_id", table_name="returned_ballots")
    op.drop_index("ix_returned_ballots_tenant_id", table_name="returned_ballots")
    op.drop_table("returned_ballots")
    sa.Enum(name="returnedballotrejectionreason").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="returnedballotstatus").drop(op.get_bind(), checkfirst=True)
