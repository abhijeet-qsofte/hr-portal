"""fix_permissions_constraint

Revision ID: 4f5a9c2d8e7b
Revises: 0066ca001c8e
Create Date: 2025-07-07 01:52:30.702687

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f5a9c2d8e7b'
down_revision = '0066ca001c8e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the existing unique index on permissions.name
    op.drop_index('ix_permissions_name', table_name='permissions')
    
    # Create a new index that is unique on the combination of name and role_id
    op.create_index('ix_permissions_name_role_id', 'permissions', ['name', 'role_id'], unique=True)
    
    # Re-create the non-unique index on name for query performance
    op.create_index('ix_permissions_name', 'permissions', ['name'], unique=False)


def downgrade() -> None:
    # Drop the composite index
    op.drop_index('ix_permissions_name_role_id', table_name='permissions')
    
    # Drop the non-unique index
    op.drop_index('ix_permissions_name', table_name='permissions')
    
    # Re-create the original unique index on name
    op.create_index('ix_permissions_name', 'permissions', ['name'], unique=True)
