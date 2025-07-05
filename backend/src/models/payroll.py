from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, func
from sqlalchemy.orm import relationship
from src.db.base_class import Base

class Payroll(Base):
    __tablename__ = "payroll"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    month = Column(String(7), nullable=False)  # Format: YYYY-MM
    days_present = Column(Integer, nullable=False, default=0)
    salary_total = Column(Numeric(10, 2), nullable=False)
    
    # Additional scalable fields
    base_salary = Column(Numeric(10, 2), nullable=True)
    overtime_hours = Column(Numeric(5, 2), default=0)
    overtime_rate = Column(Numeric(6, 2), default=0)
    bonus = Column(Numeric(8, 2), default=0)
    deductions = Column(Numeric(8, 2), default=0)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    processed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('employee_id', 'month', name='unique_employee_month'),
        CheckConstraint("month ~ '^\\d{4}-\\d{2}$'", name='valid_month'),
        CheckConstraint('days_present >= 0 AND days_present <= 31', name='valid_days_present'),
        CheckConstraint('salary_total >= 0', name='valid_salary')
    )
    
    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="payroll_records")
    payslips = relationship("Payslip", back_populates="payroll_record")
    
    def calculate_salary(self):
        """Calculate total salary based on components"""
        total = 0
        if self.base_salary:
            total += self.base_salary
        
        # Add overtime
        if self.overtime_hours and self.overtime_rate:
            total += self.overtime_hours * self.overtime_rate
        
        # Add bonus
        if self.bonus:
            total += self.bonus
        
        # Subtract deductions
        if self.deductions:
            total -= self.deductions
            
        return total
