from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, func, Boolean, Text
from sqlalchemy.orm import relationship
from src.db.base_class import Base

class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    effective_from = Column(DateTime(timezone=True), nullable=False)
    
    # Basic salary components
    basic_salary = Column(Numeric(10, 2), nullable=False)
    house_rent_allowance = Column(Numeric(10, 2), default=0)
    medical_allowance = Column(Numeric(10, 2), default=0)
    transport_allowance = Column(Numeric(10, 2), default=0)
    special_allowance = Column(Numeric(10, 2), default=0)
    
    # Deduction components
    tax_deduction = Column(Numeric(10, 2), default=0)
    provident_fund = Column(Numeric(10, 2), default=0)
    insurance = Column(Numeric(10, 2), default=0)
    other_deductions = Column(Numeric(10, 2), default=0)
    
    # Calculated fields
    gross_salary = Column(Numeric(10, 2), nullable=False)
    net_salary = Column(Numeric(10, 2), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="salary_structures")
    payslips = relationship("Payslip", back_populates="salary_structure")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('basic_salary >= 0', name='valid_basic_salary'),
        CheckConstraint('gross_salary >= 0', name='valid_gross_salary'),
        CheckConstraint('net_salary >= 0', name='valid_net_salary'),
        {'extend_existing': True}
    )
    
    def calculate_gross_salary(self):
        """Calculate gross salary based on all allowances"""
        return (self.basic_salary + 
                self.house_rent_allowance + 
                self.medical_allowance + 
                self.transport_allowance + 
                self.special_allowance)
    
    def calculate_total_deductions(self):
        """Calculate total deductions"""
        return (self.tax_deduction + 
                self.provident_fund + 
                self.insurance + 
                self.other_deductions)
    
    def calculate_net_salary(self):
        """Calculate net salary after deductions"""
        return self.calculate_gross_salary() - self.calculate_total_deductions()


class Payslip(Base):
    __tablename__ = "payslips"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=False)
    payroll_id = Column(Integer, ForeignKey("payroll.id"), nullable=True)
    month = Column(String(7), nullable=False)  # Format: YYYY-MM
    
    # Working days and attendance
    working_days = Column(Integer, nullable=False, default=0)
    days_present = Column(Integer, nullable=False, default=0)
    leave_days = Column(Integer, nullable=False, default=0)
    
    # Overtime and bonus
    overtime_hours = Column(Numeric(5, 2), default=0)
    overtime_rate = Column(Numeric(6, 2), default=0)
    overtime_amount = Column(Numeric(8, 2), default=0)
    bonus = Column(Numeric(8, 2), default=0)
    bonus_description = Column(String(255), nullable=True)
    
    # Additional deductions
    additional_deductions = Column(Numeric(8, 2), default=0)
    deduction_description = Column(String(255), nullable=True)
    
    # Final amounts
    gross_amount = Column(Numeric(10, 2), nullable=False)
    total_deductions = Column(Numeric(10, 2), nullable=False)
    net_amount = Column(Numeric(10, 2), nullable=False)
    
    # Payslip status
    is_generated = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_reference = Column(String(100), nullable=True)
    
    # PDF storage
    pdf_url = Column(String(255), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    processed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="payslips")
    salary_structure = relationship("SalaryStructure", back_populates="payslips")
    payroll_record = relationship("Payroll", back_populates="payslips")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('employee_id', 'month', name='unique_employee_month_payslip'),
        CheckConstraint("month ~ '^\\d{4}-\\d{2}$'", name='valid_month_payslip'),
        CheckConstraint('days_present >= 0 AND days_present <= 31', name='valid_days_present_payslip'),
        CheckConstraint('working_days >= 0 AND working_days <= 31', name='valid_working_days_payslip'),
        CheckConstraint('leave_days >= 0 AND leave_days <= 31', name='valid_leave_days_payslip'),
        CheckConstraint('gross_amount >= 0', name='valid_gross_amount_payslip'),
        CheckConstraint('net_amount >= 0', name='valid_net_amount_payslip'),
    )
