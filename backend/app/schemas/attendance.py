from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class AttendanceCheckIn(BaseModel):
    employee_id: str
    source: str = "WEB"  # WEB, MOBILE, BIOMETRIC
    notes: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    employee_id: str
    source: str = "WEB"
    notes: Optional[str] = None


class AttendanceRecordOut(BaseModel):
    id: str
    employee_id: str
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    late_minutes: int
    early_departure_minutes: int
    total_work_hours: float
    status: str
    source: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class HolidayBase(BaseModel):
    company_id: Optional[str] = None
    name_kh: str
    name_en: str
    date: date
    year: int
    is_paid: bool = True
    holiday_type: str = "GOVERNMENT"
    observed_date: Optional[date] = None


class HolidayCreate(HolidayBase):
    pass


class HolidayOut(HolidayBase):
    id: str

    class Config:
        from_attributes = True
