from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import date

from src.db.session import get_db
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll
from src.schemas.employee import EmployeeCreate, EmployeeUpdate, Employee as EmployeeSchema, EmployeeWithRelations

router = APIRouter()

@router.get("", response_model=List[EmployeeSchema], 
         summary="List all employees",
         description="Retrieve a list of all employees with pagination support")
def get_employees(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Retrieve all employees with pagination.
    
    ## Parameters
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    
    ## Returns
    - List of employee records with basic information
    
    ## Example Response
    ```json
    [
      {
        "id": 1,
        "name": "John Doe",
        "phone": "123-456-7890",
        "doj": "2023-01-15",
        "designation": "Farm Manager",
        "location": "Main Farm",
        "status": "active",
        "created_at": "2023-11-01T10:00:00",
        "updated_at": "2023-11-01T10:00:00"
      }
    ]
    ```
    """
    employees = db.query(Employee).offset(skip).limit(limit).all()
    return employees

@router.get("/detailed", response_model=List[EmployeeWithRelations],
         summary="List employees with detailed information",
         description="Retrieve a list of employees with attendance count and latest payroll information")
def get_detailed_employees(
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all employees with attendance count and latest payroll information.
    
    ## Parameters
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **status**: Filter by employee status ('active', 'inactive', 'terminated')
    
    ## Returns
    - List of employee records with attendance count and latest payroll information
    
    ## Example Response
    ```json
    [
      {
        "id": 1,
        "name": "John Doe",
        "phone": "123-456-7890",
        "doj": "2023-01-15",
        "designation": "Farm Manager",
        "location": "Main Farm",
        "status": "active",
        "created_at": "2023-11-01T10:00:00",
        "updated_at": "2023-11-01T10:00:00",
        "attendance_count": 15,
        "latest_payroll": {
          "month": "2023-11",
          "days_present": 22,
          "salary_total": 2500.0,
          "base_salary": 2200.0,
          "overtime_hours": 10.0,
          "bonus": 250.0
        }
      }
    ]
    ```
    """
    # Start with base query
    query = db.query(Employee)
    
    # Apply status filter if provided
    if status:
        query = query.filter(Employee.status == status)
    
    # Apply pagination
    employees = query.offset(skip).limit(limit).all()
    
    # Format response with additional information
    result = []
    for employee in employees:
        # Get attendance count
        attendance_count = db.query(func.count(Attendance.id)).filter(
            Attendance.employee_id == employee.id
        ).scalar() or 0
        
        # Get latest payroll
        latest_payroll = db.query(Payroll).filter(
            Payroll.employee_id == employee.id
        ).order_by(desc(Payroll.month)).first()
        
        # Create response object
        emp_dict = EmployeeWithRelations.from_orm(employee)
        emp_dict.attendance_count = attendance_count
        
        if latest_payroll:
            emp_dict.latest_payroll = {
                "month": latest_payroll.month,
                "days_present": latest_payroll.days_present,
                "salary_total": float(latest_payroll.salary_total)
            }
        
        result.append(emp_dict)
    
    return result

@router.post("/", response_model=EmployeeSchema, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new employee
    """
    db_employee = Employee(
        name=employee.name,
        phone=employee.phone,
        doj=employee.doj,
        designation=employee.designation,
        location=employee.location,
        status=employee.status
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.get("/{employee_id}", response_model=EmployeeSchema)
def get_employee(
    employee_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific employee by ID
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee

@router.get("/{employee_id}/detailed", response_model=EmployeeWithRelations)
def get_detailed_employee(
    employee_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific employee by ID with attendance and payroll details
    """
    # Get employee
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get attendance count
    attendance_count = db.query(func.count(Attendance.id)).filter(
        Attendance.employee_id == employee_id
    ).scalar() or 0
    
    # Get latest payroll
    latest_payroll = db.query(Payroll).filter(
        Payroll.employee_id == employee_id
    ).order_by(desc(Payroll.month)).first()
    
    # Create response object
    result = EmployeeWithRelations.from_orm(db_employee)
    result.attendance_count = attendance_count
    
    if latest_payroll:
        result.latest_payroll = {
            "month": latest_payroll.month,
            "days_present": latest_payroll.days_present,
            "salary_total": float(latest_payroll.salary_total),
            "base_salary": float(latest_payroll.base_salary) if latest_payroll.base_salary else None,
            "overtime_hours": float(latest_payroll.overtime_hours) if latest_payroll.overtime_hours else 0,
            "bonus": float(latest_payroll.bonus) if latest_payroll.bonus else 0
        }
    
    return result

@router.put("/{employee_id}", response_model=EmployeeSchema)
def update_employee(
    employee_id: int, 
    employee: EmployeeUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update an employee's information
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update employee attributes
    update_data = employee.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int, 
    db: Session = Depends(get_db)
):
    """
    Delete an employee
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return None
