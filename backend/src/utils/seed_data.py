from datetime import date, timedelta
import random
from sqlalchemy.orm import Session
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll

def seed_employees(db: Session):
    """
    Seed the database with sample employees
    """
    employees = [
        {
            "name": "John Smith",
            "phone": "1234567890",
            "doj": date(2022, 1, 15),
            "designation": "Farm Worker",
            "location": "North Field",
            "status": True
        },
        {
            "name": "Mary Johnson",
            "phone": "2345678901",
            "doj": date(2022, 3, 10),
            "designation": "Supervisor",
            "location": "Main Office",
            "status": True
        },
        {
            "name": "Robert Williams",
            "phone": "3456789012",
            "doj": date(2022, 5, 22),
            "designation": "Farm Worker",
            "location": "South Field",
            "status": True
        },
        {
            "name": "Sarah Davis",
            "phone": "4567890123",
            "doj": date(2022, 7, 5),
            "designation": "Farm Worker",
            "location": "East Field",
            "status": True
        },
        {
            "name": "Michael Brown",
            "phone": "5678901234",
            "doj": date(2022, 9, 18),
            "designation": "Driver",
            "location": "Transport",
            "status": True
        }
    ]
    
    for employee_data in employees:
        employee = Employee(**employee_data)
        db.add(employee)
    
    db.commit()
    print("Employees seeded successfully!")

def seed_attendance(db: Session):
    """
    Seed the database with sample attendance records for the past month
    """
    # Get all employees
    employees = db.query(Employee).all()
    if not employees:
        print("No employees found. Please seed employees first.")
        return
    
    # Generate attendance for the last 30 days
    today = date.today()
    shifts = ["Morning", "Afternoon", "Night"]
    
    for employee in employees:
        # Not every employee works every day
        work_days = random.sample(range(30), random.randint(15, 25))
        
        for day_offset in work_days:
            work_date = today - timedelta(days=day_offset)
            shift = random.choice(shifts)
            crates_handled = random.randint(10, 50)
            
            attendance = Attendance(
                employee_id=employee.id,
                date=work_date,
                shift=shift,
                crates_handled=crates_handled
            )
            db.add(attendance)
    
    db.commit()
    print("Attendance records seeded successfully!")

def seed_payroll(db: Session):
    """
    Generate payroll records based on attendance
    """
    # Get all employees
    employees = db.query(Employee).all()
    if not employees:
        print("No employees found. Please seed employees first.")
        return
    
    # Current month in YYYY-MM format
    today = date.today()
    current_month = f"{today.year}-{today.month:02d}"
    previous_month = f"{(today.replace(day=1) - timedelta(days=1)).year}-{(today.replace(day=1) - timedelta(days=1)).month:02d}"
    
    for employee in employees:
        # Calculate days present for previous month
        start_date = date(today.year, today.month - 1 if today.month > 1 else 12, 1)
        end_date = date(today.year, today.month, 1) - timedelta(days=1)
        
        days_present = db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).count()
        
        # Calculate crates handled
        crates_result = db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= start_date,
            Attendance.date <= end_date
        ).with_entities(
            db.func.sum(Attendance.crates_handled)
        ).first()
        
        crates_handled = crates_result[0] if crates_result[0] else 0
        
        # Calculate payroll
        crate_bonus = float(crates_handled) * 0.5
        base_salary = days_present * 100
        salary_total = base_salary + crate_bonus
        
        payroll = Payroll(
            employee_id=employee.id,
            month=previous_month,
            days_present=days_present,
            crate_bonus=crate_bonus,
            salary_total=salary_total
        )
        db.add(payroll)
    
    db.commit()
    print("Payroll records seeded successfully!")

def seed_all(db: Session):
    """
    Seed all data in the correct order
    """
    seed_employees(db)
    seed_attendance(db)
    seed_payroll(db)
    print("All data seeded successfully!")
