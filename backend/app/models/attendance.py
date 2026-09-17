from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, Time, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class WorkSchedule(BaseModel):
    __tablename__ = "work_schedules"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    weekly_working_days = Column(Integer, default=5, nullable=False)
    standard_start_time = Column(Time, nullable=False)
    standard_end_time = Column(Time, nullable=False)
    break_duration_minutes = Column(Integer, default=60, nullable=False)
    grace_period_minutes = Column(Integer, default=15, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Holiday(BaseModel):
    __tablename__ = "holidays"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    name_kh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    is_paid = Column(Boolean, default=True, nullable=False)
    holiday_type = Column(String(50), default="GOVERNMENT", nullable=False)  # "GOVERNMENT", "COMPANY"
    observed_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)


class AttendanceRecord(BaseModel):
    __tablename__ = "attendance_records"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    
    late_minutes = Column(Integer, default=0, nullable=False)
    early_departure_minutes = Column(Integer, default=0, nullable=False)
    total_work_hours = Column(Numeric(5, 2), default=0.00, nullable=False)
    
    status = Column(String(30), default="PRESENT", nullable=False)
    # Statuses: PRESENT, LATE, EARLY_DEPARTURE, HALF_DAY, ABSENT, ON_LEAVE, BUSINESS_TRIP, REST_DAY, HOLIDAY
    source = Column(String(30), default="WEB", nullable=False)
    # Sources: WEB, MOBILE, BIOMETRIC, MANUAL, IMPORT
    notes = Column(String(255), nullable=True)

    employee = relationship("Employee")
