from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import datetime
from decimal import Decimal
from src.schemas.payslip_approval import PayslipApprovalRequest

from src.db.session import get_db
from src.models.employee import Employee
from src.models.salary import SalaryStructure, Payslip
from src.models.payroll import Payroll
from src.models.attendance import Attendance
from src.schemas.salary import (
    SalaryStructure as SalaryStructureSchema,
    SalaryStructureCreate,
    SalaryStructureUpdate,
    SalaryStructureWithEmployee,
    Payslip as PayslipSchema,
    PayslipCreate,
    PayslipUpdate,
    PayslipWithEmployee
)

router = APIRouter()

# Salary Structure endpoints
@router.get("/structures", response_model=List[SalaryStructureWithEmployee])
def get_salary_structures(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get all salary structures with optional filtering by employee
    """
    query = db.query(SalaryStructure)
    
    if employee_id:
        query = query.filter(SalaryStructure.employee_id == employee_id)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    salary_structures = query.order_by(SalaryStructure.effective_from.desc()).offset(skip).limit(limit).all()
    
    # Add employee details to each salary structure
    result = []
    for structure in salary_structures:
        employee = db.query(Employee).filter(Employee.id == structure.employee_id).first()
        creator = None
        if structure.created_by:
            creator = db.query(Employee).filter(Employee.id == structure.created_by).first()
        
        structure_with_employee = SalaryStructureWithEmployee.from_orm(structure)
        if employee:
            structure_with_employee.employee_name = employee.name
            structure_with_employee.employee_designation = employee.designation
        
        if creator:
            structure_with_employee.creator_name = creator.name
        
        result.append(structure_with_employee)
    
    return result

@router.get("/structures/{structure_id}", response_model=SalaryStructureWithEmployee)
def get_salary_structure(structure_id: int, db: Session = Depends(get_db)):
    """
    Get a specific salary structure by ID
    """
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    # Add employee details
    employee = db.query(Employee).filter(Employee.id == structure.employee_id).first()
    creator = None
    if structure.created_by:
        creator = db.query(Employee).filter(Employee.id == structure.created_by).first()
    
    structure_with_employee = SalaryStructureWithEmployee.from_orm(structure)
    if employee:
        structure_with_employee.employee_name = employee.name
        structure_with_employee.employee_designation = employee.designation
    
    if creator:
        structure_with_employee.creator_name = creator.name
    
    return structure_with_employee

@router.post("/structures", response_model=SalaryStructureWithEmployee, status_code=status.HTTP_201_CREATED)
def create_salary_structure(structure: SalaryStructureCreate, db: Session = Depends(get_db)):
    """
    Create a new salary structure for an employee
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == structure.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Calculate gross and net salary if not provided
    if structure.gross_salary is None:
        # Convert all values to float to avoid type mismatch between float and decimal.Decimal
        structure.gross_salary = float(
            float(structure.basic_salary or 0) + 
            float(structure.house_rent_allowance or 0) + 
            float(structure.medical_allowance or 0) + 
            float(structure.transport_allowance or 0) + 
            float(structure.special_allowance or 0)
        )
    
    if structure.net_salary is None:
        structure.net_salary = float(structure.gross_salary or 0) - float(
            float(structure.tax_deduction or 0) + 
            float(structure.provident_fund or 0) + 
            float(structure.insurance or 0) + 
            float(structure.other_deductions or 0)
        )
    
    # Create new salary structure
    db_structure = SalaryStructure(
        employee_id=structure.employee_id,
        effective_from=structure.effective_from,
        basic_salary=structure.basic_salary,
        house_rent_allowance=structure.house_rent_allowance,
        medical_allowance=structure.medical_allowance,
        transport_allowance=structure.transport_allowance,
        special_allowance=structure.special_allowance,
        tax_deduction=structure.tax_deduction,
        provident_fund=structure.provident_fund,
        insurance=structure.insurance,
        other_deductions=structure.other_deductions,
        gross_salary=structure.gross_salary,
        net_salary=structure.net_salary,
        created_by=structure.created_by
    )
    
    db.add(db_structure)
    db.commit()
    db.refresh(db_structure)
    
    # Return with employee details
    result = SalaryStructureWithEmployee.from_orm(db_structure)
    result.employee_name = employee.name
    result.employee_designation = employee.designation
    
    if structure.created_by:
        creator = db.query(Employee).filter(Employee.id == structure.created_by).first()
        if creator:
            result.creator_name = creator.name
    
    return result

@router.put("/structures/{structure_id}", response_model=SalaryStructureWithEmployee)
def update_salary_structure(structure_id: int, structure_update: SalaryStructureUpdate, db: Session = Depends(get_db)):
    """
    Update an existing salary structure
    """
    db_structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not db_structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    # Update fields if provided
    update_data = structure_update.dict(exclude_unset=True)
    
    # Update the structure with new values
    for field, value in update_data.items():
        setattr(db_structure, field, value)
    
    # Recalculate gross and net salary
    # Convert all values to float to avoid type mismatch between float and decimal.Decimal
    db_structure.gross_salary = float(
        float(db_structure.basic_salary or 0) + 
        float(db_structure.house_rent_allowance or 0) + 
        float(db_structure.medical_allowance or 0) + 
        float(db_structure.transport_allowance or 0) + 
        float(db_structure.special_allowance or 0)
    )
    
    db_structure.net_salary = float(db_structure.gross_salary) - float(
        float(db_structure.tax_deduction or 0) + 
        float(db_structure.provident_fund or 0) + 
        float(db_structure.insurance or 0) + 
        float(db_structure.other_deductions or 0)
    )
    
    db.commit()
    db.refresh(db_structure)
    
    # Return with employee details
    employee = db.query(Employee).filter(Employee.id == db_structure.employee_id).first()
    creator = None
    if db_structure.created_by:
        creator = db.query(Employee).filter(Employee.id == db_structure.created_by).first()
    
    result = SalaryStructureWithEmployee.from_orm(db_structure)
    if employee:
        result.employee_name = employee.name
        result.employee_designation = employee.designation
    
    if creator:
        result.creator_name = creator.name
    
    return result

@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salary_structure(structure_id: int, db: Session = Depends(get_db)):
    """
    Delete a salary structure
    """
    db_structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not db_structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    db.delete(db_structure)
    db.commit()
    
    return None

# Payslip endpoints
@router.get("/payslips", response_model=List[PayslipWithEmployee])
def get_payslips(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    month: Optional[str] = None,
    is_paid: Optional[bool] = None,
    is_approved: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Get all payslips with optional filtering
    """
    query = db.query(Payslip)
    
    # Apply filters
    if employee_id:
        query = query.filter(Payslip.employee_id == employee_id)
    
    if month:
        query = query.filter(Payslip.month == month)
    
    if is_paid is not None:
        query = query.filter(Payslip.is_paid == is_paid)
    
    if is_approved is not None:
        query = query.filter(Payslip.is_approved == is_approved)
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    payslips = query.order_by(Payslip.month.desc(), Payslip.employee_id).offset(skip).limit(limit).all()
    
    # Add employee and processor details to each payslip
    result = []
    for payslip in payslips:
        employee = db.query(Employee).filter(Employee.id == payslip.employee_id).first()
        processor = None
        if payslip.processed_by:
            processor = db.query(Employee).filter(Employee.id == payslip.processed_by).first()
        
        approver = None
        if payslip.approved_by:
            approver = db.query(Employee).filter(Employee.id == payslip.approved_by).first()
        
        payslip_with_details = PayslipWithEmployee.from_orm(payslip)
        if employee:
            payslip_with_details.employee_name = employee.name
            payslip_with_details.employee_designation = employee.designation
        
        if processor:
            payslip_with_details.processor_name = processor.name
        
        if approver:
            payslip_with_details.approver_name = approver.name
        
        result.append(payslip_with_details)
    
    return result

@router.get("/payslips/{payslip_id}", response_model=PayslipWithEmployee)
def get_payslip(payslip_id: int, db: Session = Depends(get_db)):
    """
    Get a specific payslip by ID
    """
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # Add employee and processor details
    employee = db.query(Employee).filter(Employee.id == payslip.employee_id).first()
    processor = None
    if payslip.processed_by:
        processor = db.query(Employee).filter(Employee.id == payslip.processed_by).first()
    
    approver = None
    if payslip.approved_by:
        approver = db.query(Employee).filter(Employee.id == payslip.approved_by).first()
    
    result = PayslipWithEmployee.from_orm(payslip)
    if employee:
        result.employee_name = employee.name
        result.employee_designation = employee.designation
    
    if processor:
        result.processor_name = processor.name
    
    if approver:
        result.approver_name = approver.name
    
    return result

@router.post("/payslips", response_model=PayslipWithEmployee, status_code=status.HTTP_201_CREATED)
def create_payslip(payslip: PayslipCreate, db: Session = Depends(get_db)):
    """
    Create a new payslip
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == payslip.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if salary structure exists
    salary_structure = db.query(SalaryStructure).filter(SalaryStructure.id == payslip.salary_structure_id).first()
    if not salary_structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    
    # Check if payslip already exists for this month
    existing_payslip = db.query(Payslip).filter(
        Payslip.employee_id == payslip.employee_id,
        Payslip.month == payslip.month
    ).first()
    
    if existing_payslip:
        raise HTTPException(
            status_code=400, 
            detail="Payslip already exists for this employee and month"
        )
    
    # Create new payslip
    db_payslip = Payslip(**payslip.dict())
    
    db.add(db_payslip)
    db.commit()
    db.refresh(db_payslip)
    
    # Return with employee details
    result = PayslipWithEmployee.from_orm(db_payslip)
    result.employee_name = employee.name
    result.employee_designation = employee.designation
    
    if payslip.processed_by:
        processor = db.query(Employee).filter(Employee.id == payslip.processed_by).first()
        if processor:
            result.processor_name = processor.name
    
    return result

@router.put("/payslips/{payslip_id}", response_model=PayslipWithEmployee)
def update_payslip(payslip_id: int, payslip_update: PayslipUpdate, db: Session = Depends(get_db)):
    """
    Update an existing payslip
    """
    db_payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not db_payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # Update fields if provided
    update_data = payslip_update.dict(exclude_unset=True)
    
    # Update the payslip with new values
    for field, value in update_data.items():
        setattr(db_payslip, field, value)
    
    db.commit()
    db.refresh(db_payslip)
    
    # Return with employee details
    employee = db.query(Employee).filter(Employee.id == db_payslip.employee_id).first()
    processor = None
    if db_payslip.processed_by:
        processor = db.query(Employee).filter(Employee.id == db_payslip.processed_by).first()
    
    approver = None
    if db_payslip.approved_by:
        approver = db.query(Employee).filter(Employee.id == db_payslip.approved_by).first()
    
    result = PayslipWithEmployee.from_orm(db_payslip)
    if employee:
        result.employee_name = employee.name
        result.employee_designation = employee.designation
    
    if processor:
        result.processor_name = processor.name
    
    if approver:
        result.approver_name = approver.name
    
    return result

@router.delete("/payslips/{payslip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payslip(payslip_id: int, db: Session = Depends(get_db)):
    """
    Delete a payslip
    """
    db_payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not db_payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    db.delete(db_payslip)
    db.commit()
    
    return None

@router.post("/payslips/{payslip_id}/approve", response_model=PayslipWithEmployee)
def approve_payslip(payslip_id: int, approval_data: PayslipApprovalRequest, db: Session = Depends(get_db)):
    """
    Approve a payslip
    """
    db_payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not db_payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # Check if approver exists
    approver = db.query(Employee).filter(Employee.id == approval_data.approver_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="Approver not found")
    
    # Update payslip
    db_payslip.is_approved = True
    db_payslip.approved_by = approval_data.approver_id
    
    db.commit()
    db.refresh(db_payslip)
    
    # Return with employee details
    employee = db.query(Employee).filter(Employee.id == db_payslip.employee_id).first()
    processor = None
    if db_payslip.processed_by:
        processor = db.query(Employee).filter(Employee.id == db_payslip.processed_by).first()
    
    result = PayslipWithEmployee.from_orm(db_payslip)
    if employee:
        result.employee_name = employee.name
        result.employee_designation = employee.designation
    
    if processor:
        result.processor_name = processor.name
    
    result.approver_name = approver.name
    
    return result

@router.post("/payslips/{payslip_id}/pay", response_model=PayslipWithEmployee)
def mark_payslip_as_paid(payslip_id: int, payment_reference: str, db: Session = Depends(get_db)):
    """
    Mark a payslip as paid
    """
    db_payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not db_payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    
    # Check if payslip is approved
    if not db_payslip.is_approved:
        raise HTTPException(status_code=400, detail="Payslip must be approved before marking as paid")
    
    # Update payslip
    db_payslip.is_paid = True
    db_payslip.payment_date = datetime.now()
    db_payslip.payment_reference = payment_reference
    
    db.commit()
    db.refresh(db_payslip)
    
    # Return with employee details
    employee = db.query(Employee).filter(Employee.id == db_payslip.employee_id).first()
    processor = None
    if db_payslip.processed_by:
        processor = db.query(Employee).filter(Employee.id == db_payslip.processed_by).first()
    
    approver = None
    if db_payslip.approved_by:
        approver = db.query(Employee).filter(Employee.id == db_payslip.approved_by).first()
    
    result = PayslipWithEmployee.from_orm(db_payslip)
    if employee:
        result.employee_name = employee.name
        result.employee_designation = employee.designation
    
    if processor:
        result.processor_name = processor.name
    
    if approver:
        result.approver_name = approver.name
    
    return result

@router.post("/payslips/generate/{employee_id}/{month}", response_model=PayslipWithEmployee)
def generate_payslip(
    employee_id: int, 
    month: str,  # Format: YYYY-MM
    processor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Generate a payslip for an employee for a specific month based on attendance records and salary structure
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if payslip already exists for this month
    existing_payslip = db.query(Payslip).filter(
        Payslip.employee_id == employee_id,
        Payslip.month == month
    ).first()
    
    if existing_payslip:
        raise HTTPException(
            status_code=400, 
            detail="Payslip already generated for this employee and month"
        )
    
    # Get the latest salary structure for the employee
    salary_structure = db.query(SalaryStructure)\
        .filter(SalaryStructure.employee_id == employee_id)\
        .filter(SalaryStructure.effective_from <= datetime.now())\
        .order_by(SalaryStructure.effective_from.desc())\
        .first()
    
    if not salary_structure:
        raise HTTPException(
            status_code=404, 
            detail="No salary structure found for this employee"
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
    
    # Calculate working days in the month (assuming 22 working days per month as default)
    working_days = 22
    
    # Calculate leave days
    leave_days = working_days - days_present
    
    # Calculate overtime hours (assuming 8 hours per day as standard)
    regular_hours = days_present * 8
    overtime_hours = max(0, total_hours - regular_hours)
    
    # Calculate overtime rate (1.5 times the hourly rate)
    hourly_rate = salary_structure.basic_salary / (22 * 8)  # Assuming 22 working days and 8 hours per day
    overtime_rate = hourly_rate * Decimal('1.5')
    overtime_amount = overtime_hours * overtime_rate
    
    # Calculate gross amount (prorated based on attendance)
    attendance_factor = Decimal(days_present) / Decimal(working_days)
    gross_amount = salary_structure.gross_salary * attendance_factor + overtime_amount
    
    # Calculate deductions
    total_deductions = salary_structure.tax_deduction + salary_structure.provident_fund + \
                      salary_structure.insurance + salary_structure.other_deductions
    
    # Calculate net amount
    net_amount = gross_amount - total_deductions
    
    # Create payslip record
    new_payslip = Payslip(
        employee_id=employee_id,
        salary_structure_id=salary_structure.id,
        month=month,
        working_days=working_days,
        days_present=days_present,
        leave_days=leave_days,
        overtime_hours=overtime_hours,
        overtime_rate=overtime_rate,
        overtime_amount=overtime_amount,
        bonus=0,  # No bonus by default
        additional_deductions=0,  # No additional deductions by default
        gross_amount=gross_amount,
        total_deductions=total_deductions,
        net_amount=net_amount,
        is_generated=True,
        processed_by=processor_id
    )
    
    db.add(new_payslip)
    db.commit()
    db.refresh(new_payslip)
    
    # Prepare response with employee details
    result = PayslipWithEmployee.from_orm(new_payslip)
    result.employee_name = employee.name
    result.employee_designation = employee.designation
    
    if processor_id:
        processor = db.query(Employee).filter(Employee.id == processor_id).first()
        if processor:
            result.processor_name = processor.name
    
    return result
