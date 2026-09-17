from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_permission
from app.models.payroll import (
    PayrollPeriod,
    PayrollRun,
    PayrollItem,
    PayrollItemDetail,
    TaxRule,
    ContributionRule,
)
from app.models.employee import Employee
from app.models.company import Company
from app.schemas.payroll import (
    PayrollPeriodCreate,
    PayrollPeriodOut,
    PayrollRunTrigger,
    PayrollRunOut,
    PayrollItemOut,
)
from app.schemas.common import APIResponse
from app.services.payroll_engine import CambodiaPayrollCalculator
from app.services.audit_service import AuditService
from app.services.payslip_generator import PayslipGenerator
from app.services.bank_export_service import BankExportService

router = APIRouter()


@router.get("/periods", response_model=APIResponse[List[PayrollPeriodOut]])
def list_payroll_periods(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    query = db.query(PayrollPeriod)
    if company_id:
        query = query.filter(PayrollPeriod.company_id == company_id)
    periods = query.order_by(PayrollPeriod.start_date.desc()).all()
    return APIResponse(data=periods, message="Payroll periods retrieved")


@router.post("/periods", response_model=APIResponse[PayrollPeriodOut])
def create_payroll_period(
    data: PayrollPeriodCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:manage")),
):
    period = PayrollPeriod(**data.model_dump())
    db.add(period)
    db.commit()
    db.refresh(period)

    AuditService.log_event(
        db=db,
        action="CREATE_PAYROLL_PERIOD",
        module="payroll",
        entity_type="PayrollPeriod",
        entity_id=period.id,
        user_id=current_user.id,
    )
    return APIResponse(data=period, message="Payroll period created successfully")


@router.post("/runs/calculate", response_model=APIResponse[PayrollRunOut])
def calculate_payroll_run(
    data: PayrollRunTrigger,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:calculate")),
):
    """Executes deterministic Cambodia payroll calculation for all active employees."""
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == data.payroll_period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="Payroll period not found")
    if period.status == "LOCKED":
        raise HTTPException(status_code=400, detail="Cannot recalculate a locked payroll period.")

    # Create new run
    run = PayrollRun(
        payroll_period_id=period.id,
        exchange_rate_usd_to_khr=Decimal(str(data.exchange_rate_usd_to_khr)),
        calculated_at=datetime.now(timezone.utc),
        calculated_by_user_id=current_user.id,
        status="CALCULATED",
    )
    db.add(run)
    db.flush()

    # Query active employees for this company
    employees = (
        db.query(Employee)
        .filter(
            Employee.company_id == period.company_id,
            Employee.employment_status.in_(["ACTIVE", "PROBATION", "CONFIRMED"]),
            Employee.is_deleted == False,
        )
        .all()
    )

    total_gross = Decimal("0")
    total_net = Decimal("0")
    total_tax = Decimal("0")
    total_nssf = Decimal("0")

    for emp in employees:
        result = CambodiaPayrollCalculator.compute_employee_payroll(
            base_salary_contract=Decimal(str(emp.base_salary)),
            currency_contract=emp.salary_currency,
            exchange_rate_usd_to_khr=Decimal(str(data.exchange_rate_usd_to_khr)),
            worked_days=Decimal("26"),
            spouse_dependent_count=emp.spouse_dependent_count,
            minor_children_count=emp.minor_children_count,
            is_resident=emp.is_resident_for_tax,
        )

        item = PayrollItem(
            payroll_run_id=run.id,
            employee_id=emp.id,
            base_salary_contract=Decimal(str(emp.base_salary)),
            currency_contract=emp.salary_currency,
            worked_days=Decimal("26"),
            unpaid_absence_days=Decimal("0"),
            overtime_hours=Decimal("0"),
            base_salary_earned_khr=result["base_salary_earned_khr"],
            total_allowances_khr=Decimal("0"),
            total_overtime_pay_khr=result["total_overtime_pay_khr"],
            total_bonuses_khr=Decimal("0"),
            seniority_indemnity_khr=Decimal("0"),
            gross_salary_khr=result["gross_salary_khr"],
            nssf_contributory_wage_khr=result["nssf_contributory_wage_khr"],
            nssf_pension_employee_khr=result["nssf_pension_employee_khr"],
            nssf_pension_employer_khr=result["nssf_pension_employer_khr"],
            nssf_health_employer_khr=result["nssf_health_employer_khr"],
            nssf_accident_employer_khr=result["nssf_accident_employer_khr"],
            taxable_salary_khr=result["taxable_salary_khr"],
            tax_relief_dependents_khr=result["tax_relief_dependents_khr"],
            tax_base_salary_khr=result["tax_base_salary_khr"],
            tax_on_salary_khr=result["tax_on_salary_khr"],
            loan_deduction_khr=Decimal("0"),
            other_deductions_khr=Decimal("0"),
            total_deductions_khr=result["total_deductions_khr"],
            net_salary_khr=result["net_salary_khr"],
            net_salary_usd=result["net_salary_usd"],
            calculation_snapshot=result["calculation_snapshot"],
        )
        db.add(item)

        total_gross += result["gross_salary_khr"]
        total_net += result["net_salary_khr"]
        total_tax += result["tax_on_salary_khr"]
        total_nssf += (
            result["nssf_pension_employer_khr"]
            + result["nssf_health_employer_khr"]
            + result["nssf_accident_employer_khr"]
        )

    run.total_gross_khr = total_gross
    run.total_net_khr = total_net
    run.total_tax_khr = total_tax
    run.total_nssf_khr = total_nssf
    period.status = "REVIEW"

    db.commit()
    db.refresh(run)

    AuditService.log_event(
        db=db,
        action="CALCULATE_PAYROLL",
        module="payroll",
        entity_type="PayrollRun",
        entity_id=run.id,
        user_id=current_user.id,
        new_values={"total_net_khr": str(total_net), "employees_count": len(employees)},
    )

    out = PayrollRunOut(
        id=run.id,
        payroll_period_id=run.payroll_period_id,
        run_number=run.run_number,
        exchange_rate_usd_to_khr=float(run.exchange_rate_usd_to_khr),
        total_gross_khr=float(run.total_gross_khr),
        total_net_khr=float(run.total_net_khr),
        total_tax_khr=float(run.total_tax_khr),
        total_nssf_khr=float(run.total_nssf_khr),
        status=run.status,
        calculated_at=run.calculated_at,
        items_count=len(employees),
    )
    return APIResponse(data=out, message="Payroll calculation finished successfully")


