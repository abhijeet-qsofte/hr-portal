# Import base class from base_class.py
from src.db.base_class import Base

# Import all models here to ensure they're registered with SQLAlchemy
# This helps resolve circular dependencies
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll
from src.models.salary import SalaryStructure, Payslip

# These imports are used by Alembic and other parts of the application
# to discover all models
