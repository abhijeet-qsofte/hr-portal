"""
Database setup module to ensure models are only registered once.
This module initializes the SQLAlchemy Base and imports all models.
It uses the singleton pattern to ensure only one instance of Base exists.
"""
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the Base singleton first
from src.db.base_class import Base

# Import all models to register them with SQLAlchemy
# The order is important to handle foreign key relationships correctly
from src.models.employee import Employee
from src.models.attendance import Attendance
from src.models.payroll import Payroll
from src.models.salary import SalaryStructure, Payslip

# Import database initialization function
from src.db.init_db import init_db

# This flag indicates that models have been registered
models_registered = True

# Initialize the database if needed
def setup_db():
    """Initialize the database if needed"""
    init_db()