@router.get("/runs/{run_id}/items", response_model=APIResponse[List[PayrollItemOut]])
def get_payroll_run_items(
    run_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    items = (
        db.query(PayrollItem, Employee)
        .join(Employee, Employee.id == PayrollItem.employee_id)
        .filter(PayrollItem.payroll_run_id == run_id)
        .all()
    )

    result = []
    for item, emp in items:
        item_out = PayrollItemOut(
            id=item.id,
            payroll_run_id=item.payroll_run_id,
            employee_id=item.employee_id,
            employee_code=emp.employee_code,
            employee_name_kh=f"{emp.last_name_kh} {emp.first_name_kh}",
            employee_name_en=f"{emp.first_name_en} {emp.last_name_en}",
            base_salary_contract=float(item.base_salary_contract),
            currency_contract=item.currency_contract,
            worked_days=float(item.worked_days),
            unpaid_absence_days=float(item.unpaid_absence_days),
            overtime_hours=float(item.overtime_hours),
            gross_salary_khr=float(item.gross_salary_khr),
            nssf_pension_employee_khr=float(item.nssf_pension_employee_khr),
            nssf_pension_employer_khr=float(item.nssf_pension_employer_khr),
            nssf_health_employer_khr=float(item.nssf_health_employer_khr),
            nssf_accident_employer_khr=float(item.nssf_accident_employer_khr),
            taxable_salary_khr=float(item.taxable_salary_khr),
            tax_relief_dependents_khr=float(item.tax_relief_dependents_khr),
            tax_base_salary_khr=float(item.tax_base_salary_khr),
            tax_on_salary_khr=float(item.tax_on_salary_khr),
            total_deductions_khr=float(item.total_deductions_khr),
            net_salary_khr=float(item.net_salary_khr),
            net_salary_usd=float(item.net_salary_usd),
            calculation_snapshot=item.calculation_snapshot,
            details=[],
        )
        result.append(item_out)

    return APIResponse(data=result, message="Payroll items retrieved")


@router.put("/runs/{run_id}/approve", response_model=APIResponse[dict])
def approve_payroll_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:approve")),
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    run.status = "APPROVED"
    run.approved_at = datetime.now(timezone.utc)
    run.approved_by_user_id = current_user.id
    db.commit()

    AuditService.log_event(
        db=db,
        action="APPROVE_PAYROLL",
        module="payroll",
        entity_type="PayrollRun",
        entity_id=run.id,
        user_id=current_user.id,
    )
    return APIResponse(data={"status": "APPROVED"}, message="Payroll run approved")


@router.put("/runs/{run_id}/lock", response_model=APIResponse[dict])
def lock_payroll_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:lock")),
):
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    
    run.status = "LOCKED"
    run.locked_at = datetime.now(timezone.utc)
    period = run.period
    if period:
        period.status = "LOCKED"
    db.commit()

    AuditService.log_event(
        db=db,
        action="LOCK_PAYROLL",
        module="payroll",
        entity_type="PayrollRun",
        entity_id=run.id,
        user_id=current_user.id,
    )
    return APIResponse(data={"status": "LOCKED"}, message="Payroll run permanently locked")


