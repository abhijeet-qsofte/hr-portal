from sqlalchemy.orm import Session
from src.models.auth import User, Role, Permission
from src.auth.utils import get_password_hash

# Predefined roles
ROLES = [
    {
        "name": "admin",
        "description": "Administrator with full access to all features"
    },
    {
        "name": "hr",
        "description": "HR staff with access to employee management and payroll"
    },
    {
        "name": "manager",
        "description": "Manager with access to attendance and limited employee data"
    },
    {
        "name": "employee",
        "description": "Regular employee with access to own data only"
    }
]

# Permissions for each role
PERMISSIONS = {
    "admin": [
        {"name": "user:create", "description": "Create users"},
        {"name": "user:read", "description": "Read user data"},
        {"name": "user:update", "description": "Update user data"},
        {"name": "user:delete", "description": "Delete users"},
        {"name": "employee:create", "description": "Create employees"},
        {"name": "employee:read", "description": "Read employee data"},
        {"name": "employee:update", "description": "Update employee data"},
        {"name": "employee:delete", "description": "Delete employees"},
        {"name": "attendance:create", "description": "Create attendance records"},
        {"name": "attendance:read", "description": "Read attendance records"},
        {"name": "attendance:update", "description": "Update attendance records"},
        {"name": "attendance:delete", "description": "Delete attendance records"},
        {"name": "payroll:create", "description": "Create payroll records"},
        {"name": "payroll:read", "description": "Read payroll records"},
        {"name": "payroll:update", "description": "Update payroll records"},
        {"name": "payroll:delete", "description": "Delete payroll records"},
        {"name": "salary:create", "description": "Create salary structures"},
        {"name": "salary:read", "description": "Read salary structures"},
        {"name": "salary:update", "description": "Update salary structures"},
        {"name": "salary:delete", "description": "Delete salary structures"},
    ],
    "hr": [
        {"name": "employee:create", "description": "Create employees"},
        {"name": "employee:read", "description": "Read employee data"},
        {"name": "employee:update", "description": "Update employee data"},
        {"name": "attendance:read", "description": "Read attendance records"},
        {"name": "payroll:create", "description": "Create payroll records"},
        {"name": "payroll:read", "description": "Read payroll records"},
        {"name": "payroll:update", "description": "Update payroll records"},
        {"name": "salary:create", "description": "Create salary structures"},
        {"name": "salary:read", "description": "Read salary structures"},
        {"name": "salary:update", "description": "Update salary structures"},
    ],
    "manager": [
        {"name": "employee:read", "description": "Read employee data"},
        {"name": "attendance:create", "description": "Create attendance records"},
        {"name": "attendance:read", "description": "Read attendance records"},
        {"name": "attendance:update", "description": "Update attendance records"},
        {"name": "payroll:read", "description": "Read payroll records"},
        {"name": "salary:read", "description": "Read salary structures"},
    ],
    "employee": [
        {"name": "employee:read:self", "description": "Read own employee data"},
        {"name": "attendance:read:self", "description": "Read own attendance records"},
        {"name": "payroll:read:self", "description": "Read own payroll records"},
        {"name": "salary:read:self", "description": "Read own salary structure"},
    ]
}

def init_db(db: Session) -> None:
    """
    Initialize database with default roles and permissions.
    Create admin user if it doesn't exist.
    """
    try:
        # Create roles
        for role_data in ROLES:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                role = Role(**role_data)
                db.add(role)
                db.commit()
                db.refresh(role)
            
            # Create permissions for this role
            if role.name in PERMISSIONS:
                for perm_data in PERMISSIONS[role.name]:
                    # Create unique permission name for this role
                    unique_name = f"{perm_data['name']}_{role.name}"
                    
                    # Check if this permission already exists for this role
                    perm = db.query(Permission).filter(
                        Permission.name == unique_name,
                        Permission.role_id == role.id
                    ).first()
                    
                    if not perm:
                        # Create the permission with unique name
                        perm = Permission(
                            name=unique_name,
                            description=perm_data["description"],
                            role_id=role.id
                        )
                        db.add(perm)
                        # Commit each permission to avoid losing all if one fails
                        db.commit()
        
        # Create admin user if it doesn't exist
        admin_email = "admin@asikhfarms.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        
        if not admin:
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            
            if admin_role:
                admin = User(
                    email=admin_email,
                    full_name="Admin User",
                    hashed_password=get_password_hash("adminpassword"),
                    is_active=True
                )
                admin.roles.append(admin_role)
                db.add(admin)
                db.commit()
        
        # Final commit to ensure all changes are saved
        db.commit()
        print("✅ Database initialized with default roles, permissions, and admin user")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing database: {e}")
        # Re-raise the exception for proper error handling
        raise
