from datetime import datetime, timedelta
from typing import Any, List, Dict, Optional
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Body, Depends, HTTPException, status, BackgroundTasks, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.models.auth import User, Role, Permission
from src.models.employee import Employee
from src.schemas.auth import User as UserSchema
from src.schemas.auth import UserCreate, UserUpdate, Token, RoleCreate, PermissionCreate
from src.auth.utils import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_refresh_token,
    verify_token,
    generate_token_pair,
    REFRESH_TOKEN_EXPIRE_DAYS,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_TIME_MINUTES
)
from src.auth.deps import get_current_active_user, get_current_user, has_role, is_superuser, RoleChecker
from src.auth.middleware import PermissionChecker, ResourceOwnershipChecker

# In-memory storage for login attempts and password reset tokens
# Note: In production, use Redis or another persistent store
login_attempts = {}
password_reset_tokens = {}

router = APIRouter(tags=["auth"])

# Rate limiting storage (in-memory for simplicity, use Redis in production)
login_attempts = {}

# Password reset tokens storage (in-memory for simplicity, use Redis in production)
password_reset_tokens = {}

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@asikhfarms.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Send email function for password reset
def send_password_reset_email(email: str, token: str):
    """Send password reset email with token"""
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Asikh Farms HR Portal - Password Reset"
        
        # Create the reset link
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        # Create the message body
        body = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password for the Asikh Farms HR Portal.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_link}">Reset Password</a></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>This link will expire in 30 minutes.</p>
            <p>Thank you,<br>Asikh Farms HR Team</p>
        </body>
        </html>
        """
        
        # Attach the body to the message
        msg.attach(MIMEText(body, 'html'))
        
        # Connect to the SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        
        # Login if credentials are provided
        if SMTP_USERNAME and SMTP_PASSWORD:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send the email
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@router.post("/login", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Check rate limiting
    ip_address = request.client.host if request.client else "unknown"
    if ip_address in login_attempts:
        attempts, last_attempt_time = login_attempts[ip_address]
        # Reset attempts if lockout period has passed
        if (datetime.utcnow() - last_attempt_time).total_seconds() > (60 * LOCKOUT_TIME_MINUTES):
            login_attempts[ip_address] = (0, datetime.utcnow())
        elif attempts >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Please try again after {LOCKOUT_TIME_MINUTES} minutes."
            )
    
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Increment login attempts
        if ip_address in login_attempts:
            attempts, _ = login_attempts[ip_address]
            login_attempts[ip_address] = (attempts + 1, datetime.utcnow())
        else:
            login_attempts[ip_address] = (1, datetime.utcnow())
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Reset login attempts on successful login
    if ip_address in login_attempts:
        login_attempts[ip_address] = (0, datetime.utcnow())
    
    # Get user roles
    roles = [role.name for role in user.roles]
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Create tokens
    access_token = create_access_token(
        subject=user.email,
        roles=roles,
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        subject=user.email,
        expires_delta=refresh_token_expires
    )
    
    # Return token with user info
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_at": datetime.utcnow() + access_token_expires,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "roles": roles
    }

@router.post("/refresh")
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    is_valid, payload = verify_token(refresh_token, token_type="refresh")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user or inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Create new access token
    access_token = create_access_token(
        subject=user.email,
        roles=user_roles,
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": datetime.utcnow() + access_token_expires
    }


@router.post("/forgot-password")
async def forgot_password(
    email: str = Body(..., embed=True),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Request password reset email
    """
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    # Always return success even if user doesn't exist (security best practice)
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link."}
    
    # Generate reset token (valid for 30 minutes)
    reset_token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(minutes=30)
    
    # Store token with expiration
    password_reset_tokens[reset_token] = {"email": email, "expires": expires}
    
    # Send email in background
    if background_tasks:
        background_tasks.add_task(send_password_reset_email, email, reset_token)
    else:
        # Fallback to synchronous if background tasks not available
        send_password_reset_email(email, reset_token)
    
    return {"message": "If your email is registered, you will receive a password reset link."}


