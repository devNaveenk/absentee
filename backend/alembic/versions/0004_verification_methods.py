"""tenant verification methods (state/jurisdiction-configurable verification)

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-27

"""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("verification_methods", sa.JSON, nullable=True))
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            UPDATE tenants
            SET verification_methods = CASE
                WHEN jurisdiction_state = 'GA' THEN '["full_name", "address", "dl_number"]'
                ELSE '["full_name", "address", "signature"]'
            END
            WHERE verification_methods IS NULL
            """
        )
    )
    op.alter_column("tenants", "verification_methods", existing_type=sa.JSON, nullable=False)


def downgrade() -> None:
    op.drop_column("tenants", "verification_methods")
