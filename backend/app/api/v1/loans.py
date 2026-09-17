"""
Loans & Salary Advances Router for Cambodia Enterprise HRMS.
Manages employee emergency loans, salary advances, amortization schedules, and repayment tracking.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_permission
from app.models.payroll import Loan
from app.models.employee import Employee
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


class LoanCreate(BaseModel):
    employee_id: str
    loan_type: str = "SALARY_ADVANCE"  # "SALARY_ADVANCE", "COMPANY_LOAN"
    principal_amount: Decimal
    currency: str = "USD"
    tenure_months: int = 5
    monthly_deduction_amount: Optional[Decimal] = None
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None


class LoanRepayment(BaseModel):
    amount: Decimal
    notes: Optional[str] = None


@router.get("", response_model=APIResponse[List[dict]])
def list_loans(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lists all employee loans and salary advances."""
    query = db.query(Loan, Employee).join(Employee, Employee.id == Loan.employee_id)
    if employee_id:
        query = query.filter(Loan.employee_id == employee_id)
    if status:
        query = query.filter(Loan.status == status)

    loans = query.order_by(Loan.created_at.desc()).all()
    results = []
    for loan, emp in loans:
        results.append({
            "id": loan.id,
            "employee_id": loan.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "department": emp.department.name_en if emp.department else "",
            "loan_type": loan.loan_type,
            "principal_amount": float(loan.principal_amount),
            "currency": loan.currency,
            "interest_rate": float(loan.interest_rate),
            "monthly_deduction_amount": float(loan.monthly_deduction_amount),
            "remaining_balance": float(loan.remaining_balance),
            "start_date": loan.start_date.isoformat(),
            "end_date": loan.end_date.isoformat(),
            "status": loan.status,
            "notes": loan.notes,
        })

    return APIResponse(data=results, message="Loans retrieved successfully")


@router.post("", response_model=APIResponse[dict])
def create_loan(
    data: LoanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:manage")),
):
    """Creates and authorizes a new salary advance or company loan."""
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    monthly_deduction = data.monthly_deduction_amount
    if not monthly_deduction:
        tenure = max(1, data.tenure_months)
        monthly_deduction = round(data.principal_amount / Decimal(str(tenure)), 2)

    end_date = data.end_date
    if not end_date:
        # Approximate end date
        end_year = data.start_date.year + (data.start_date.month + data.tenure_months - 1) // 12
        end_month = (data.start_date.month + data.tenure_months - 1) % 12 + 1
        end_date = date(end_year, end_month, min(data.start_date.day, 28))

    loan = Loan(
        employee_id=data.employee_id,
        loan_type=data.loan_type,
        principal_amount=data.principal_amount,
        currency=data.currency,
        interest_rate=Decimal("0.00"),
        monthly_deduction_amount=monthly_deduction,
        remaining_balance=data.principal_amount,
        start_date=data.start_date,
        end_date=end_date,
        status="ACTIVE",
        notes=data.notes,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    AuditService.log_event(
        db=db,
        action="CREATE_LOAN",
        module="payroll",
        entity_type="Loan",
        entity_id=loan.id,
        user_id=current_user.id,
        new_values={
            "employee_code": emp.employee_code,
            "principal": float(data.principal_amount),
            "monthly_deduction": float(monthly_deduction),
        },
    )

    return APIResponse(
        data={"id": loan.id, "remaining_balance": float(loan.remaining_balance)},
        message="Loan approved and scheduled for automated payroll deduction."
    )


@router.post("/{loan_id}/repay", response_model=APIResponse[dict])
def record_repayment(
    loan_id: str,
    data: LoanRepayment,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:manage")),
):
    """Records an ad-hoc manual repayment towards an active loan."""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    new_balance = max(Decimal("0.00"), loan.remaining_balance - data.amount)
    loan.remaining_balance = new_balance
    if new_balance == Decimal("0.00"):
        loan.status = "PAID_OFF"

    db.commit()

    AuditService.log_event(
        db=db,
        action="LOAN_REPAYMENT",
        module="payroll",
        entity_type="Loan",
        entity_id=loan.id,
        user_id=current_user.id,
        new_values={"payment_amount": float(data.amount), "new_balance": float(new_balance)},
    )

    return APIResponse(
        data={"id": loan.id, "remaining_balance": float(new_balance), "status": loan.status},
        message=f"Payment of {data.amount} recorded. Remaining: {new_balance}"
    )


class EmployeeLoanRequest(BaseModel):
    employee_id: str
    loan_type: str = "SALARY_ADVANCE"  # "SALARY_ADVANCE", "COMPANY_LOAN"
    principal_amount: Decimal
    currency: str = "USD"
    tenure_months: int = 3
    notes: Optional[str] = None


class LoanApprovalInput(BaseModel):
    status: str  # "ACTIVE", "REJECTED", "CANCELLED"
    notes: Optional[str] = None


@router.post("/request", response_model=APIResponse[dict])
def request_employee_loan(
    data: EmployeeLoanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Employee Self-Service (ESS) application for salary advance or company loan.
    Enters the queue with status 'PENDING' for manager / HR review.
    """
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    tenure = max(1, data.tenure_months)
    monthly_deduction = round(data.principal_amount / Decimal(str(tenure)), 2)
    today = date.today()
    end_year = today.year + (today.month + tenure - 1) // 12
    end_month = (today.month + tenure - 1) % 12 + 1
    end_date = date(end_year, end_month, min(today.day, 28))

    loan = Loan(
        employee_id=data.employee_id,
        loan_type=data.loan_type,
        principal_amount=data.principal_amount,
        currency=data.currency,
        interest_rate=Decimal("0.00"),
        monthly_deduction_amount=monthly_deduction,
        remaining_balance=data.principal_amount,
        start_date=today,
        end_date=end_date,
        status="PENDING",
        notes=data.notes,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)

    AuditService.log_event(
        db=db,
        action="REQUEST_LOAN",
        module="payroll",
        entity_type="Loan",
        entity_id=loan.id,
        user_id=current_user.id,
        new_values={
            "employee_id": emp.id,
            "principal": float(data.principal_amount),
            "status": "PENDING",
        }
    )

    return APIResponse(
        data={"id": loan.id, "status": loan.status, "monthly_deduction": float(monthly_deduction)},
        message="Loan / salary advance request submitted successfully."
    )


@router.put("/{loan_id}/status", response_model=APIResponse[dict])
def update_loan_status(
    loan_id: str,
    data: LoanApprovalInput,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:manage")),
):
    """
    Manager / HR approval or rejection of pending loan / salary advance applications.
    """
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    old_status = loan.status
    loan.status = data.status.upper()
    if data.notes:
        loan.notes = f"{loan.notes or ''} | Note: {data.notes}".strip(" | ")

    db.commit()
    db.refresh(loan)

    AuditService.log_event(
        db=db,
        action="UPDATE_LOAN_STATUS",
        module="payroll",
        entity_type="Loan",
        entity_id=loan.id,
        user_id=current_user.id,
        old_values={"status": old_status},
        new_values={"status": loan.status, "notes": data.notes},
    )

    return APIResponse(
        data={"id": loan.id, "status": loan.status},
        message=f"Loan status successfully updated to {loan.status}"
    )

