"""Add role column to farmers table

Revision ID: add_role_to_farmers
Revises: 4ceb091a5664
Create Date: 2025-11-18

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_role_to_farmers'
down_revision = '4ceb091a5664'
branch_labels = None
depends_on = None


def upgrade():
    # Add role column with default value 'FARMER' (uppercase to match enum)
    op.add_column('farmers', sa.Column('role', sa.String(length=20), nullable=False, server_default='FARMER'))


def downgrade():
    # Remove role column
    op.drop_column('farmers', 'role')
