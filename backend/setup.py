#!/usr/bin/env python3
"""
Setup script for Asikh Farms HR Portal
This script initializes the database and creates test data
"""
import os
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime, time, timedelta

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from src.db.base_class import Base
from src.db.session import engine, SessionLocal

# Import all models to ensure they're registered with SQLAlchemy
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll
from src.models.salary import SalaryStructure, Payslip

def create_tables():
    """Create all tables in the database"""
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

def drop_tables():
    """Drop all tables in the database"""
    print("Dropping tables...")
    # Use raw SQL with CASCADE to handle dependencies
    with engine.connect() as connection:
        connection.execute(text("DROP SCHEMA public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))
        connection.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        connection.execute(text("GRANT ALL ON SCHEMA public TO public"))
        connection.commit()
    print("Tables dropped successfully!")

def seed_data():
    """Seed the database with test data"""
    print("Seeding database with test data...")
    db = SessionLocal()
    
    try:
        # Create test employees
        employees = [
            Employee(
                name="John Doe",
                phone="123-456-7890",
                doj=date(2023, 1, 15),
                designation="Farm Manager",
                location="Main Farm",
                status="active"
            ),
            Employee(
                name="Jane Smith",
                phone="234-567-8901",
                doj=date(2023, 2, 1),
                designation="Field Worker",
                location="East Field",
                status="active"
            ),
            Employee(
                name="Bob Johnson",
                phone="345-678-9012",
                doj=date(2023, 3, 10),
                designation="Tractor Operator",
                location="West Field",
                status="active"
            ),
            Employee(
                name="Alice Williams",
                phone="456-789-0123",
                doj=date(2023, 4, 5),
                designation="Accountant",
                location="Office",
                status="active"
            ),
            Employee(
                name="Charlie Brown",
                phone="567-890-1234",
                doj=date(2023, 5, 20),
                designation="Field Worker",
                location="South Field",
                status="inactive"
            )
        ]
        
        db.add_all(employees)
        db.commit()
        
        # Refresh to get IDs
        for emp in employees:
            db.refresh(emp)
        
        # Create attendance records
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        attendance_records = [
            # John Doe's attendance
            Attendance(
                employee_id=employees[0].id,
                date=today,
                start_time=time(8, 0),
                end_time=time(17, 0),
                break_duration=timedelta(minutes=60),
                total_hours=8.0
            ),
            Attendance(
                employee_id=employees[0].id,
                date=yesterday,
                start_time=time(8, 0),
                end_time=time(17, 30),
                break_duration=timedelta(minutes=45),
                total_hours=8.75
            ),
            
            # Jane Smith's attendance
            Attendance(
                employee_id=employees[1].id,
                date=today,
                start_time=time(7, 30),
                end_time=time(16, 30),
                break_duration=timedelta(minutes=60),
                total_hours=8.0
            ),
            
            # Bob Johnson's attendance
            Attendance(
                employee_id=employees[2].id,
                date=today,
                start_time=time(8, 0),
                end_time=time(18, 0),
                break_duration=timedelta(minutes=60),
                total_hours=9.0
            ),
            
            # Alice Williams' attendance
            Attendance(
                employee_id=employees[3].id,
                date=yesterday,
                start_time=time(9, 0),
                end_time=time(17, 0),
                break_duration=timedelta(minutes=60),
                total_hours=7.0
            )
        ]
        
        db.add_all(attendance_records)
        db.commit()
        
        # Create payroll records
        current_month = f"{today.year}-{today.month:02d}"
        last_month = f"{yesterday.year}-{yesterday.month:02d}" if yesterday.month != today.month else f"{today.year}-{today.month-1:02d}"
        
        payroll_records = [
            # John Doe's payroll
            Payroll(
                employee_id=employees[0].id,
                month=last_month,
                days_present=22,
                base_salary=3520.0,  # $20/hr * 8hrs * 22days
                overtime_hours=10.0,
                overtime_rate=30.0,
                bonus=200.0,
                deductions=150.0,
                salary_total=3870.0,  # 3520 + (10*30) + 200 - 150
                processed_by=employees[3].id  # Processed by Alice (Accountant)
            ),
            
            # Jane Smith's payroll
            Payroll(
                employee_id=employees[1].id,
                month=last_month,
                days_present=20,
                base_salary=2400.0,  # $15/hr * 8hrs * 20days
                overtime_hours=5.0,
                overtime_rate=22.5,
                bonus=100.0,
                deductions=120.0,
                salary_total=2492.5,  # 2400 + (5*22.5) + 100 - 120
                processed_by=employees[3].id
            ),
            
            # Bob Johnson's payroll
            Payroll(
                employee_id=employees[2].id,
                month=last_month,
                days_present=21,
                base_salary=2940.0,  # $17.5/hr * 8hrs * 21days
                overtime_hours=12.0,
                overtime_rate=26.25,
                bonus=150.0,
                deductions=180.0,
                salary_total=3225.0,  # 2940 + (12*26.25) + 150 - 180
                processed_by=employees[3].id
            )
        ]
        
        db.add_all(payroll_records)
        db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Setup script for Asikh Farms HR Portal")
    parser.add_argument("--create", action="store_true", help="Create database tables")
    parser.add_argument("--drop", action="store_true", help="Drop database tables")
    parser.add_argument("--seed", action="store_true", help="Seed database with test data")
    parser.add_argument("--reset", action="store_true", help="Reset database (drop, create, seed)")
    
    args = parser.parse_args()
    
    if args.reset:
        drop_tables()
        create_tables()
        seed_data()
    else:
        if args.drop:
            drop_tables()
        if args.create:
            create_tables()
        if args.seed:
            seed_data()
    
    if not any([args.create, args.drop, args.seed, args.reset]):
        parser.print_help()

if __name__ == "__main__":
    main()
