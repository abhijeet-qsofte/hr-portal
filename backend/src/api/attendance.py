from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time

from src.db.session import get_db
from src.models.attendance import Attendance
from src.models.employee import Employee
from src.schemas.attendance import AttendanceCreate, AttendanceUpdate, Attendance as AttendanceSchema, AttendanceWithEmployee

router = APIRouter()

@router.get("", response_model=List[AttendanceSchema])
def get_attendance_records(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Retrieve all attendance records with pagination
    """
    attendance_records = db.query(Attendance).offset(skip).limit(limit).all()
    return attendance_records

@router.get("/detailed", response_model=List[AttendanceWithEmployee])
def get_detailed_attendance_records(
    skip: int = 0, 
    limit: int = 100, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all attendance records with employee details and date filtering
    """
    # Start with base query
    query = db.query(Attendance, Employee.name, Employee.designation)\
        .join(Employee, Attendance.employee_id == Employee.id)
    
    # Apply date filters if provided
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    
    # Apply pagination
    results = query.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()
    
    # Format response
    response = []
    for attendance, emp_name, emp_designation in results:
        attendance_dict = AttendanceWithEmployee.from_orm(attendance)
        attendance_dict.employee_name = emp_name
        attendance_dict.employee_designation = emp_designation
        response.append(attendance_dict)
    
    return response

@router.post("/", response_model=AttendanceSchema, status_code=status.HTTP_201_CREATED)
def create_attendance_record(
    attendance: AttendanceCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new attendance record
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == attendance.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if attendance record already exists for this employee on this date
    existing_record = db.query(Attendance).filter(
        Attendance.employee_id == attendance.employee_id,
        Attendance.date == attendance.date
    ).first()
    
    if existing_record:
        raise HTTPException(
            status_code=400, 
            detail="Attendance record already exists for this employee on this date"
        )
    
    # Calculate total hours if end_time is provided
    total_hours = None
    if attendance.end_time and attendance.start_time:
        # Create datetime objects for calculation
        today = datetime.now().date()
        start_dt = datetime.combine(today, attendance.start_time)
        end_dt = datetime.combine(today, attendance.end_time)
        
        # Calculate duration
        duration = end_dt - start_dt
        
        # Subtract break duration if available
        if attendance.break_duration:
            duration -= attendance.break_duration
            
        # Convert to hours
        total_hours = round(duration.total_seconds() / 3600, 2)
    
    db_attendance = Attendance(
        employee_id=attendance.employee_id,
        date=attendance.date,
        start_time=attendance.start_time,
        end_time=attendance.end_time,
        break_duration=attendance.break_duration,
        total_hours=total_hours
    )
    
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.get("/{attendance_id}", response_model=AttendanceSchema)
def get_attendance_record(
    attendance_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific attendance record by ID
    """
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if db_attendance is None:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return db_attendance

@router.get("/employee/{employee_id}", response_model=List[AttendanceSchema])
def get_employee_attendance(
    employee_id: int, 
    start_date: date = None, 
    end_date: date = None, 
    db: Session = Depends(get_db)
):
    """
    Retrieve attendance records for a specific employee with optional date filtering
    """
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Base query
    query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    
    # Apply date filters if provided
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    
    # Execute query
    attendance_records = query.all()
    return attendance_records
