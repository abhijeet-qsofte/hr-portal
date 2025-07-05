from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import date, datetime
import re

class EmployeeBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: Optional[str] = Field(None, max_length=100)  # Optional for backward compatibility
    phone: str = Field(..., max_length=15)
    doj: date
    designation: str = Field(..., max_length=50)
    location: str = Field(..., max_length=100)
    status: str = Field(default="active")
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ['active', 'inactive', 'terminated']:
            raise ValueError('Status must be one of: active, inactive, terminated')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^[0-9+\-\s()]+$', v):
            raise ValueError('Phone number must contain only digits, +, -, spaces, and parentheses')
        return v
    
    @validator('doj')
    def validate_doj(cls, v):
        if v > date.today():
            raise ValueError('Date of joining cannot be in the future')
        return v

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=15)
    doj: Optional[date] = None
    designation: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = None
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['active', 'inactive', 'terminated']:
            raise ValueError('Status must be one of: active, inactive, terminated')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None and not re.match(r'^[0-9+\-\s()]+$', v):
            raise ValueError('Phone number must contain only digits, +, -, spaces, and parentheses')
        return v
    
    @validator('doj')
    def validate_doj(cls, v):
        if v is not None and v > date.today():
            raise ValueError('Date of joining cannot be in the future')
        return v

class EmployeeInDB(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class Employee(EmployeeInDB):
    pass

class EmployeeWithRelations(Employee):
    attendance_count: Optional[int] = None
    latest_payroll: Optional[dict] = None
