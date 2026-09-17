from sqlalchemy import Column, String, ForeignKey, Numeric, Boolean, Date, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class OvertimeRule(BaseModel):
    __tablename__ = "overtime_rules"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    day_type = Column(String(50), nullable=False)  # "NORMAL_DAY", "NIGHT_SHIFT", "WEEKLY_REST_DAY", "PUBLIC_HOLIDAY"
    multiplier_rate = Column(Numeric(5, 2), nullable=False)  # e.g., 1.50, 2.00
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class OvertimeRequest(BaseModel):
    __tablename__ = "overtime_requests"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_hours = Column(Numeric(5, 2), nullable=False)
    day_type = Column(String(50), default="NORMAL_DAY", nullable=False)
    multiplier_rate = Column(Numeric(5, 2), default=1.50, nullable=False)
    reason = Column(Text, nullable=False)
    
    status = Column(String(30), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED
    payroll_status = Column(String(30), default="UNPROCESSED", nullable=False)  # UNPROCESSED, PROCESSED
    approved_by_user_id = Column(String(36), nullable=True)

    employee = relationship("Employee")
