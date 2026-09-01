"""per-tenant white-label branding (display name, logo, currency)

Revision ID: 0009
Revises: 0008
Create Date: 2026-09-01

"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("display_name", sa.String(255), nullable=True))
    op.add_column("tenants", sa.Column("logo_image_path", sa.String(500), nullable=True))
    op.add_column("tenants", sa.Column("currency", sa.String(3), nullable=False, server_default="USD"))


def downgrade() -> None:
    op.drop_column("tenants", "currency")
    op.drop_column("tenants", "logo_image_path")
    op.drop_column("tenants", "display_name")
