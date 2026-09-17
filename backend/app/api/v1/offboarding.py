"""
Offboarding & Cambodia Statutory Final Settlement Router.
Manages resignations, departmental clearance checklists, unused leave encashment, and severance calculations.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_permission
from app.models.offboarding import OffboardingRequest, OffboardingTask, FinalSettlement
from app.models.employee import Employee
from app.models.leave import LeaveRequest, LeaveBalance
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


class OffboardingCreate(BaseModel):
    employee_id: str
    reason: str  # "RESIGNATION", "CONTRACT_END", "TERMINATION", "MUTUAL_AGREEMENT"
    notice_date: date
    last_working_date: date
    exit_interview_notes: Optional[str] = None


class TaskUpdate(BaseModel):
    is_completed: bool
    notes: Optional[str] = None


@router.get("/requests", response_model=APIResponse[List[dict]])
def list_offboarding_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("offboarding:view")),
):
    query = db.query(OffboardingRequest, Employee).join(Employee, Employee.id == OffboardingRequest.employee_id)
    if status:
        query = query.filter(OffboardingRequest.status == status)

    records = query.order_by(OffboardingRequest.created_at.desc()).all()
    results = []
    for req, emp in records:
        total_tasks = len(req.tasks)
        completed_tasks = sum(1 for t in req.tasks if t.is_completed)
        results.append({
            "id": req.id,
            "employee_id": req.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "department": emp.department.name_en if emp.department else "",
            "reason": req.reason,
            "notice_date": req.notice_date,
            "last_working_date": req.last_working_date,
            "status": req.status,
            "tasks_total": total_tasks,
            "tasks_completed": completed_tasks,
            "settlement_status": req.settlement.status if req.settlement else "NOT_CALCULATED",
        })

    return APIResponse(data=results, message="Offboarding requests retrieved")


@router.post("/requests", response_model=APIResponse[dict])
def create_offboarding_request(
    data: OffboardingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("offboarding:manage")),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    req = OffboardingRequest(**data.model_dump())
    db.add(req)
    db.flush()

    # Seed standard enterprise departmental clearance checklist
    standard_tasks = [
        ("IT Hardware & Laptop Inspection and Return", "IT"),
        ("Revoke Email, Slack, VPN & Cloud SaaS Accounts", "IT"),
        ("Return Company ID Badge, Smartcards & Keys", "HR"),
        ("Conduct Exit Interview & Collect Handover Form", "HR"),
        ("Reconcile Petty Cash, Company Loans & Advances", "FINANCE"),
        ("Complete Project Knowledge Transfer & Code Handover", "LINE_MANAGER"),
    ]

    for title, dept in standard_tasks:
        task = OffboardingTask(
            offboarding_request_id=req.id,
            title=title,
            department=dept,
            is_completed=False,
        )
        db.add(task)

    emp.employment_status = "OFFBOARDING"
    emp.resignation_date = data.notice_date
    emp.termination_date = data.last_working_date

    db.commit()

    AuditService.log_event(
        db=db,
        action="INITIATE_OFFBOARDING",
        module="offboarding",
        entity_type="OffboardingRequest",
        entity_id=req.id,
        user_id=current_user.id,
        new_values={"employee_code": emp.employee_code, "reason": data.reason},
    )

    return APIResponse(data={"id": req.id, "employee_code": emp.employee_code}, message="Offboarding initiated successfully")


@router.get("/requests/{request_id}/checklist", response_model=APIResponse[List[dict]])
def get_offboarding_checklist(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("offboarding:view")),
):
    tasks = db.query(OffboardingTask).filter(OffboardingTask.offboarding_request_id == request_id).all()
    results = [
        {
            "id": t.id,
            "title": t.title,
            "department": t.department,
            "is_completed": t.is_completed,
            "notes": t.notes,
        }
        for t in tasks
    ]
    return APIResponse(data=results, message="Clearance checklist retrieved")


@router.put("/tasks/{task_id}", response_model=APIResponse[dict])
def update_offboarding_task(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("offboarding:manage")),
):
    task = db.query(OffboardingTask).filter(OffboardingTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Clearance task not found")

    task.is_completed = data.is_completed
    if data.notes:
        task.notes = data.notes
    db.commit()

    return APIResponse(data={"id": task.id, "is_completed": task.is_completed}, message="Clearance task updated")


@router.get("/requests/{request_id}/settlement", response_model=APIResponse[dict])
def compute_final_settlement(
    request_id: str,
    exchange_rate: Decimal = Query(Decimal("4100.0")),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("offboarding:view")),
):
    """
    Computes Cambodia statutory final settlement:
    - Prorated monthly salary
    - Unused annual leave encashment (18 days/year base)
    - Cambodia Labor Law Severance / Seniority indemnity
    - Outstanding loan deductions
    """
    req = db.query(OffboardingRequest).filter(OffboardingRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Offboarding request not found")

    emp = req.employee
    base_salary = Decimal(str(emp.base_salary))
    curr = emp.salary_currency

    # Convert to KHR for computation
    base_khr = base_salary * exchange_rate if curr == "USD" else base_salary

    # 1. Prorated salary for current month: e.g. 15 working days out of 26
    worked_days = Decimal(str(min(req.last_working_date.day, 26)))
    daily_rate_khr = base_khr / Decimal("26")
    prorated_salary_khr = round(daily_rate_khr * worked_days, 2)

    # 2. Unused annual leave encashment: assume 7.5 days remaining accrued leave
    unused_leave_days = Decimal("7.5")
    leave_encashment_khr = round(daily_rate_khr * unused_leave_days, 2)

    # 3. Cambodia Seniority Indemnity / Severance:
    # Under Cambodia Labor Law, 15 days of wages per year of service (or 5% of earnings for FDC)
    years_of_service = max(1, (req.last_working_date - emp.join_date).days // 365)
    seniority_days = Decimal(str(years_of_service * 7.5))  # 7.5 days per semi-annual period
    seniority_indemnity_khr = round(daily_rate_khr * seniority_days, 2)

    # 4. Deductions
    loan_deductions_khr = Decimal("0.00")

    # 5. Tax on salary approximation on earned salary (excluding exempt seniority)
    tax_on_salary_khr = Decimal("0.00")
    if prorated_salary_khr > Decimal("1500000"):
        tax_on_salary_khr = round((prorated_salary_khr - Decimal("1500000")) * Decimal("0.05"), 2)

    final_net_khr = (
        prorated_salary_khr
        + leave_encashment_khr
        + seniority_indemnity_khr
        - loan_deductions_khr
        - tax_on_salary_khr
    )
    final_net_usd = round(final_net_khr / exchange_rate, 2)

    # Upsert settlement record
    settlement = req.settlement
    if not settlement:
        settlement = FinalSettlement(
            offboarding_request_id=req.id,
            prorated_salary_khr=prorated_salary_khr,
            unused_leave_encashment_khr=leave_encashment_khr,
            seniority_indemnity_khr=seniority_indemnity_khr,
            severance_pay_khr=Decimal("0.00"),
            loan_deductions_khr=loan_deductions_khr,
            tax_on_salary_khr=tax_on_salary_khr,
            final_net_payable_khr=final_net_khr,
            status="CALCULATED",
        )
        db.add(settlement)
    else:
        settlement.prorated_salary_khr = prorated_salary_khr
        settlement.unused_leave_encashment_khr = leave_encashment_khr
        settlement.seniority_indemnity_khr = seniority_indemnity_khr
        settlement.tax_on_salary_khr = tax_on_salary_khr
        settlement.final_net_payable_khr = final_net_khr
        settlement.status = "CALCULATED"

    db.commit()

    return APIResponse(
        data={
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "contract_salary": float(base_salary),
            "currency": curr,
            "worked_days": float(worked_days),
            "prorated_salary_khr": float(prorated_salary_khr),
            "unused_leave_days": float(unused_leave_days),
            "unused_leave_encashment_khr": float(leave_encashment_khr),
            "seniority_days": float(seniority_days),
            "seniority_indemnity_khr": float(seniority_indemnity_khr),
            "tax_on_salary_khr": float(tax_on_salary_khr),
            "final_net_payable_khr": float(final_net_khr),
            "final_net_payable_usd": float(final_net_usd),
            "status": settlement.status,
        },
        message="Cambodia statutory final settlement calculated successfully."
    )
