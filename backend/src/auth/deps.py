from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from typing import List, Optional, Callable

from src.db.session import get_db
from src.models.auth import User, Role
from src.schemas.auth import TokenPayload
from src.auth.utils import decode_token

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Get the current authenticated user based on the JWT token.
    
    Args:
        db: Database session
        token: JWT token from request
        
    Returns:
        User object if authenticated
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = decode_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        
        token_data = TokenPayload(
            sub=email,
            exp=payload.get("exp"),
            roles=payload.get("roles", [])
        )
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.email == token_data.sub).first()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if active
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def has_role(required_roles: List[str]):
    """
    Dependency for role-based access control.
    
    Args:
        required_roles: List of role names required for access
        
    Returns:
        Dependency function that checks if the current user has any of the required roles
    """
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_roles = [role.name for role in current_user.roles]
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user
    
    return role_checker

def is_superuser(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Check if the current user is a superuser.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if superuser
        
    Raises:
        HTTPException: If user is not a superuser
    """
    user_roles = [role.name for role in current_user.roles]
    if "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required",
        )
    return current_user


class RoleChecker:
    """
    Class for role-based access control.
    
    Usage:
        @app.get("/admin-only", dependencies=[Depends(RoleChecker(["admin"]))])
        def admin_only_route():
            return {"message": "You are an admin!"}
    """
    def __init__(self, allowed_roles: List[str]):
        """
        Initialize with allowed roles.
        
        Args:
            allowed_roles: List of role names allowed to access the endpoint
        """
        self.allowed_roles = allowed_roles
        
    def __call__(self, request: Request, current_user: User = Depends(get_current_active_user)) -> None:
        """
        Check if the current user has any of the allowed roles.
        
        Args:
            request: FastAPI request object
            current_user: Current authenticated user
            
        Raises:
            HTTPException: If user does not have any of the allowed roles
        """
        user_roles = [role.name for role in current_user.roles]
        
        if not any(role in user_roles for role in self.allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions. Required roles: " + ", ".join(self.allowed_roles)
            )
