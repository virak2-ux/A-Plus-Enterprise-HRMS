from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel


class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date
    reason: str
    attachment_url: Optional[str] = None


class LeaveRequestOut(BaseModel):
    id: str
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date
    total_days: float
    reason: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveBalanceOut(BaseModel):
    id: str
    employee_id: str
    leave_type_id: str
    year: int
    entitled_days: float
    carried_forward_days: float
    taken_days: float
    pending_days: float
    remaining_days: float

    class Config:
        from_attributes = True
