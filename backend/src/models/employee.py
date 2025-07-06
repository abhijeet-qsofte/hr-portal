from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, CheckConstraint, func
from sqlalchemy.orm import relationship
from src.db.base_class import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)  # Making it nullable for existing records
    phone = Column(String(15), unique=True, nullable=False)
    doj = Column(Date, nullable=False)  # Date of Joining
    designation = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    status = Column(String(10), default="active")  # active/inactive/terminated
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive', 'terminated')", name="valid_status"),
        CheckConstraint("doj <= CURRENT_DATE", name="valid_doj"),
        {'extend_existing': True}
    )
    
    # Relationships
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    payroll_records = relationship("Payroll", foreign_keys="Payroll.employee_id", back_populates="employee", cascade="all, delete-orphan")
    salary_structures = relationship("SalaryStructure", foreign_keys="SalaryStructure.employee_id", back_populates="employee", cascade="all, delete-orphan")
    payslips = relationship("Payslip", foreign_keys="Payslip.employee_id", back_populates="employee", cascade="all, delete-orphan")
    
    # Additional relationships for scalability
    processed_payrolls = relationship("Payroll", foreign_keys="Payroll.processed_by", backref="processor")
    created_salary_structures = relationship("SalaryStructure", foreign_keys="SalaryStructure.created_by", backref="creator")
    processed_payslips = relationship("Payslip", foreign_keys="Payslip.processed_by", backref="processor")
    approved_payslips = relationship("Payslip", foreign_keys="Payslip.approved_by", backref="approver")
    
    # User relationship for authentication
    user = relationship("User", back_populates="employee", uselist=False)
