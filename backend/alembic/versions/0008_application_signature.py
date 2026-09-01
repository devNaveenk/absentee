"""request-form signature image on absentee applications (three-way signature view)

Revision ID: 0008
Revises: 0007
Create Date: 2026-09-01

"""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("absentee_applications", sa.Column("signature_image_path", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("absentee_applications", "signature_image_path")
