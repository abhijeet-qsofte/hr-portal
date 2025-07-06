"""
Example API routes demonstrating authentication and RBAC usage.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.models.auth import User
from src.models.employee import Employee
from src.auth.deps import get_current_active_user, RoleChecker
from src.auth.middleware import PermissionChecker, ResourceOwnershipChecker

router = APIRouter(prefix="/examples", tags=["examples"])

# Example 1: Simple role-based access control
@router.get("/admin-only")
def admin_only_endpoint(
    current_user: User = Depends(RoleChecker(["admin"]))
) -> Any:
    """
    This endpoint is only accessible to users with the 'admin' role.
    """
    return {
        "message": "You have admin access!",
        "user_email": current_user.email
    }

# Example 2: Multiple role access
@router.get("/hr-or-admin")
def hr_or_admin_endpoint(
    current_user: User = Depends(RoleChecker(["admin", "hr"]))
) -> Any:
    """
    This endpoint is accessible to users with either 'admin' or 'hr' role.
    """
    return {
        "message": "You have HR or admin access!",
        "user_email": current_user.email,
        "user_roles": [role.name for role in current_user.roles]
    }

# Example 3: Permission-based access control
@router.get("/create-employee", dependencies=[Depends(PermissionChecker(["employee:create"]))])
def create_employee_endpoint(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    This endpoint is only accessible to users with the 'employee:create' permission.
    """
    return {
        "message": "You have permission to create employees!",
        "user_email": current_user.email
    }

# Example 4: Resource ownership check
@router.get("/employee/{employee_id}")
def get_employee_endpoint(
    employee_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(ResourceOwnershipChecker(Employee, user_field="id", bypass_roles=["admin", "hr", "manager"])),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    This endpoint checks if the current user is the owner of the employee resource
    or has a bypass role (admin, hr, or manager).
    """
    # Get employee from database
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return {
        "message": "You have access to this employee resource!",
        "employee_id": employee.id,
        "employee_name": employee.full_name,
        "user_email": current_user.email
    }

# Example 5: Combining role and permission checks
@router.get("/payroll-admin", dependencies=[
    Depends(RoleChecker(["admin", "hr"])),
    Depends(PermissionChecker(["payroll:view"]))
])
def payroll_admin_endpoint(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    This endpoint requires both:
    1. The user to have either 'admin' or 'hr' role
    2. The user to have the 'payroll:view' permission
    """
    return {
        "message": "You have access to payroll admin functions!",
        "user_email": current_user.email,
        "user_roles": [role.name for role in current_user.roles]
    }

# Example 6: Endpoint available to all authenticated users
@router.get("/authenticated")
def authenticated_endpoint(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    This endpoint is accessible to any authenticated user.
    """
    return {
        "message": "You are authenticated!",
        "user_email": current_user.email,
        "user_id": current_user.id
    }
