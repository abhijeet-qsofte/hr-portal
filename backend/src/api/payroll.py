from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func, extract
from datetime import datetime

from src.db.session import get_db
from src.models.payroll import Payroll
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.schemas.payroll import PayrollCreate, PayrollUpdate, Payroll as PayrollSchema, PayrollWithEmployee

router = APIRouter()

@router.get("", response_model=List[PayrollSchema])
def get_payroll_records(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Retrieve all payroll records with pagination
    """
    payroll_records = db.query(Payroll).offset(skip).limit(limit).all()
    return payroll_records

@router.get("/detailed", response_model=List[PayrollWithEmployee])
def get_detailed_payroll_records(
    skip: int = 0, 
    limit: int = 100, 
    month: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all payroll records with employee details and optional month filtering
    """
    # Start with base query
    query = db.query(Payroll, Employee.name, Employee.designation)\
        .join(Employee, Payroll.employee_id == Employee.id)
    
    # Apply month filter if provided
    if month:
        query = query.filter(Payroll.month == month)
    
    # Apply pagination
    results = query.offset(skip).limit(limit).all()
    
    # Format response
    response = []
    for payroll, emp_name, emp_designation in results:
        payroll_dict = PayrollWithEmployee.from_orm(payroll)
        payroll_dict.employee_name = emp_name
        payroll_dict.employee_designation = emp_designation
        
        # Add processor name if available
        if payroll.processed_by:
            processor = db.query(Employee).filter(Employee.id == payroll.processed_by).first()
            if processor:
                payroll_dict.processor_name = processor.name
        
        response.append(payroll_dict)
    
    return response

@router.get("/{payroll_id}", response_model=PayrollSchema)
def get_payroll_record(
    payroll_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific payroll record by ID
    """
    db_payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if db_payroll is None:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    return db_payroll

@router.get("/employee/{employee_id}", response_model=List[PayrollSchema])
def get_employee_payroll(
    employee_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve payroll records for a specific employee
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    payroll_records = db.query(Payroll).filter(Payroll.employee_id == employee_id).all()
    return payroll_records

@router.post("/", response_model=PayrollSchema, status_code=status.HTTP_201_CREATED)
def create_payroll_record(
    payroll: PayrollCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new payroll record (manual override)
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if payroll record already exists for this employee for this month
    existing_record = db.query(Payroll).filter(
        Payroll.employee_id == payroll.employee_id,
        Payroll.month == payroll.month
    ).first()
    
    if existing_record:
        raise HTTPException(
            status_code=400, 
            detail="Payroll record already exists for this employee for this month"
        )
    
    # Calculate total salary if not provided
    salary_total = payroll.salary_total
    if not salary_total and payroll.base_salary:
        salary_total = payroll.base_salary
        
        # Add overtime
        if payroll.overtime_hours and payroll.overtime_rate:
            salary_total += payroll.overtime_hours * payroll.overtime_rate
        
        # Add bonus
        if payroll.bonus:
            salary_total += payroll.bonus
        
        # Subtract deductions
        if payroll.deductions:
            salary_total -= payroll.deductions
    
    db_payroll = Payroll(
        employee_id=payroll.employee_id,
        month=payroll.month,
        days_present=payroll.days_present,
        base_salary=payroll.base_salary,
        overtime_hours=payroll.overtime_hours,
        overtime_rate=payroll.overtime_rate,
        bonus=payroll.bonus,
        deductions=payroll.deductions,
        salary_total=salary_total,
        processed_by=None  # Can be updated to current user ID when auth is implemented
    )
    
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    return db_payroll

@router.post("/generate/{employee_id}/{month}", response_model=PayrollWithEmployee)
def generate_payroll(
    employee_id: int, 
    month: str,  # Format: YYYY-MM
    processor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Generate payroll for an employee for a specific month based on attendance records
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if payroll already exists for this month
    existing_payroll = db.query(Payroll).filter(
        Payroll.employee_id == employee_id,
        Payroll.month == month
    ).first()
    
    if existing_payroll:
        raise HTTPException(
            status_code=400, 
            detail="Payroll already generated for this month"
        )
    
    # Get attendance records for the month
    year, month_num = month.split('-')
    
    # Count days present
    days_present = db.query(func.count(func.distinct(Attendance.date))).filter(
        Attendance.employee_id == employee_id,
        extract('year', Attendance.date) == int(year),
        extract('month', Attendance.date) == int(month_num)
    ).scalar() or 0
    
    # Calculate total hours worked
    total_hours = db.query(func.sum(Attendance.total_hours)).filter(
        Attendance.employee_id == employee_id,
        extract('year', Attendance.date) == int(year),
        extract('month', Attendance.date) == int(month_num)
    ).scalar() or 0
    
    # Calculate base salary (assuming 8 hours per day at $15/hour)
    daily_hours = 8
    hourly_rate = 15
    base_salary = days_present * daily_hours * hourly_rate
    
    # Calculate overtime (hours beyond 8 per day)
    regular_hours = days_present * daily_hours
    overtime_hours = max(0, total_hours - regular_hours)
    overtime_rate = hourly_rate * 1.5  # Time and a half
    overtime_pay = overtime_hours * overtime_rate
    
    # Calculate bonus (example: $50 bonus for perfect attendance if days_present >= 22)
    bonus = 50 if days_present >= 22 else 0
    
    # No deductions in this example
    deductions = 0
    
    # Total salary
    salary_total = base_salary + overtime_pay + bonus - deductions
    
    # Create payroll record
    new_payroll = Payroll(
        employee_id=employee_id,
        month=month,
        days_present=days_present,
        base_salary=base_salary,
        overtime_hours=overtime_hours,
        overtime_rate=overtime_rate,
        bonus=bonus,
        deductions=deductions,
        salary_total=salary_total,
        processed_by=processor_id
    )
    
    db.add(new_payroll)
    db.commit()
    db.refresh(new_payroll)
    
    # Prepare response with employee details
    result = PayrollWithEmployee.from_orm(new_payroll)
    result.employee_name = employee.name
    result.employee_designation = employee.designation
    
    if processor_id:
        processor = db.query(Employee).filter(Employee.id == processor_id).first()
        if processor:
            result.processor_name = processor.name
    
    return result
