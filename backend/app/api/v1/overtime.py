from typing import List, Optional
from datetime import date, datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.overtime import OvertimeRequest, OvertimeRule
from app.models.employee import Employee
from app.services.audit_service import AuditService
from app.schemas.common import APIResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OvertimeRequestCreate(BaseModel):
    employee_id: str
    date: date
    start_time: datetime
    end_time: datetime
    total_hours: Decimal = Field(..., gt=0)
    day_type: str = "NORMAL_DAY"  # NORMAL_DAY, NIGHT_SHIFT, WEEKLY_REST_DAY, PUBLIC_HOLIDAY
    reason: str


class OvertimeStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    rejection_reason: Optional[str] = None


class BatchApprovalRequest(BaseModel):
    request_ids: List[str]
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/rules", response_model=APIResponse[List[dict]])
def list_overtime_rules(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("attendance:read")),
):
    """Returns statutory Cambodia Labor Law Article 139 overtime rates."""
    rules = [
        {
            "day_type": "NORMAL_DAY",
            "name_en": "Normal Working Day Overtime",
            "name_kh": "ថែមម៉ោងថ្ងៃធ្វើការធម្មតា",
            "multiplier_rate": 1.50,
            "statutory_ref": "Cambodia Labor Law Art. 139 (Paragraph 1)",
            "description": "Overtime performed on normal working days (Monday - Saturday)",
        },
        {
            "day_type": "NIGHT_SHIFT",
            "name_en": "Night Shift Overtime (22:00 - 06:00)",
            "name_kh": "ថែមម៉ោងវេនយប់ (ម៉ោង ២២:០០ ដល់ ០៦:០០)",
            "multiplier_rate": 2.00,
            "statutory_ref": "Cambodia Labor Law Art. 139 (Paragraph 2)",
            "description": "Overtime hours performed during night hours",
        },
        {
            "day_type": "WEEKLY_REST_DAY",
            "name_en": "Weekly Rest Day (Sunday)",
            "name_kh": "ថែមម៉ោងថ្ងៃឈប់សម្រាកប្រចាំសប្តាហ៍ (ថ្ងៃអាទិត្យ)",
            "multiplier_rate": 2.00,
            "statutory_ref": "Cambodia Labor Law Art. 139 (Paragraph 3)",
            "description": "Work performed on the mandated weekly rest day",
        },
        {
            "day_type": "PUBLIC_HOLIDAY",
            "name_en": "Paid Public Holiday",
            "name_kh": "ថែមម៉ោងថ្ងៃបុណ្យជាតិដែលមានប្រាក់ឈ្នួល",
            "multiplier_rate": 2.00,
            "statutory_ref": "Cambodia Labor Law Art. 139 & Prakas 443",
            "description": "Work performed on officially declared paid public holidays",
        },
    ]
    return APIResponse(data=rules, message="Cambodia overtime rules retrieved")


@router.get("", response_model=APIResponse[List[dict]])
def list_overtime_requests(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    payroll_status: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("attendance:read")),
):
    """Lists overtime requests with employee detail and multiplier rates."""
    query = db.query(OvertimeRequest, Employee).join(Employee, OvertimeRequest.employee_id == Employee.id)

    if employee_id:
        query = query.filter(OvertimeRequest.employee_id == employee_id)
    if status:
        query = query.filter(OvertimeRequest.status == status)
    if payroll_status:
        query = query.filter(OvertimeRequest.payroll_status == payroll_status)
    if start_date:
        query = query.filter(OvertimeRequest.date >= start_date)
    if end_date:
        query = query.filter(OvertimeRequest.date <= end_date)

    records = query.order_by(OvertimeRequest.date.desc()).all()

    items = []
    for ot, emp in records:
        items.append({
            "id": ot.id,
            "employee_id": ot.employee_id,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_code": emp.employee_code,
            "date": ot.date.isoformat(),
            "start_time": ot.start_time.isoformat() if ot.start_time else None,
            "end_time": ot.end_time.isoformat() if ot.end_time else None,
            "total_hours": float(ot.total_hours),
            "day_type": ot.day_type,
            "multiplier_rate": float(ot.multiplier_rate),
            "payable_hours": float(Decimal(str(ot.total_hours)) * Decimal(str(ot.multiplier_rate))),
            "reason": ot.reason,
            "status": ot.status,
            "payroll_status": ot.payroll_status,
            "approved_by_user_id": ot.approved_by_user_id,
            "created_at": ot.created_at.isoformat() if ot.created_at else None,
        })

    return APIResponse(data=items, message=f"Retrieved {len(items)} overtime requests")


