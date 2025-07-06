from fastapi import APIRouter, Depends, HTTPException, status, Body, Form, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import secrets
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from .utils import LOCKOUT_TIME_MINUTES, MAX_LOGIN_ATTEMPTS

from src.db.session import get_db
from ..models.auth import User, Role
from .utils import (
    verify_password, 
    get_password_hash, 
    generate_token_pair, 
    verify_token
)
from .deps import get_current_user, get_current_active_user, RoleChecker

router = APIRouter(prefix="/auth", tags=["Authentication"])

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


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Check rate limiting
    ip_address = form_data.client_id or "unknown"
    if ip_address in login_attempts:
        attempts, last_attempt_time = login_attempts[ip_address]
        # Reset attempts if lockout period has passed
        if (datetime.utcnow() - last_attempt_time).total_seconds() > (60 * LOCKOUT_TIME_MINUTES):
            login_attempts[ip_address] = (0, datetime.utcnow())
        elif attempts >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Please try again later."
            )
    
    # Get user by email
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Reset login attempts on successful login
    if ip_address in login_attempts:
        login_attempts[ip_address] = (0, datetime.utcnow())
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    # Create tokens
    tokens = generate_token_pair(
        user_id=str(user.id),
        user_roles=user_roles,
        additional_data={"full_name": user.full_name}
    )
    
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "roles": user_roles,
            "is_active": user.is_active
        }
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
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user or inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user roles
    user_roles = [role.name for role in user.roles]
    
    # Generate new token pair
    tokens = generate_token_pair(
        user_id=str(user.id),
        user_roles=user_roles,
        additional_data={"full_name": user.full_name}
    )
    
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": "bearer"
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    email: str = Body(...),
    password: str = Body(...),
    full_name: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Register a new user (admin only)
    """
    # Check if current user has admin role
    if "admin" not in [role.name for role in current_user.roles]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(password)
    new_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        is_active=True
    )
    
    # Add default employee role
    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if employee_role:
        new_user.roles.append(employee_role)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}


@router.get("/me")
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user information
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [role.name for role in current_user.roles],
        "is_active": current_user.is_active
    }


@router.put("/me")
async def update_user_me(
    full_name: Optional[str] = Body(None),
    password: Optional[str] = Body(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    """
    # Update user data
    if full_name:
        current_user.full_name = full_name
    
    if password:
        current_user.hashed_password = get_password_hash(password)
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active
    }


@router.get("/users", dependencies=[Depends(RoleChecker(["admin"]))])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "roles": [role.name for role in user.roles],
            "is_active": user.is_active
        }
        for user in users
    ]


@router.post("/users/{user_id}/roles/{role_name}", dependencies=[Depends(RoleChecker(["admin"]))])
async def assign_role_to_user(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db)
):
    """
    Assign a role to a user (admin only)
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if role exists
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if user already has the role
    if role in user.roles:
        return {"message": f"User already has role '{role_name}'"}
    
    # Assign role to user
    user.roles.append(role)
    db.commit()
    
    return {"message": f"Role '{role_name}' assigned to user successfully"}


@router.delete("/users/{user_id}/roles/{role_name}", dependencies=[Depends(RoleChecker(["admin"]))])
async def remove_role_from_user(
    user_id: int,
    role_name: str,
    db: Session = Depends(get_db)
):
    """
    Remove a role from a user (admin only)
    """
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if role exists
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if user has the role
    if role not in user.roles:
        return {"message": f"User does not have role '{role_name}'"}
    
    # Remove role from user
    user.roles.remove(role)
    db.commit()
    
    return {"message": f"Role '{role_name}' removed from user successfully"}


@router.post("/forgot-password")
async def forgot_password(
    email: str = Body(..., embed=True),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process
    """
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link."}
    
    # Generate a secure token
    token = secrets.token_urlsafe(32)
    
    # Store token with user ID and expiration time (30 minutes)
    expiration = datetime.utcnow() + timedelta(minutes=30)
    password_reset_tokens[token] = {"user_id": user.id, "expires": expiration}
    
    # Send email in background to avoid blocking
    if background_tasks:
        background_tasks.add_task(send_password_reset_email, email, token)
    else:
        # For testing or if background tasks not available
        send_password_reset_email(email, token)
    
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
    
    # Check if token is expired
    if datetime.utcnow() > token_data["expires"]:
        # Remove expired token
        password_reset_tokens.pop(token)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )
    
    # Get user from database
    user_id = token_data["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Remove used token
    password_reset_tokens.pop(token)
    
    return {"message": "Password has been reset successfully"}
