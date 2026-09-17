from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_permission
from app.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.models.employee import Employee
from app.schemas.leave import LeaveRequestCreate, LeaveRequestOut, LeaveBalanceOut
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("/public-holidays", response_model=APIResponse[List[dict]])
def get_cambodia_public_holidays(
    year: int = Query(2026),
    current_user=Depends(get_current_user),
):
    """Returns official statutory paid public holidays in Cambodia under Prakas 443."""
    holidays = [
        {"date": f"{year}-01-01", "name_kh": "ទិវាចូលឆ្នាំសកល", "name_en": "International New Year's Day", "days": 1},
        {"date": f"{year}-01-07", "name_kh": "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", "name_en": "Victory Over Genocide Day", "days": 1},
        {"date": f"{year}-03-08", "name_kh": "ទិវានារីអន្តរជាតិ", "name_en": "International Women's Day", "days": 1},
        {"date": f"{year}-04-14", "name_kh": "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ (ថ្ងៃទី១)", "name_en": "Khmer New Year (Day 1)", "days": 1},
        {"date": f"{year}-04-15", "name_kh": "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ (ថ្ងៃទី២)", "name_en": "Khmer New Year (Day 2)", "days": 1},
        {"date": f"{year}-04-16", "name_kh": "ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ (ថ្ងៃទី៣)", "name_en": "Khmer New Year (Day 3)", "days": 1},
        {"date": f"{year}-05-01", "name_kh": "ទិវាពលកម្មអន្តរជាតិ", "name_en": "International Labor Day", "days": 1},
        {"date": f"{year}-05-14", "name_kh": "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះមហាក្សត្រ", "name_en": "King Norodom Sihamoni's Birthday", "days": 1},
        {"date": f"{year}-05-20", "name_kh": "ទិវាជាតិនៃការចងចាំ", "name_en": "National Day of Remembrance", "days": 1},
        {"date": f"{year}-06-18", "name_kh": "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី ព្រះវររាជមាតាជាតិខ្មែរ", "name_en": "Queen Mother's Birthday", "days": 1},
        {"date": f"{year}-09-24", "name_kh": "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", "name_en": "Constitutional Day", "days": 1},
        {"date": f"{year}-10-10", "name_kh": "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី១)", "name_en": "Pchum Ben Festival (Day 1)", "days": 1},
        {"date": f"{year}-10-11", "name_kh": "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី២)", "name_en": "Pchum Ben Festival (Day 2)", "days": 1},
        {"date": f"{year}-10-12", "name_kh": "ពិធីបុណ្យភ្ជុំបិណ្ឌ (ថ្ងៃទី៣)", "name_en": "Pchum Ben Festival (Day 3)", "days": 1},
        {"date": f"{year}-10-15", "name_kh": "ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះបរមរតនកោដ្ឋ", "name_en": "Commemoration Day of King Father", "days": 1},
        {"date": f"{year}-10-29", "name_kh": "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ ព្រះមហាក្សត្រ", "name_en": "Coronation Day of King Sihamoni", "days": 1},
        {"date": f"{year}-11-09", "name_kh": "ពិធីបុណ្យឯករាជ្យជាតិ", "name_en": "National Independence Day", "days": 1},
        {"date": f"{year}-11-23", "name_kh": "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប (ថ្ងៃទី១)", "name_en": "Water Festival (Day 1)", "days": 1},
        {"date": f"{year}-11-24", "name_kh": "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប (ថ្ងៃទី២)", "name_en": "Water Festival (Day 2)", "days": 1},
        {"date": f"{year}-11-25", "name_kh": "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប (ថ្ងៃទី៣)", "name_en": "Water Festival (Day 3)", "days": 1},
    ]
    return APIResponse(data=holidays, message=f"Cambodia {year} public holidays retrieved")


