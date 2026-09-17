"""
Talent Management, 360 Performance Appraisals & Training Router for Cambodia Enterprise HRMS.
Manages evaluation cycles, self & manager ratings, strengths/development plans, and training enrollments.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_permission
from app.models.talent import PerformanceCycle, PerformanceReview, TrainingCourse, TrainingRecord
from app.models.employee import Employee
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


class CycleCreate(BaseModel):
    company_id: str
    title: str
    year: int
    start_date: date
    end_date: date
    rating_scale_max: int = 5


class ReviewCreate(BaseModel):
    cycle_id: str
    employee_id: str
    self_score: Optional[Decimal] = None
    self_comments: Optional[str] = None
    manager_score: Optional[Decimal] = None
    manager_comments: Optional[str] = None
    strengths: Optional[str] = None
    development_goals: Optional[str] = None


class CourseCreate(BaseModel):
    company_id: str
    title_en: str
    title_kh: str
    provider: Optional[str] = "Internal Academy"
    duration_hours: Decimal = Decimal("8.0")
    cost: Decimal = Decimal("0.00")
    currency: str = "USD"
    description: Optional[str] = None


class CourseEnroll(BaseModel):
    employee_id: str
    completion_date: date
    score: Optional[Decimal] = Decimal("90.0")
    certificate_url: Optional[str] = None


@router.get("/cycles", response_model=APIResponse[List[dict]])
def list_cycles(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:view")),
):
    query = db.query(PerformanceCycle)
    if company_id:
        query = query.filter(PerformanceCycle.company_id == company_id)
    cycles = query.order_by(PerformanceCycle.year.desc()).all()
    results = [
        {
            "id": c.id,
            "title": c.title,
            "year": c.year,
            "start_date": c.start_date.isoformat(),
            "end_date": c.end_date.isoformat(),
            "rating_scale_max": c.rating_scale_max,
            "status": c.status,
            "reviews_count": len(c.reviews),
        }
        for c in cycles
    ]
    return APIResponse(data=results, message="Performance cycles retrieved")


@router.post("/cycles", response_model=APIResponse[dict])
def create_cycle(
    data: CycleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:manage")),
):
    cycle = PerformanceCycle(**data.model_dump())
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return APIResponse(data={"id": cycle.id, "title": cycle.title}, message="Performance review cycle created")


@router.get("/reviews", response_model=APIResponse[List[dict]])
def list_reviews(
    cycle_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:view")),
):
    query = db.query(PerformanceReview, Employee).join(Employee, Employee.id == PerformanceReview.employee_id)
    if cycle_id:
        query = query.filter(PerformanceReview.cycle_id == cycle_id)
    if employee_id:
        query = query.filter(PerformanceReview.employee_id == employee_id)

    reviews = query.order_by(PerformanceReview.created_at.desc()).all()
    results = []
    for r, emp in reviews:
        results.append({
            "id": r.id,
            "cycle_id": r.cycle_id,
            "employee_id": r.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "department": emp.department.name_en if emp.department else "",
            "position": emp.position.title_en if emp.position else "",
            "self_score": float(r.self_score) if r.self_score is not None else None,
            "self_comments": r.self_comments,
            "manager_score": float(r.manager_score) if r.manager_score is not None else None,
            "manager_comments": r.manager_comments,
            "final_score": float(r.final_score) if r.final_score is not None else None,
            "strengths": r.strengths,
            "development_goals": r.development_goals,
            "status": r.status,
        })
    return APIResponse(data=results, message="Performance reviews retrieved")


@router.post("/reviews", response_model=APIResponse[dict])
def submit_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:manage")),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Compute final score
    final = None
    if data.manager_score is not None and data.self_score is not None:
        final = round((data.self_score * Decimal("0.4")) + (data.manager_score * Decimal("0.6")), 2)
    elif data.manager_score is not None:
        final = data.manager_score
    elif data.self_score is not None:
        final = data.self_score

    review = PerformanceReview(
        cycle_id=data.cycle_id,
        employee_id=data.employee_id,
        reviewer_user_id=current_user.id,
        self_score=data.self_score,
        self_comments=data.self_comments,
        manager_score=data.manager_score,
        manager_comments=data.manager_comments,
        final_score=final,
        strengths=data.strengths,
        development_goals=data.development_goals,
        status="COMPLETED" if data.manager_score is not None else "IN_REVIEW",
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    AuditService.log_event(
        db=db,
        action="SUBMIT_PERFORMANCE_REVIEW",
        module="talent",
        entity_type="PerformanceReview",
        entity_id=review.id,
        user_id=current_user.id,
        new_values={"employee_code": emp.employee_code, "final_score": float(final) if final else None},
    )

    return APIResponse(
        data={"id": review.id, "final_score": float(final) if final else None, "status": review.status},
        message="Performance evaluation submitted successfully."
    )


@router.get("/courses", response_model=APIResponse[List[dict]])
def list_courses(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:view")),
):
    courses = db.query(TrainingCourse).filter(TrainingCourse.is_active == True).all()
    results = [
        {
            "id": c.id,
            "title_en": c.title_en,
            "title_kh": c.title_kh,
            "provider": c.provider,
            "duration_hours": float(c.duration_hours),
            "cost": float(c.cost),
            "currency": c.currency,
            "description": c.description,
        }
        for c in courses
    ]
    return APIResponse(data=results, message="Training courses retrieved")


@router.post("/courses", response_model=APIResponse[dict])
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:manage")),
):
    course = TrainingCourse(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return APIResponse(data={"id": course.id, "title_en": course.title_en}, message="Course added to training catalog")


@router.post("/courses/{course_id}/enroll", response_model=APIResponse[dict])
def enroll_employee_course(
    course_id: str,
    data: CourseEnroll,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:manage")),
):
    course = db.query(TrainingCourse).filter(TrainingCourse.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    rec = TrainingRecord(
        course_id=course_id,
        employee_id=data.employee_id,
        completion_date=data.completion_date,
        score=data.score,
        certificate_url=data.certificate_url or "https://certs.camtech.com.kh/verify/cert-auto",
        status="COMPLETED",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return APIResponse(data={"id": rec.id, "course": course.title_en}, message="Employee training record certified and saved")
