"""split approved/abs_sent status, sms cure notification method, received_via + mailing_address

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-01

"""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE absentee_applications MODIFY COLUMN status "
        "ENUM('unprocessed','approved','rejected','cure','reapproved','abs_sent') "
        "NOT NULL DEFAULT 'unprocessed'"
    )
    op.execute(
        "ALTER TABLE tenants MODIFY COLUMN cure_notification_method "
        "ENUM('email','sms','mail','both') NOT NULL DEFAULT 'email'"
    )

    op.add_column("absentee_applications", sa.Column("mailing_address", sa.String(500), nullable=True))
    op.add_column("absentee_applications", sa.Column("received_via", sa.String(50), nullable=True))

    op.add_column("tenants", sa.Column("received_via_options", sa.JSON, nullable=True))
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE tenants
            SET received_via_options = '["mail", "in_person", "online", "drop_box"]'
            WHERE received_via_options IS NULL
            """
        )
    )
    op.alter_column("tenants", "received_via_options", existing_type=sa.JSON, nullable=False)


def downgrade() -> None:
    op.drop_column("tenants", "received_via_options")
    op.drop_column("absentee_applications", "received_via")
    op.drop_column("absentee_applications", "mailing_address")
    op.execute(
        "ALTER TABLE tenants MODIFY COLUMN cure_notification_method "
        "ENUM('email','mail','both') NOT NULL DEFAULT 'email'"
    )
    op.execute(
        "ALTER TABLE absentee_applications MODIFY COLUMN status "
        "ENUM('unprocessed','rejected','cure','reapproved','abs_sent') "
        "NOT NULL DEFAULT 'unprocessed'"
    )
