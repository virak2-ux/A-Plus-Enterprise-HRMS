"""
Recruitment & ATS Router for Cambodia Enterprise HRMS.
Manages job vacancies, candidate pipeline, interviews, and 1-click candidate-to-employee onboarding conversion.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_permission
from app.models.recruitment import JobRequisition, Candidate, Interview
from app.models.employee import Employee, SalaryHistory, Contract
from app.models.company import Department, Position
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


class JobRequisitionCreate(BaseModel):
    company_id: str
    department_id: str
    position_id: Optional[str] = None
    title_kh: str
    title_en: str
    employment_type: str = "PERMANENT_UDC"
    openings_count: int = 1
    min_salary: Optional[Decimal] = None
    max_salary: Optional[Decimal] = None
    currency: str = "USD"
    description: str
    requirements: Optional[str] = None


class CandidateCreate(BaseModel):
    job_requisition_id: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    phone: str
    source: str = "DIRECT_APPLY"
    cv_file_url: Optional[str] = None
    notes: Optional[str] = None


class CandidateStageUpdate(BaseModel):
    current_stage: str  # APPLIED, SCREENING, INTERVIEW, FINAL_INTERVIEW, OFFER, HIRED, REJECTED
    notes: Optional[str] = None


class ConvertCandidatePayload(BaseModel):
    company_id: str
    department_id: str
    position_id: str
    join_date: date
    base_salary: Decimal
    salary_currency: str = "USD"
    employment_type: str = "PERMANENT_UDC"
    employee_code: Optional[str] = None


@router.get("/jobs", response_model=APIResponse[List[dict]])
def list_job_requisitions(
    company_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("recruitment:view")),
):
    query = db.query(JobRequisition)
    if company_id:
        query = query.filter(JobRequisition.company_id == company_id)
    if status:
        query = query.filter(JobRequisition.status == status)
    
    jobs = query.order_by(JobRequisition.created_at.desc()).all()
    results = [
        {
            "id": j.id,
            "title_en": j.title_en,
            "title_kh": j.title_kh,
            "department": j.department.name_en if j.department else "",
            "openings_count": j.openings_count,
            "min_salary": float(j.min_salary) if j.min_salary else None,
            "max_salary": float(j.max_salary) if j.max_salary else None,
            "currency": j.currency,
            "status": j.status,
            "candidates_count": len(j.candidates),
            "created_at": j.created_at,
        }
        for j in jobs
    ]
    return APIResponse(data=results, message="Job requisitions retrieved")


@router.post("/jobs", response_model=APIResponse[dict])
def create_job_requisition(
    data: JobRequisitionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("recruitment:manage")),
):
    job = JobRequisition(**data.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)

    AuditService.log_event(
        db=db,
        action="CREATE_JOB_REQUISITION",
        module="recruitment",
        entity_type="JobRequisition",
        entity_id=job.id,
        user_id=current_user.id,
    )
    return APIResponse(data={"id": job.id, "title_en": job.title_en}, message="Job requisition created")


@router.get("/candidates", response_model=APIResponse[List[dict]])
def list_candidates(
    job_id: Optional[str] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("recruitment:view")),
):
    query = db.query(Candidate)
    if job_id:
        query = query.filter(Candidate.job_requisition_id == job_id)
    if stage:
        query = query.filter(Candidate.current_stage == stage)

    candidates = query.order_by(Candidate.created_at.desc()).all()
    results = [
        {
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "full_name": f"{c.first_name} {c.last_name}",
            "email": c.email,
            "phone": c.phone,
            "source": c.source,
            "current_stage": c.current_stage,
            "job_title": c.job_requisition.title_en if c.job_requisition else "General Pool",
            "notes": c.notes,
            "created_at": c.created_at,
        }
        for c in candidates
    ]
    return APIResponse(data=results, message="Candidates retrieved successfully")


@router.post("/candidates", response_model=APIResponse[dict])
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("recruitment:manage")),
):
    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    return APIResponse(data={"id": candidate.id, "name": f"{candidate.first_name} {candidate.last_name}"}, message="Candidate created")


@router.put("/candidates/{candidate_id}/stage", response_model=APIResponse[dict])
def update_candidate_stage(
    candidate_id: str,
    data: CandidateStageUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("recruitment:manage")),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    old_stage = candidate.current_stage
    candidate.current_stage = data.current_stage
    if data.notes:
        candidate.notes = f"{candidate.notes or ''}\n[{data.current_stage}]: {data.notes}".strip()
    db.commit()

    AuditService.log_event(
        db=db,
        action="UPDATE_CANDIDATE_STAGE",
        module="recruitment",
        entity_type="Candidate",
        entity_id=candidate.id,
        user_id=current_user.id,
        old_values={"stage": old_stage},
        new_values={"stage": data.current_stage},
    )

    return APIResponse(data={"id": candidate.id, "current_stage": candidate.current_stage}, message=f"Candidate advanced to {data.current_stage}")


@router.post("/candidates/{candidate_id}/convert-to-employee", response_model=APIResponse[dict])
def convert_candidate_to_employee(
    candidate_id: str,
    payload: ConvertCandidatePayload,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:create")),
):
    """
    Automates transition from ATS to core HRMS: Converts a hired candidate into an Employee master profile.
    """
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Generate next employee code if not provided
    emp_code = payload.employee_code
    if not emp_code:
        count = db.query(Employee).filter(Employee.company_id == payload.company_id).count()
        emp_code = f"EMP-{count + 1:03d}"

    # Create employee
    employee = Employee(
        company_id=payload.company_id,
        employee_code=emp_code,
        first_name_kh=cand.first_name,
        last_name_kh=cand.last_name,
        first_name_en=cand.first_name,
        last_name_en=cand.last_name,
        gender="MALE",
        date_of_birth=date(1995, 1, 1),
        phone_primary=cand.phone,
        email_work=cand.email,
        department_id=payload.department_id,
        position_id=payload.position_id,
        join_date=payload.join_date,
        base_salary=payload.base_salary,
        salary_currency=payload.salary_currency,
        employment_status="ONBOARDING",
        employment_type=payload.employment_type,
    )
    db.add(employee)
    db.flush()

    # Initial contract
    contract = Contract(
        employee_id=employee.id,
        contract_number=f"CTR-{employee.employee_code}-01",
        contract_type="UDC" if "UDC" in payload.employment_type else "FDC",
        start_date=payload.join_date,
        base_salary=payload.base_salary,
        currency=payload.salary_currency,
        status="ACTIVE",
    )
    db.add(contract)

    # Initial salary history
    sh = SalaryHistory(
        employee_id=employee.id,
        previous_salary=Decimal("0"),
        new_salary=payload.base_salary,
        currency=payload.salary_currency,
        effective_date=payload.join_date,
        change_reason="Offer Letter conversion from ATS",
        approved_by_user_id=current_user.id,
    )
    db.add(sh)

    # Update candidate stage to HIRED
    cand.current_stage = "HIRED"

    db.commit()

    AuditService.log_event(
        db=db,
        action="CONVERT_CANDIDATE_TO_EMPLOYEE",
        module="recruitment",
        entity_type="Employee",
        entity_id=employee.id,
        user_id=current_user.id,
        new_values={"candidate_id": cand.id, "employee_code": employee.employee_code},
    )

    return APIResponse(
        data={
            "employee_id": employee.id,
            "employee_code": employee.employee_code,
            "name": f"{employee.first_name_en} {employee.last_name_en}",
            "status": employee.employment_status,
        },
        message=f"Candidate {cand.first_name} {cand.last_name} successfully converted to employee {employee.employee_code}."
    )
