"""
Script to test the authentication and RBAC implementation directly with the database.
This bypasses the API endpoints and works directly with the database models.
"""
import os
import sys
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.session import SessionLocal
from src.models.auth import User, Role, Permission
from src.auth.utils import get_password_hash, verify_password
from src.auth.utils import create_access_token, create_refresh_token, verify_token

def print_separator(title):
    """Print a separator with a title."""
    print("\n" + "=" * 50)
    print(f" {title} ".center(50, "="))
    print("=" * 50)

def test_create_test_user():
    """Create a test user with employee role."""
    print_separator("CREATING TEST USER")
    
    db = SessionLocal()
    try:
        # Check if user already exists
        email = "test@example.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User with email {email} already exists.")
            return user
        
        # Create new user
        user = User(
            email=email,
            hashed_password=get_password_hash("Password123!"),
            full_name="Test User",
            is_active=True
        )
        
        # Add employee role
        employee_role = db.query(Role).filter(Role.name == "employee").first()
        if employee_role:
            print(f"Adding role: {employee_role.name}")
            user.roles.append(employee_role)
        else:
            print("Employee role not found!")
        
        # Save user to database
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"Created user: {user.email} (ID: {user.id})")
        return user
    
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {e}")
        return None
    finally:
        db.close()

def test_user_roles():
    """Test retrieving user roles."""
    print_separator("TESTING USER ROLES")
    
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Test user not found!")
            return
        
        # Get user roles
        print(f"User: {user.email}")
        print("Roles:")
        for role in user.roles:
            print(f"  - {role.name}: {role.description}")
        
        # Get admin user
        admin = db.query(User).filter(User.email == "admin@asikhfarms.com").first()
        if admin:
            print(f"\nAdmin: {admin.email}")
            print("Roles:")
            for role in admin.roles:
                print(f"  - {role.name}: {role.description}")
        else:
            print("\nAdmin user not found!")
    
    except Exception as e:
        print(f"Error testing user roles: {e}")
    finally:
        db.close()

def test_user_permissions():
    """Test retrieving user permissions."""
    print_separator("TESTING USER PERMISSIONS")
    
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Test user not found!")
            return
        
        # Get user permissions through roles
        print(f"User: {user.email}")
        print("Permissions:")
        
        for role in user.roles:
            print(f"\nRole: {role.name}")
            permissions = db.query(Permission).filter(Permission.role_id == role.id).all()
            
            if permissions:
                for perm in permissions:
                    print(f"  - {perm.name}: {perm.description}")
            else:
                print("  No permissions found for this role")
        
        # Get admin permissions
        admin = db.query(User).filter(User.email == "admin@asikhfarms.com").first()
        if admin:
            print(f"\nAdmin: {admin.email}")
            print("Permissions (sample):")
            
            for role in admin.roles:
                print(f"\nRole: {role.name}")
                permissions = db.query(Permission).filter(Permission.role_id == role.id).limit(5).all()
                
                if permissions:
                    for perm in permissions:
                        print(f"  - {perm.name}: {perm.description}")
                    if len(db.query(Permission).filter(Permission.role_id == role.id).all()) > 5:
                        print("  ... (more permissions not shown)")
                else:
                    print("  No permissions found for this role")
        else:
            print("\nAdmin user not found!")
    
    except Exception as e:
        print(f"Error testing user permissions: {e}")
    finally:
        db.close()

def test_token_generation():
    """Test JWT token generation and verification."""
    print_separator("TESTING TOKEN GENERATION")
    
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Test user not found!")
            return
        
        # Generate access token
        access_token = create_access_token(
            subject=user.email
        )
        print(f"Access Token: {access_token[:20]}...{access_token[-20:]}")
        
        # Generate refresh token
        refresh_token = create_refresh_token(
            subject=user.email
        )
        print(f"Refresh Token: {refresh_token[:20]}...{refresh_token[-20:]}")
        
        # Verify tokens
        is_valid_access, access_payload = verify_token(access_token)
        is_valid_refresh, refresh_payload = verify_token(refresh_token)
        
        print("\nAccess Token Verification:")
        print(f"  Valid: {is_valid_access}")
        print(f"  Subject: {access_payload.get('sub')}")
        print(f"  Expiration: {access_payload.get('exp')}")
        
        print("\nRefresh Token Verification:")
        print(f"  Valid: {is_valid_refresh}")
        print(f"  Subject: {refresh_payload.get('sub')}")
        print(f"  Expiration: {refresh_payload.get('exp')}")
        print(f"  Token Type: {refresh_payload.get('type', 'not specified')}")
        print(f"  User Roles: {access_payload.get('roles', [])}")
        
    
    except Exception as e:
        print(f"Error testing token generation: {e}")
    finally:
        db.close()

def test_password_verification():
    """Test password hashing and verification."""
    print_separator("TESTING PASSWORD VERIFICATION")
    
    db = SessionLocal()
    try:
        # Get test user
        user = db.query(User).filter(User.email == "test@example.com").first()
        if not user:
            print("Test user not found!")
            return
        
        # Test correct password
        correct_password = "Password123!"
        is_correct = verify_password(correct_password, user.hashed_password)
        print(f"Correct password verification: {is_correct}")
        
        # Test incorrect password
        incorrect_password = "WrongPassword123!"
        is_incorrect = verify_password(incorrect_password, user.hashed_password)
        print(f"Incorrect password verification: {is_incorrect}")
    
    except Exception as e:
        print(f"Error testing password verification: {e}")
    finally:
        db.close()

def run_tests():
    """Run all tests."""
    test_create_test_user()
    test_user_roles()
    test_user_permissions()
    test_token_generation()
    test_password_verification()

if __name__ == "__main__":
    run_tests()