@router.post("/reset-password")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Reset password using token
    """
    # Check if token exists and is valid
    if token not in password_reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Get token data
    token_data = password_reset_tokens[token]
    
    # Check if token has expired
    if datetime.utcnow() > token_data["expires"]:
        # Remove expired token
        del password_reset_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )
    
    # Get user by email
    email = token_data["email"]
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Remove used token
    del password_reset_tokens[token]
    
    return {"message": "Password has been reset successfully"}


@router.post("/register", response_model=UserSchema)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(is_superuser)
) -> Any:
    """
    Register a new user (admin only)
    """
    # Check if user with this email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    
    # Check if employee exists if employee_id is provided
    if user_in.employee_id:
        employee = db.query(Employee).filter(Employee.id == user_in.employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found"
            )
    
    # Create new user
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        employee_id=user_in.employee_id,
        is_active=True
    )
    
    # Add roles
    for role_name in user_in.roles:
        role = db.query(Role).filter(Role.name == role_name).first()
        if role:
            user.roles.append(role)
    
    # Save user to database
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def user_to_schema(user: User) -> dict:
    """
    Convert User model to schema format, handling relationships properly
    """
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "employee_id": user.employee_id,
        "roles": [role.name for role in user.roles] if user.roles else []
    }

@router.get("/me", response_model=UserSchema)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user
    """
    return user_to_schema(current_user)

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update current user
    """
    # Update user fields
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    
    if user_in.email is not None:
        # Check if email is already taken
        if user_in.email != current_user.email:
            user = db.query(User).filter(User.email == user_in.email).first()
            if user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
        current_user.email = user_in.email
    
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    # Save changes
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/users", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(is_superuser),
) -> Any:
    """
    Retrieve users. Only for admins.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/roles", response_model=List[dict])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all roles.
    """
    roles = db.query(Role).all()
    return [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": [{
                "id": perm.id,
                "name": perm.name,
                "description": perm.description
            } for perm in role.permissions]
        } for role in roles
    ]


@router.post("/roles", status_code=status.HTTP_201_CREATED)
def create_role(
    *,
    db: Session = Depends(get_db),
    role_in: RoleCreate,
    current_user: User = Depends(is_superuser),
) -> Any:
    """
    Create a new role. Only for admins.
    """
    # Check if role with this name already exists
    role = db.query(Role).filter(Role.name == role_in.name).first()
    if role:
        raise HTTPException(
            status_code=400,
            detail="A role with this name already exists."
        )
    
    # Create new role
    role = Role(**role_in.dict())
    db.add(role)
    db.commit()
    db.refresh(role)
    
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description
    }


@router.post("/roles/{role_id}/permissions", status_code=status.HTTP_201_CREATED)
def create_permission(
    *,
    role_id: int,
    db: Session = Depends(get_db),
    permission_in: PermissionCreate,
    current_user: User = Depends(is_superuser),
) -> Any:
    """
    Create a new permission for a role. Only for admins.
    """
    # Check if role exists
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if permission with this name already exists for this role
    permission = db.query(Permission).filter(
        Permission.name == permission_in.name,
        Permission.role_id == role_id
    ).first()
    
    if permission:
        raise HTTPException(
            status_code=400,
            detail="A permission with this name already exists for this role."
        )
    
    # Create new permission
    permission = Permission(**permission_in.dict(), role_id=role_id)
    db.add(permission)
    db.commit()
    db.refresh(permission)
    
    return {
        "id": permission.id,
        "name": permission.name,
        "description": permission.description,
        "role_id": permission.role_id
    }


@router.post("/users/{user_id}/roles/{role_name}")
def assign_role_to_user(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_superuser),
) -> Any:
    """
    Assign a role to a user. Only for admins.
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get role
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if user already has this role
    if role in user.roles:
        return {"message": f"User already has role '{role_name}'"}
    
    # Assign role
    user.roles.append(role)
    db.commit()
    
    return {"message": f"Role '{role_name}' assigned to user successfully"}


@router.delete("/users/{user_id}/roles/{role_name}")
def remove_role_from_user(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(is_superuser),
) -> Any:
    """
    Remove a role from a user. Only for admins.
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get role
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if user has this role
    if role not in user.roles:
        return {"message": f"User does not have role '{role_name}'"}
    
    # Remove role
    user.roles.remove(role)
    db.commit()
    
    return {"message": f"Role '{role_name}' removed from user successfully"}


@router.get("/check-permission/{permission_name}")
def check_user_permission(
    permission_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Check if current user has a specific permission through their roles.
    """
    # Get all user roles
    user_roles = current_user.roles
    
    # Check if any role has the requested permission
    has_permission = False
    for role in user_roles:
        for permission in role.permissions:
            if permission.name == permission_name:
                has_permission = True
                break
        if has_permission:
            break
    
    return {
        "has_permission": has_permission,
        "permission": permission_name,
        "user_id": current_user.id,
        "user_email": current_user.email
    }
