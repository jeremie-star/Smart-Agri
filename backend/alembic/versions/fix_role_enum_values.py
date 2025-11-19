"""Update existing role values to match enum format

Revision ID: fix_role_enum_values
Revises: add_role_to_farmers
Create Date: 2025-11-18

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_role_enum_values'
down_revision = 'add_role_to_farmers'
branch_labels = None
depends_on = None


def upgrade():
    # Update existing lowercase 'farmer' to uppercase 'FARMER' to match enum
    # This is safe because all existing records have 'farmer' as default
    op.execute("UPDATE farmers SET role = 'FARMER' WHERE role = 'farmer'")


def downgrade():
    # Revert back to lowercase
    op.execute("UPDATE farmers SET role = 'farmer' WHERE role = 'FARMER'")
