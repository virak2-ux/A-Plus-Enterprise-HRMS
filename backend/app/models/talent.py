from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, Text, DateTime
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PerformanceCycle(BaseModel):
    __tablename__ = "performance_cycles"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)  # e.g., "2026 Annual Performance Review"
    year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rating_scale_max = Column(Integer, default=5, nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False)  # "DRAFT", "ACTIVE", "CLOSED"

    reviews = relationship("PerformanceReview", back_populates="cycle", cascade="all, delete-orphan")


class PerformanceReview(BaseModel):
    __tablename__ = "performance_reviews"

    cycle_id = Column(String(36), ForeignKey("performance_cycles.id"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    reviewer_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    self_score = Column(Numeric(3, 1), nullable=True)
    self_comments = Column(Text, nullable=True)
    manager_score = Column(Numeric(3, 1), nullable=True)
    manager_comments = Column(Text, nullable=True)
    final_score = Column(Numeric(3, 1), nullable=True)
    strengths = Column(Text, nullable=True)
    development_goals = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING_SELF", nullable=False)  # "PENDING_SELF", "PENDING_MANAGER", "COMPLETED"

    cycle = relationship("PerformanceCycle", back_populates="reviews")
    employee = relationship("Employee")


class TrainingCourse(BaseModel):
    __tablename__ = "training_courses"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    title_kh = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    provider = Column(String(150), nullable=True)
    duration_hours = Column(Numeric(5, 1), default=0.0, nullable=False)
    cost = Column(Numeric(16, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class TrainingRecord(BaseModel):
    __tablename__ = "training_records"

    course_id = Column(String(36), ForeignKey("training_courses.id"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    completion_date = Column(Date, nullable=False)
    score = Column(Numeric(5, 2), nullable=True)
    certificate_url = Column(String(500), nullable=True)
    status = Column(String(30), default="COMPLETED", nullable=False)

    course = relationship("TrainingCourse")
    employee = relationship("Employee")


class DisciplinaryRecord(BaseModel):
    __tablename__ = "disciplinary_records"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    incident_date = Column(Date, nullable=False)
    category = Column(String(50), nullable=False)  # "LATENESS", "INSUBORDINATION", "POLICY_BREACH", "MISCONDUCT"
    description = Column(Text, nullable=False)
    action_taken = Column(String(50), nullable=False)  # "VERBAL_WARNING", "FIRST_WRITTEN_WARNING", "FINAL_WARNING", "SUSPENSION"
    warning_letter_number = Column(String(50), nullable=True, index=True)
    suspension_days = Column(Integer, default=0, nullable=False)  # Max 7 days per Cambodia Labor Law Art. 27
    improvement_plan = Column(Text, nullable=True)
    acknowledged_by_employee = Column(Boolean, default=False, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    employee_comments = Column(Text, nullable=True)
    evidence_url = Column(String(500), nullable=True)
    is_confidential = Column(Boolean, default=True, nullable=False)
    recorded_by_user_id = Column(String(36), nullable=False)

    employee = relationship("Employee")
