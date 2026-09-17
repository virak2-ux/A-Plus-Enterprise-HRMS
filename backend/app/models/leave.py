from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class LeaveType(BaseModel):
    __tablename__ = "leave_types"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    code = Column(String(50), nullable=False, index=True)  # "ANNUAL", "SICK", "MATERNITY", "PATERNITY", "SPECIAL", "UNPAID"
    name_kh = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    is_paid = Column(Boolean, default=True, nullable=False)
    default_days_per_year = Column(Numeric(5, 1), default=18.0, nullable=False)
    requires_attachment = Column(Boolean, default=False, nullable=False)
    is_accumulative = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class LeaveBalance(BaseModel):
    __tablename__ = "leave_balances"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    leave_type_id = Column(String(36), ForeignKey("leave_types.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    
    entitled_days = Column(Numeric(5, 1), default=0.0, nullable=False)
    carried_forward_days = Column(Numeric(5, 1), default=0.0, nullable=False)
    taken_days = Column(Numeric(5, 1), default=0.0, nullable=False)
    pending_days = Column(Numeric(5, 1), default=0.0, nullable=False)
    remaining_days = Column(Numeric(5, 1), default=0.0, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")


class LeaveRequest(BaseModel):
    __tablename__ = "leave_requests"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    leave_type_id = Column(String(36), ForeignKey("leave_types.id"), nullable=False, index=True)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Numeric(5, 1), nullable=False)
    reason = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    
    status = Column(String(30), default="PENDING", nullable=False, index=True)
    # Statuses: PENDING, APPROVED_MANAGER, APPROVED_HR, REJECTED, CANCELLED
    approved_by_user_id = Column(String(36), nullable=True)
    rejection_reason = Column(String(255), nullable=True)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")
