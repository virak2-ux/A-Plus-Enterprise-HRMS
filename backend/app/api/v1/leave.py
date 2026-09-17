from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_permission
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.models.employee import Employee
from app.schemas.leave import LeaveRequestCreate, LeaveRequestOut, LeaveBalanceOut
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/balances", response_model=APIResponse[List[LeaveBalanceOut]])
def get_leave_balances(
    employee_id: str,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id)
    if year:
        query = query.filter(LeaveBalance.year == year)
    balances = query.all()
    return APIResponse(data=balances, message="Leave balances retrieved")


@router.post("/requests", response_model=APIResponse[LeaveRequestOut])
def submit_leave_request(
    data: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Compute total days
    days = (data.end_date - data.start_date).days + 1
    if days <= 0:
        raise HTTPException(status_code=400, detail="End date must be after or on start date.")

    req = LeaveRequest(
        employee_id=data.employee_id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        total_days=days,
        reason=data.reason,
        attachment_url=data.attachment_url,
        status="PENDING",
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    AuditService.log_event(
        db=db,
        action="SUBMIT_LEAVE",
        module="leave",
        entity_type="LeaveRequest",
        entity_id=req.id,
        user_id=current_user.id,
    )

    return APIResponse(data=req, message="Leave request submitted")


@router.put("/requests/{request_id}/approve", response_model=APIResponse[LeaveRequestOut])
def approve_leave_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("leave:approve")),
):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")

    req.status = "APPROVED_HR"
    req.approved_by_user_id = current_user.id
    db.commit()
    db.refresh(req)

    AuditService.log_event(
        db=db,
        action="APPROVE_LEAVE",
        module="leave",
        entity_type="LeaveRequest",
        entity_id=req.id,
        user_id=current_user.id,
    )

    return APIResponse(data=req, message="Leave request approved")
