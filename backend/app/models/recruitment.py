from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class JobRequisition(BaseModel):
    __tablename__ = "job_requisitions"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False, index=True)
    position_id = Column(String(36), ForeignKey("positions.id"), nullable=True)
    
    title_kh = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    employment_type = Column(String(30), default="PERMANENT_UDC", nullable=False)
    openings_count = Column(Integer, default=1, nullable=False)
    min_salary = Column(Numeric(16, 2), nullable=True)
    max_salary = Column(Numeric(16, 2), nullable=True)
    currency = Column(String(3), default="USD", nullable=False)
    
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    status = Column(String(30), default="OPEN", nullable=False, index=True)  # "DRAFT", "OPEN", "PAUSED", "CLOSED"

    department = relationship("Department")
    candidates = relationship("Candidate", back_populates="job_requisition")


class Candidate(BaseModel):
    __tablename__ = "candidates"

    job_requisition_id = Column(String(36), ForeignKey("job_requisitions.id"), nullable=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    source = Column(String(50), default="DIRECT_APPLY", nullable=False)  # "LINKEDIN", "REFERRAL", "JOB_FAIR", "AGENCY"
    cv_file_url = Column(String(500), nullable=True)
    
    current_stage = Column(String(30), default="APPLIED", nullable=False, index=True)
    # Stages: APPLIED, SCREENING, INTERVIEW, FINAL_INTERVIEW, OFFER, HIRED, REJECTED
    notes = Column(Text, nullable=True)

    job_requisition = relationship("JobRequisition", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")


class Interview(BaseModel):
    __tablename__ = "interviews"

    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False, index=True)
    interviewer_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    round_number = Column(Integer, default=1, nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    score = Column(Numeric(3, 1), nullable=True)  # e.g., 4.5 out of 5.0
    scorecard_feedback = Column(JSON, nullable=True)
    overall_recommendation = Column(String(50), nullable=True)  # "STRONG_HIRE", "HIRE", "NO_HIRE"
    status = Column(String(30), default="SCHEDULED", nullable=False)  # "SCHEDULED", "COMPLETED", "CANCELLED"

    candidate = relationship("Candidate", back_populates="interviews")