@router.get("/items/{item_id}/payslip", response_class=HTMLResponse)
def get_payslip_html(
    item_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    """Renders print-ready bilingual payslip document with Cambodia GDT & NSSF details."""
    item = db.query(PayrollItem).filter(PayrollItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Payroll item not found")

    employee = db.query(Employee).filter(Employee.id == item.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    run = db.query(PayrollRun).filter(PayrollRun.id == item.payroll_run_id).first()
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first() if run else None
    company = db.query(Company).filter(Company.id == employee.company_id).first() if employee else None

    html_content = PayslipGenerator.generate_html(
        item=item,
        employee=employee,
        run=run,
        period=period,
        company=company,
    )
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/items/{item_id}/payslip/json", response_model=APIResponse[dict])
def get_payslip_json(
    item_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    """Returns structured JSON for frontend payslip rendering and modal previews."""
    item = db.query(PayrollItem).filter(PayrollItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Payroll item not found")

    emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
    run = db.query(PayrollRun).filter(PayrollRun.id == item.payroll_run_id).first()
    period = db.query(PayrollPeriod).filter(PayrollPeriod.id == run.payroll_period_id).first() if run else None
    company = db.query(Company).filter(Company.id == emp.company_id).first() if emp else None

    data = {
        "item_id": item.id,
        "employee_code": emp.employee_code,
        "name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
        "name_en": f"{emp.first_name_en} {emp.last_name_en}",
        "department": emp.department.name_en if emp.department else "",
        "position": emp.position.title_en if emp.position else "",
        "bank_name": emp.bank_name or "ABA Bank",
        "bank_account_number": emp.bank_account_number,
        "bank_account_name": emp.bank_account_name,
        "currency_contract": item.currency_contract,
        "base_salary_contract": float(item.base_salary_contract),
        "worked_days": float(item.worked_days),
        "gross_salary_khr": float(item.gross_salary_khr),
        "nssf_pension_employee_khr": float(item.nssf_pension_employee_khr),
        "nssf_pension_employer_khr": float(item.nssf_pension_employer_khr),
        "nssf_health_employer_khr": float(item.nssf_health_employer_khr),
        "nssf_accident_employer_khr": float(item.nssf_accident_employer_khr),
        "taxable_salary_khr": float(item.taxable_salary_khr),
        "tax_relief_dependents_khr": float(item.tax_relief_dependents_khr),
        "tax_on_salary_khr": float(item.tax_on_salary_khr),
        "loan_deduction_khr": float(item.loan_deduction_khr),
        "total_deductions_khr": float(item.total_deductions_khr),
        "net_salary_khr": float(item.net_salary_khr),
        "net_salary_usd": float(item.net_salary_usd),
        "exchange_rate": float(run.exchange_rate_usd_to_khr if run else 4100),
        "period_name": period.name if period else "",
        "period_start": str(period.start_date) if period else "",
        "period_end": str(period.end_date) if period else "",
        "company_name_kh": company.name_kh if company else "CamTech Solutions",
        "company_name_en": company.name_en if company else "CamTech Solutions Co., Ltd.",
        "company_tin": company.tax_id_number if company else "",
        "company_nssf": company.nssf_number if company else "",
        "calculation_snapshot": item.calculation_snapshot,
    }
    return APIResponse(data=data, message="Payslip data retrieved successfully")


@router.get("/runs/{run_id}/bank-export")
def export_bank_payroll_file(
    run_id: str,
    bank_format: str = Query("ABA", pattern="^(ABA|ACLEDA|UNIVERSAL)$"),
    file_type: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    """Generates bank payroll disbursement file for ABA Bank, ACLEDA, or Universal formats."""
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")

    items = (
        db.query(PayrollItem, Employee)
        .join(Employee, Employee.id == PayrollItem.employee_id)
        .filter(PayrollItem.payroll_run_id == run_id)
        .all()
    )

    if not items:
        raise HTTPException(status_code=400, detail="No payroll items found for this run")

    AuditService.log_event(
        db=db,
        action="EXPORT_BANK_PAYROLL",
        module="payroll",
        entity_type="PayrollRun",
        entity_id=run.id,
        user_id=current_user.id,
        new_values={"bank_format": bank_format, "file_type": file_type, "count": len(items)},
    )

    if file_type.lower() == "excel":
        content = BankExportService.generate_excel(items, bank_format=bank_format)
        filename = f"Payroll_{bank_format}_{run.id[:8]}.xlsx"
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    else:
        csv_text = BankExportService.generate_csv(items, bank_format=bank_format)
        filename = f"Payroll_{bank_format}_{run.id[:8]}.csv"
        return Response(
            content=csv_text,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

