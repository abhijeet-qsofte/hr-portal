#!/usr/bin/env python3
"""
Script to seed salary data for the Asikh Farms HR Portal
"""
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))

from db.session import SessionLocal
from models.employee import Employee
from models.salary import SalaryStructure, Payslip

def seed_salary_data():
    """Seed salary structures and payslips for existing employees"""
    db = SessionLocal()
    try:
        # Get all employees
        employees = db.query(Employee).all()
        
        if not employees:
            print("No employees found in the database.")
            return
        
        print(f"Found {len(employees)} employees. Creating salary structures...")
        
        # Create salary structures for each employee
        for employee in employees:
            # Check if employee already has a salary structure
            existing = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee.id).first()
            if existing:
                print(f"Employee {employee.name} already has a salary structure.")
                continue
                
            # Create a salary structure based on designation
            basic_salary = 0
            if employee.designation == "Farm Manager":
                basic_salary = Decimal("5000.00")
            elif employee.designation == "Accountant":
                basic_salary = Decimal("4000.00")
            elif employee.designation == "Tractor Operator":
                basic_salary = Decimal("3500.00")
            else:  # Field Worker or other
                basic_salary = Decimal("3000.00")
                
            # Calculate allowances
            hra = basic_salary * Decimal("0.4")  # 40% of basic
            medical = Decimal("500.00")
            transport = Decimal("300.00")
            special = Decimal("200.00")
            
            # Calculate deductions
            tax = basic_salary * Decimal("0.1")  # 10% tax
            pf = basic_salary * Decimal("0.12")  # 12% provident fund
            insurance = Decimal("200.00")
            
            # Calculate gross and net
            gross = basic_salary + hra + medical + transport + special
            net = gross - (tax + pf + insurance)
            
            # Create the salary structure
            salary_structure = SalaryStructure(
                employee_id=employee.id,
                effective_from=datetime.now() - timedelta(days=30),  # 30 days ago
                basic_salary=basic_salary,
                house_rent_allowance=hra,
                medical_allowance=medical,
                transport_allowance=transport,
                special_allowance=special,
                tax_deduction=tax,
                provident_fund=pf,
                insurance=insurance,
                other_deductions=Decimal("0.00"),
                gross_salary=gross,
                net_salary=net,
                created_by=1  # Assuming ID 1 is an admin
            )
            
            db.add(salary_structure)
            print(f"Created salary structure for {employee.name}")
        
        # Commit the changes
        db.commit()
        print("Salary structures created successfully!")
        
        # Now create some payslips for the current month
        current_month = datetime.now().strftime("%Y-%m")
        print(f"Creating payslips for month {current_month}...")
        
        for employee in employees:
            # Get the employee's salary structure
            salary_structure = db.query(SalaryStructure).filter(
                SalaryStructure.employee_id == employee.id
            ).first()
            
            if not salary_structure:
                print(f"No salary structure found for {employee.name}. Skipping payslip creation.")
                continue
                
            # Check if payslip already exists for this month
            existing = db.query(Payslip).filter(
                Payslip.employee_id == employee.id,
                Payslip.month == current_month
            ).first()
            
            if existing:
                print(f"Payslip for {employee.name} for {current_month} already exists.")
                continue
                
            # Create a payslip
            working_days = 22  # Typical working days in a month
            days_present = 20 if employee.status == "active" else 15  # Less days for inactive employees
            leave_days = working_days - days_present
            
            # Calculate amounts based on attendance
            attendance_factor = days_present / working_days if working_days > 0 else 1
            gross_amount = salary_structure.gross_salary * Decimal(str(attendance_factor))
            total_deductions = salary_structure.tax_deduction + salary_structure.provident_fund + \
                             salary_structure.insurance + salary_structure.other_deductions
            net_amount = gross_amount - total_deductions
            
            payslip = Payslip(
                employee_id=employee.id,
                salary_structure_id=salary_structure.id,
                month=current_month,
                working_days=working_days,
                days_present=days_present,
                leave_days=leave_days,
                overtime_hours=Decimal('0.00'),
                overtime_rate=Decimal('0.00'),
                overtime_amount=Decimal('0.00'),
                bonus=Decimal('0.00'),
                bonus_description='',
                additional_deductions=Decimal('0.00'),
                deduction_description='',
                gross_amount=gross_amount,
                total_deductions=total_deductions,
                net_amount=net_amount,
                is_generated=True,
                is_approved=False,
                is_paid=False,
                processed_by=1,  # Assuming ID 1 is an admin
                notes='Auto-generated payslip'
            )
            
            db.add(payslip)
            print(f"Created payslip for {employee.name} for {current_month}")
            
        # Commit the changes
        db.commit()
        print("Payslips created successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding salary data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_salary_data()
