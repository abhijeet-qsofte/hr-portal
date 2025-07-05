from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
import re

class PayrollBase(BaseModel):
    employee_id: int
    month: str  # Format: YYYY-MM
    days_present: int = Field(0, ge=0, le=31)
    salary_total: float = Field(..., ge=0)
    base_salary: Optional[float] = Field(None, ge=0)
    overtime_hours: Optional[float] = Field(0, ge=0)
    overtime_rate: Optional[float] = Field(0, ge=0)
    bonus: Optional[float] = Field(0, ge=0)
    deductions: Optional[float] = Field(0, ge=0)
    
    @validator('month')
    def validate_month_format(cls, v):
        if not re.match(r'^\d{4}-\d{2}$', v):
            raise ValueError('Month must be in YYYY-MM format')
        return v

class PayrollCreate(PayrollBase):
    pass

class PayrollUpdate(BaseModel):
    days_present: Optional[int] = Field(None, ge=0, le=31)
    salary_total: Optional[float] = Field(None, ge=0)
    base_salary: Optional[float] = Field(None, ge=0)
    overtime_hours: Optional[float] = Field(None, ge=0)
    overtime_rate: Optional[float] = Field(None, ge=0)
    bonus: Optional[float] = Field(None, ge=0)
    deductions: Optional[float] = Field(None, ge=0)
    processed_by: Optional[int] = None
    
    @validator('days_present')
    def validate_days_present(cls, v):
        if v is not None and (v < 0 or v > 31):
            raise ValueError('Days present must be between 0 and 31')
        return v

class PayrollInDB(PayrollBase):
    id: int
    created_at: datetime
    updated_at: datetime
    processed_by: Optional[int] = None
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class Payroll(PayrollInDB):
    pass

class PayrollWithEmployee(Payroll):
    employee_name: Optional[str] = None
    employee_designation: Optional[str] = None
    processor_name: Optional[str] = None