@router.get("/seniority-calculation/{employee_id}", response_model=APIResponse[dict])
def calculate_seniority_leave(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Computes Article 166 Seniority Annual Leave Entitlement:
    Base: 18 working days/year (1.5 days/month).
    Seniority: +1 additional working day for every 3 years of continuous service.
    """
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    today = date.today()
    join = emp.join_date
    years_of_service = today.year - join.year - ((today.month, today.day) < (join.month, join.day))
    years_of_service = max(0, years_of_service)

    base_annual_leave = 18.0
    seniority_bonus_days = float(years_of_service // 3)
    total_entitlement = base_annual_leave + seniority_bonus_days

    data = {
        "employee_id": emp.id,
        "employee_code": emp.employee_code,
        "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
        "join_date": emp.join_date.isoformat(),
        "years_of_service": years_of_service,
        "base_annual_leave_days": base_annual_leave,
        "seniority_bonus_days": seniority_bonus_days,
        "total_annual_entitlement": total_entitlement,
        "legal_reference": "Cambodia Labor Law Article 166 (Seniority Leave Accrual)",
    }
    return APIResponse(data=data, message="Seniority leave calculation complete")


@router.get("/encashment-preview/{employee_id}", response_model=APIResponse[dict])
def preview_leave_encashment(
    employee_id: str,
    exchange_rate: Decimal = Query(Decimal("4100")),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("leave:read")),
):
    """
    Computes monetary encashment value for unused annual leave days per Cambodia Labor Law Article 167:
    Daily Wage = Base Salary / 26 working days
    Encashment Amount = Daily Wage * Remaining Days
    """
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Find remaining leave balance for current year
    balance = (
        db.query(LeaveBalance)
        .filter(LeaveBalance.employee_id == emp.id)
        .order_by(LeaveBalance.year.desc())
        .first()
    )
    remaining_days = float(balance.remaining_days) if balance else 10.0

    # Base salary conversion
    base_salary = Decimal(str(emp.base_salary))
    if emp.salary_currency.upper() == "USD":
        base_salary_khr = (base_salary * exchange_rate).quantize(Decimal("1"))
    else:
        base_salary_khr = base_salary.quantize(Decimal("1"))

    daily_wage_khr = (base_salary_khr / Decimal("26")).quantize(Decimal("1"))
    total_encashment_khr = (daily_wage_khr * Decimal(str(remaining_days))).quantize(Decimal("1"))
    total_encashment_usd = (total_encashment_khr / exchange_rate).quantize(Decimal("0.01"))

    data = {
        "employee_id": emp.id,
        "employee_code": emp.employee_code,
        "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
        "remaining_leave_days": remaining_days,
        "salary_currency": emp.salary_currency,
        "base_salary_contract": float(base_salary),
        "daily_wage_khr": float(daily_wage_khr),
        "encashment_amount_khr": float(total_encashment_khr),
        "encashment_amount_usd": float(total_encashment_usd),
        "exchange_rate": float(exchange_rate),
        "legal_reference": "Cambodia Labor Law Article 167 (Annual Leave Indemnity / Encashment)",
    }
    return APIResponse(data=data, message="Leave encashment preview calculated")


@router.get("/requests", response_model=APIResponse[List[dict]])
def list_leave_requests(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lists leave requests with employee and leave type details."""
    query = (
        db.query(LeaveRequest, Employee, LeaveType)
        .join(Employee, LeaveRequest.employee_id == Employee.id)
        .join(LeaveType, LeaveRequest.leave_type_id == LeaveType.id)
    )
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    if status:
        query = query.filter(LeaveRequest.status == status)

    records = query.order_by(LeaveRequest.start_date.desc()).all()
    results = []
    for req, emp, lt in records:
        results.append({
            "id": req.id,
            "employee_id": req.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "leave_type_name_en": lt.name_en,
            "leave_type_name_kh": lt.name_kh,
            "leave_type_code": lt.code,
            "start_date": req.start_date.isoformat(),
            "end_date": req.end_date.isoformat(),
            "total_days": float(req.total_days),
            "reason": req.reason,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
        })
    return APIResponse(data=results, message=f"Retrieved {len(results)} leave requests")


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
