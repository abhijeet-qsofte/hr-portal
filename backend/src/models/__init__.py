"""
Models package initialization.
This file helps resolve circular imports between models.
"""
# Import all models to ensure they're registered with SQLAlchemy
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll
from src.models.salary import SalaryStructure, Payslip
