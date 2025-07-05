from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Interval, Numeric, ForeignKey, CheckConstraint, UniqueConstraint, func
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql import expression
from sqlalchemy.orm import relationship
from src.db.base_class import Base

# Custom SQL function for calculating total hours
class TotalHoursGenerated(expression.FunctionElement):
    name = "total_hours_generated"
    type = Numeric

@compiles(TotalHoursGenerated)
def compile_total_hours(element, compiler, **kw):
    return "CASE WHEN end_time IS NOT NULL THEN EXTRACT(EPOCH FROM (end_time - start_time - COALESCE(break_duration, '0 minutes'::interval))) / 3600 ELSE NULL END"

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=True)
    break_duration = Column(Interval, default='0 minutes')
    total_hours = Column(Numeric(4, 2), default=None)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('employee_id', 'date', name='unique_employee_date'),
        CheckConstraint('date <= CURRENT_DATE', name='valid_date'),
        CheckConstraint('end_time IS NULL OR end_time > start_time', name='valid_time_order')
    )
    
    # Relationship
    employee = relationship("Employee", back_populates="attendance_records")
    
    def calculate_total_hours(self):
        """Calculate total hours worked"""
        if self.end_time and self.start_time:
            # Convert time objects to datetime for calculation
            from datetime import datetime, timedelta
            today = datetime.now().date()
            start_dt = datetime.combine(today, self.start_time)
            end_dt = datetime.combine(today, self.end_time)
            
            # Calculate duration
            duration = end_dt - start_dt
            
            # Subtract break duration if available
            if self.break_duration:
                duration -= self.break_duration
                
            # Convert to hours
            return round(duration.total_seconds() / 3600, 2)
        return None
