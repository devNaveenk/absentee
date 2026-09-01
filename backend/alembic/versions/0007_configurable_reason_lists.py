"""tenant-configurable cure/reject reason lists (replace hardcoded enums with tenant JSON lists)

Revision ID: 0007
Revises: 0006
Create Date: 2026-09-01

"""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "absentee_applications", "rejection_reason", existing_type=sa.Enum(name="rejectionreason"), type_=sa.String(100)
    )
    op.alter_column(
        "absentee_applications", "cure_reason", existing_type=sa.Enum(name="curereason"), type_=sa.String(100)
    )
    op.alter_column(
        "returned_ballots",
        "rejection_reason",
        existing_type=sa.Enum(name="returnedballotrejectionreason"),
        type_=sa.String(100),
    )

    op.add_column("tenants", sa.Column("application_rejection_reasons", sa.JSON, nullable=True))
    op.add_column("tenants", sa.Column("application_cure_reasons", sa.JSON, nullable=True))
    op.add_column("tenants", sa.Column("ballot_rejection_reasons", sa.JSON, nullable=True))

    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE tenants
            SET application_rejection_reasons = '["out_of_district", "record_not_found"]'
            WHERE application_rejection_reasons IS NULL
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE tenants
            SET application_cure_reasons = '["name_mismatch", "dl_mismatch", "other"]'
            WHERE application_cure_reasons IS NULL
            """
        )
    )
    conn.execute(
        sa.text(
            """
            UPDATE tenants
            SET ballot_rejection_reasons = '["already_voted_in_person", "moved_outside_jurisdiction", "deceased", "credential_mismatch", "signature_mismatch"]'
            WHERE ballot_rejection_reasons IS NULL
            """
        )
    )

    op.alter_column("tenants", "application_rejection_reasons", existing_type=sa.JSON, nullable=False)
    op.alter_column("tenants", "application_cure_reasons", existing_type=sa.JSON, nullable=False)
    op.alter_column("tenants", "ballot_rejection_reasons", existing_type=sa.JSON, nullable=False)


def downgrade() -> None:
    op.drop_column("tenants", "ballot_rejection_reasons")
    op.drop_column("tenants", "application_cure_reasons")
    op.drop_column("tenants", "application_rejection_reasons")

    op.alter_column(
        "returned_ballots",
        "rejection_reason",
        existing_type=sa.String(100),
        type_=sa.Enum(
            "already_voted_in_person",
            "moved_outside_jurisdiction",
            "deceased",
            "credential_mismatch",
            "signature_mismatch",
            name="returnedballotrejectionreason",
        ),
    )
    op.alter_column(
        "absentee_applications",
        "cure_reason",
        existing_type=sa.String(100),
        type_=sa.Enum("name_mismatch", "dl_mismatch", "other", name="curereason"),
    )
    op.alter_column(
        "absentee_applications",
        "rejection_reason",
        existing_type=sa.String(100),
        type_=sa.Enum("out_of_district", "record_not_found", name="rejectionreason"),
    )
