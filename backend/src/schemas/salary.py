from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, validator
import re

# SalaryStructure schemas
class SalaryStructureBase(BaseModel):
    employee_id: int
    effective_from: datetime
    basic_salary: float
    house_rent_allowance: float = 0
    medical_allowance: float = 0
    transport_allowance: float = 0
    special_allowance: float = 0
    tax_deduction: float = 0
    provident_fund: float = 0
    insurance: float = 0
    other_deductions: float = 0
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None

    @validator('basic_salary', 'house_rent_allowance', 'medical_allowance', 'transport_allowance', 
               'special_allowance', 'tax_deduction', 'provident_fund', 'insurance', 'other_deductions')
    def validate_positive_amount(cls, v):
        if v < 0:
            raise ValueError('Amount must be non-negative')
        return v

    @validator('gross_salary', 'net_salary', always=True)
    def calculate_salaries(cls, v, values):
        if 'basic_salary' not in values:
            return v
        
        if v is None:
            # Calculate gross salary
            if v == values.get('gross_salary'):
                return (values.get('basic_salary', 0) + 
                        values.get('house_rent_allowance', 0) + 
                        values.get('medical_allowance', 0) + 
                        values.get('transport_allowance', 0) + 
                        values.get('special_allowance', 0))
            
            # Calculate net salary
            if v == values.get('net_salary'):
                gross = (values.get('basic_salary', 0) + 
                         values.get('house_rent_allowance', 0) + 
                         values.get('medical_allowance', 0) + 
                         values.get('transport_allowance', 0) + 
                         values.get('special_allowance', 0))
                
                deductions = (values.get('tax_deduction', 0) + 
                              values.get('provident_fund', 0) + 
                              values.get('insurance', 0) + 
                              values.get('other_deductions', 0))
                
                return gross - deductions
        
        return v


class SalaryStructureCreate(SalaryStructureBase):
    created_by: Optional[int] = None


class SalaryStructureUpdate(BaseModel):
    effective_from: Optional[datetime] = None
    basic_salary: Optional[float] = None
    house_rent_allowance: Optional[float] = None
    medical_allowance: Optional[float] = None
    transport_allowance: Optional[float] = None
    special_allowance: Optional[float] = None
    tax_deduction: Optional[float] = None
    provident_fund: Optional[float] = None
    insurance: Optional[float] = None
    other_deductions: Optional[float] = None
    gross_salary: Optional[float] = None
    net_salary: Optional[float] = None


class SalaryStructureInDB(SalaryStructureBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes = True


class SalaryStructure(SalaryStructureInDB):
    pass


class SalaryStructureWithEmployee(SalaryStructure):
    employee_name: Optional[str] = None
    employee_designation: Optional[str] = None
    creator_name: Optional[str] = None


# Payslip schemas
class PayslipBase(BaseModel):
    employee_id: int
    salary_structure_id: int
    payroll_id: Optional[int] = None
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")  # Format: YYYY-MM
    working_days: int = Field(..., ge=0, le=31)
    days_present: int = Field(..., ge=0, le=31)
    leave_days: int = Field(..., ge=0, le=31)
    overtime_hours: float = 0
    overtime_rate: float = 0
    overtime_amount: float = 0
    bonus: float = 0
    bonus_description: Optional[str] = None
    additional_deductions: float = 0
    deduction_description: Optional[str] = None
    gross_amount: float
    total_deductions: float
    net_amount: float
    is_generated: bool = False
    is_approved: bool = False
    is_paid: bool = False
    payment_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    pdf_url: Optional[str] = None
    notes: Optional[str] = None

    @validator('month')
    def validate_month_format(cls, v):
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError('Month must be in YYYY-MM format')
        return v

    @validator('gross_amount', 'total_deductions', 'net_amount', 'overtime_amount', 'bonus', 'additional_deductions')
    def validate_positive_amount(cls, v):
        if v < 0:
            raise ValueError('Amount must be non-negative')
        return v

    @validator('overtime_amount', always=True)
    def calculate_overtime_amount(cls, v, values):
        if v == 0 and 'overtime_hours' in values and 'overtime_rate' in values:
            return values['overtime_hours'] * values['overtime_rate']
        return v

    @validator('net_amount', always=True)
    def calculate_net_amount(cls, v, values):
        if 'gross_amount' in values and 'total_deductions' in values:
            calculated = values['gross_amount'] - values['total_deductions']
            if v != calculated:
                return calculated
        return v


class PayslipCreate(PayslipBase):
    processed_by: Optional[int] = None


class PayslipUpdate(BaseModel):
    salary_structure_id: Optional[int] = None
    payroll_id: Optional[int] = None
    working_days: Optional[int] = None
    days_present: Optional[int] = None
    leave_days: Optional[int] = None
    overtime_hours: Optional[float] = None
    overtime_rate: Optional[float] = None
    overtime_amount: Optional[float] = None
    bonus: Optional[float] = None
    bonus_description: Optional[str] = None
    additional_deductions: Optional[float] = None
    deduction_description: Optional[str] = None
    gross_amount: Optional[float] = None
    total_deductions: Optional[float] = None
    net_amount: Optional[float] = None
    is_generated: Optional[bool] = None
    is_approved: Optional[bool] = None
    is_paid: Optional[bool] = None
    payment_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    pdf_url: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[int] = None


class PayslipInDB(PayslipBase):
    id: int
    created_at: datetime
    updated_at: datetime
    processed_by: Optional[int] = None
    approved_by: Optional[int] = None

    class Config:
        orm_mode = True
        from_attributes = True


class Payslip(PayslipInDB):
    pass


class PayslipWithEmployee(Payslip):
    employee_name: Optional[str] = None
    employee_designation: Optional[str] = None
    processor_name: Optional[str] = None
    approver_name: Optional[str] = None