@router.post("", response_model=APIResponse[dict])
def submit_overtime_request(
    data: OvertimeRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("attendance:create")),
):
    """Submits a new overtime request with automated Cambodia Labor Law multiplier rate."""
    emp = db.query(Employee).filter(Employee.id == data.employee_id, Employee.is_deleted == False).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Statutory multiplier resolution
    if data.day_type in ["WEEKLY_REST_DAY", "PUBLIC_HOLIDAY", "NIGHT_SHIFT"]:
        multiplier = Decimal("2.00")
    else:
        multiplier = Decimal("1.50")

    ot = OvertimeRequest(
        employee_id=emp.id,
        date=data.date,
        start_time=data.start_time,
        end_time=data.end_time,
        total_hours=data.total_hours,
        day_type=data.day_type,
        multiplier_rate=multiplier,
        reason=data.reason,
        status="PENDING",
        payroll_status="UNPROCESSED",
    )
    db.add(ot)
    db.flush()

    AuditService.log_event(
        db=db,
        action="SUBMIT_OVERTIME",
        module="attendance",
        entity_type="OvertimeRequest",
        entity_id=ot.id,
        user_id=current_user.id,
        new_values={"employee_id": emp.id, "hours": float(data.total_hours), "multiplier": float(multiplier)},
    )
    db.commit()
    db.refresh(ot)

    return APIResponse(
        data={
            "id": ot.id,
            "employee_id": ot.employee_id,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "date": ot.date.isoformat(),
            "total_hours": float(ot.total_hours),
            "multiplier_rate": float(ot.multiplier_rate),
            "status": ot.status,
            "payroll_status": ot.payroll_status,
        },
        message="Overtime request submitted successfully",
    )


@router.put("/{ot_id}/status", response_model=APIResponse[dict])
def update_overtime_status(
    ot_id: str,
    data: OvertimeStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("attendance:approve")),
):
    """Approves or rejects an overtime request."""
    ot = db.query(OvertimeRequest).filter(OvertimeRequest.id == ot_id).first()
    if not ot:
        raise HTTPException(status_code=404, detail="Overtime request not found")

    if ot.payroll_status == "PROCESSED":
        raise HTTPException(status_code=400, detail="Cannot alter overtime that has already been processed in payroll")

    old_status = ot.status
    ot.status = data.status
    if data.status == "APPROVED":
        ot.approved_by_user_id = current_user.id

    AuditService.log_event(
        db=db,
        action=f"OVERTIME_{data.status}",
        module="attendance",
        entity_type="OvertimeRequest",
        entity_id=ot.id,
        user_id=current_user.id,
        old_values={"status": old_status},
        new_values={"status": data.status, "rejection_reason": data.rejection_reason},
    )
    db.commit()

    return APIResponse(
        data={"id": ot.id, "status": ot.status, "approved_by": ot.approved_by_user_id},
        message=f"Overtime request status updated to {data.status}",
    )


@router.post("/batch-approve", response_model=APIResponse[dict])
def batch_approve_overtime(
    data: BatchApprovalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("attendance:approve")),
):
    """Batch approves or rejects multiple overtime requests in a single transaction."""
    requests = (
        db.query(OvertimeRequest)
        .filter(
            OvertimeRequest.id.in_(data.request_ids),
            OvertimeRequest.payroll_status == "UNPROCESSED",
        )
        .all()
    )

    count = 0
    for req in requests:
        req.status = data.status
        if data.status == "APPROVED":
            req.approved_by_user_id = current_user.id
        count += 1

    AuditService.log_event(
        db=db,
        action=f"BATCH_OVERTIME_{data.status}",
        module="attendance",
        entity_type="OvertimeRequest",
        entity_id="batch",
        user_id=current_user.id,
        new_values={"count": count, "request_ids": data.request_ids},
    )
    db.commit()

    return APIResponse(
        data={"processed_count": count, "status": data.status},
        message=f"Successfully updated {count} overtime requests to {data.status}",
    )
