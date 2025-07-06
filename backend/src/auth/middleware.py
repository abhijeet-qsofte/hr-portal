"""
Permission-based middleware for FastAPI.
This middleware checks if the current user has the required permissions to access a route.
"""
from typing import List, Callable, Optional
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.auth.deps import get_current_active_user
from src.models.auth import User

class PermissionChecker:
    """
    Class for permission-based access control.
    
    Usage:
        @app.get("/admin-only", dependencies=[Depends(PermissionChecker(["user:create"]))])
        def admin_only_route():
            return {"message": "You have permission to create users!"}
    """
    def __init__(self, required_permissions: List[str]):
        """
        Initialize with required permissions.
        
        Args:
            required_permissions: List of permission names required to access the endpoint
        """
        self.required_permissions = required_permissions
        
    def __call__(
        self, 
        request: Request, 
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ) -> None:
        """
        Check if the current user has any of the required permissions through their roles.
        
        Args:
            request: FastAPI request object
            db: Database session
            current_user: Current authenticated user
            
        Raises:
            HTTPException: If user does not have any of the required permissions
        """
        # Get all user roles
        user_roles = current_user.roles
        
        # Get all permissions from user roles
        user_permissions = []
        for role in user_roles:
            for permission in role.permissions:
                user_permissions.append(permission.name)
        
        # Check if user has any of the required permissions
        if not any(perm in user_permissions for perm in self.required_permissions):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required permissions: {', '.join(self.required_permissions)}"
            )

class ResourceOwnershipChecker:
    """
    Class for checking resource ownership.
    
    This middleware checks if the current user is the owner of the resource being accessed.
    It can be used in combination with role-based or permission-based access control.
    
    Usage:
        @app.get("/my-resource/{resource_id}", dependencies=[Depends(ResourceOwnershipChecker(resource_model=MyResource))])
        def get_my_resource(resource_id: int):
            return {"message": "You own this resource!"}
    """
    def __init__(
        self, 
        resource_model, 
        user_field: str = "employee_id", 
        bypass_roles: Optional[List[str]] = None
    ):
        """
        Initialize with resource model and ownership field.
        
        Args:
            resource_model: SQLAlchemy model class for the resource
            user_field: Field name in the resource model that links to the user
            bypass_roles: List of role names that bypass ownership check
        """
        self.resource_model = resource_model
        self.user_field = user_field
        self.bypass_roles = bypass_roles or ["admin", "hr"]
        
    def __call__(
        self, 
        request: Request, 
        resource_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_active_user)
    ) -> None:
        """
        Check if the current user owns the resource or has a bypass role.
        
        Args:
            request: FastAPI request object
            resource_id: ID of the resource being accessed
            db: Database session
            current_user: Current authenticated user
            
        Raises:
            HTTPException: If user does not own the resource and doesn't have a bypass role
        """
        # Check if user has a bypass role
        user_roles = [role.name for role in current_user.roles]
        if any(role in self.bypass_roles for role in user_roles):
            return
        
        # Get the resource
        resource = db.query(self.resource_model).filter(self.resource_model.id == resource_id).first()
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource not found"
            )
        
        # Check if user owns the resource
        resource_owner_id = getattr(resource, self.user_field)
        if current_user.employee_id != resource_owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this resource"
            )
