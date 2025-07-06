import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Tuple
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
import secrets

load_dotenv()

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-jwt-please-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes by default
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days by default

# Rate limiting settings
MAX_LOGIN_ATTEMPTS = 5  # Maximum number of login attempts
LOCKOUT_TIME_MINUTES = 15  # Lockout time in minutes after max attempts

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any], 
    roles: List[str] = [], 
    expires_delta: Optional[timedelta] = None,
    additional_data: Dict[str, Any] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: Subject of the token (typically user email or ID)
        roles: List of role names for the user
        expires_delta: Optional expiration time delta
        additional_data: Optional additional data to include in the token
        
    Returns:
        JWT token as string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "roles": roles,
        "type": "access"
    }
    
    # Add additional data if provided
    if additional_data:
        to_encode.update(additional_data)
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token with longer expiration.
    
    Args:
        subject: Subject of the token (typically user email or ID)
        expires_delta: Optional expiration time delta
        
    Returns:
        JWT refresh token as string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Generate a unique token ID
    jti = secrets.token_hex(16)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "jti": jti,  # Unique identifier for the token
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        Decoded token payload
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def verify_token(token: str, token_type: str = None) -> Tuple[bool, Dict[str, Any]]:
    """
    Verify a JWT token and return its payload if valid.
    
    Args:
        token: JWT token to verify
        token_type: Expected token type ('access' or 'refresh')
        
    Returns:
        Tuple of (is_valid, payload)
    """
    try:
        payload = decode_token(token)
        
        # Check token type if specified
        if token_type and payload.get("type") != token_type:
            return False, {}
            
        return True, payload
    except JWTError:
        return False, {}


def generate_token_pair(user_id: str, user_roles: List[str], additional_data: Dict[str, Any] = None) -> Dict[str, str]:
    """
    Generate both access and refresh tokens for a user.
    
    Args:
        user_id: User ID
        user_roles: List of user roles
        additional_data: Optional additional data for access token
        
    Returns:
        Dictionary with access and refresh tokens
    """
    access_token = create_access_token(
        subject=user_id,
        roles=user_roles,
        additional_data=additional_data
    )
    
    refresh_token = create_refresh_token(subject=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
