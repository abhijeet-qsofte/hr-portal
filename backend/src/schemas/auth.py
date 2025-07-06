from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime
    user_id: int
    full_name: Optional[str] = None
    email: EmailStr
    roles: List[str] = []

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    roles: List[str] = []

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    employee_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    roles: List[str] = ["employee"]  # Default role

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[str]] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class User(UserInDBBase):
    roles: List[str] = []

class UserInDB(UserInDBBase):
    hashed_password: str

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class RoleInDBBase(RoleBase):
    id: int

    class Config:
        orm_mode = True

class Role(RoleInDBBase):
    pass

class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None
    role_id: int

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(PermissionBase):
    pass

class PermissionInDBBase(PermissionBase):
    id: int

    class Config:
        orm_mode = True

class Permission(PermissionInDBBase):
    pass
