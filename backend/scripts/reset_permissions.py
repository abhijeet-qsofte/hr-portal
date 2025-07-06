"""
Script to reset permissions in the database.
This will delete all existing permissions and then reinitialize them.
"""
import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.session import SessionLocal
from src.models.auth import Permission, Role
from src.auth.init_db import PERMISSIONS

def reset_permissions():
    """Delete all permissions and reinitialize them."""
    db = SessionLocal()
    try:
        print("🔄 Resetting permissions...")
        
        # Delete all existing permissions
        num_deleted = db.query(Permission).delete()
        print(f"🗑️  Deleted {num_deleted} existing permissions")
        db.commit()
        
        # Get all roles
        roles = db.query(Role).all()
        if not roles:
            print("❌ No roles found in database!")
            return
            
        print(f"📋 Found {len(roles)} roles")
        
        # Create permissions for each role
        for role in roles:
            if role.name in PERMISSIONS:
                print(f"➕ Adding permissions for role: {role.name}")
                for perm_data in PERMISSIONS[role.name]:
                    # Create unique permission name for this role
                    unique_name = f"{perm_data['name']}_{role.name}"
                    
                    # Create the permission
                    perm = Permission(
                        name=unique_name,
                        description=perm_data["description"],
                        role_id=role.id
                    )
                    db.add(perm)
                
                # Commit after adding all permissions for this role
                db.commit()
                print(f"✅ Added {len(PERMISSIONS[role.name])} permissions for {role.name}")
            else:
                print(f"⚠️  No permissions defined for role: {role.name}")
        
        print("✅ Permissions reset successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error resetting permissions: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_permissions()
