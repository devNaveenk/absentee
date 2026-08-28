"""voter search performance indexes (FULLTEXT on full_name, composite on dl_number)

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-27

"""
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_voters_tenant_dl", "voters", ["tenant_id", "dl_number"])
    op.execute("ALTER TABLE voters ADD FULLTEXT INDEX ft_voters_full_name (full_name)")


def downgrade() -> None:
    op.execute("ALTER TABLE voters DROP INDEX ft_voters_full_name")
    op.drop_index("ix_voters_tenant_dl", table_name="voters")
