from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import date, time, datetime, timedelta

class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    start_time: time
    end_time: Optional[time] = None
    break_duration: Optional[timedelta] = Field(default=timedelta(minutes=0))
    total_hours: Optional[float] = None
    
    @validator('date')
    def validate_date(cls, v):
        if v > date.today():
            raise ValueError('Attendance date cannot be in the future')
        return v
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if v is not None and 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    break_duration: Optional[timedelta] = None
    
    @validator('date')
    def validate_date(cls, v):
        if v is not None and v > date.today():
            raise ValueError('Attendance date cannot be in the future')
        return v
    
    @validator('end_time')
    def validate_end_time(cls, v, values):
        if v is not None and 'start_time' in values and values['start_time'] is not None and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v

class AttendanceInDB(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        # Keep orm_mode for backward compatibility
        orm_mode = True

class Attendance(AttendanceInDB):
    pass

class AttendanceWithEmployee(Attendance):
    employee_name: Optional[str] = None
    employee_designation: Optional[str] = None
