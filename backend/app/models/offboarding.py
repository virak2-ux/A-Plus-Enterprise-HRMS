from sqlalchemy import Column, String, ForeignKey, Numeric, Boolean, Date, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class OffboardingRequest(BaseModel):
    __tablename__ = "offboarding_requests"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    reason = Column(String(50), nullable=False)  # "RESIGNATION", "CONTRACT_END", "TERMINATION", "MUTUAL_AGREEMENT"
    notice_date = Column(Date, nullable=False)
    last_working_date = Column(Date, nullable=False)
    status = Column(String(30), default="INITIATED", nullable=False)  # "INITIATED", "CLEARANCE_IN_PROGRESS", "SETTLED", "COMPLETED"
    exit_interview_notes = Column(Text, nullable=True)

    employee = relationship("Employee")
    tasks = relationship("OffboardingTask", back_populates="offboarding_request", cascade="all, delete-orphan")
    settlement = relationship("FinalSettlement", back_populates="offboarding_request", uselist=False, cascade="all, delete-orphan")


class OffboardingTask(BaseModel):
    __tablename__ = "offboarding_tasks"

    offboarding_request_id = Column(String(36), ForeignKey("offboarding_requests.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)  # e.g., "IT Laptop & Access Revocation", "HR ID Badge Return"
    department = Column(String(50), nullable=False)  # "IT", "HR", "FINANCE", "LINE_MANAGER"
    is_completed = Column(Boolean, default=False, nullable=False)
    notes = Column(String(255), nullable=True)

    offboarding_request = relationship("OffboardingRequest", back_populates="tasks")


class FinalSettlement(BaseModel):
    __tablename__ = "final_settlements"

    offboarding_request_id = Column(String(36), ForeignKey("offboarding_requests.id"), nullable=False, index=True)
    prorated_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    unused_leave_encashment_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    seniority_indemnity_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    severance_pay_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    loan_deductions_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    tax_on_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    final_net_payable_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    status = Column(String(30), default="DRAFT", nullable=False)  # "DRAFT", "APPROVED", "PAID"

    offboarding_request = relationship("OffboardingRequest", back_populates="settlement")
