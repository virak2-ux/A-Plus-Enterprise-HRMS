"""
Reports & Compliance Analytics Router for Cambodia Enterprise HRMS.
Generates GDT Tax on Salary (ToS) Declarations, NSSF Monthly Contribution Schedules, and Workforce Analytics.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_permission
from app.models.payroll import PayrollRun, PayrollItem, PayrollPeriod
from app.models.employee import Employee
from app.models.company import Department, Company
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/gdt-tax-declaration", response_model=APIResponse[dict])
def get_gdt_tax_declaration(
    payroll_run_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    """
    Generates GDT Cambodia Monthly Tax on Salary (ToS) Declaration report.
    Complies with GDT Circular guidelines for progressive tax withholding.
    """
    run = None
    if payroll_run_id:
        run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
    else:
        run = db.query(PayrollRun).order_by(PayrollRun.calculated_at.desc()).first()

    if not run:
        raise HTTPException(status_code=404, detail="No payroll run found for tax declaration.")

    items = db.query(PayrollItem, Employee).join(Employee, Employee.id == PayrollItem.employee_id).filter(PayrollItem.payroll_run_id == run.id).all()

    total_staff = len(items)
    residents_count = sum(1 for _, emp in items if emp.is_resident_for_tax)
    non_residents_count = total_staff - residents_count

    total_gross_khr = sum(float(i.gross_salary_khr) for i, _ in items)
    total_taxable_khr = sum(float(i.taxable_salary_khr) for i, _ in items)
    total_dependent_relief_khr = sum(float(i.tax_relief_dependents_khr) for i, _ in items)
    total_tax_collected_khr = sum(float(i.tax_on_salary_khr) for i, _ in items)

    # Detailed employee tax schedule
    staff_tax_lines = []
    for item, emp in items:
        staff_tax_lines.append({
            "employee_code": emp.employee_code,
            "employee_name_en": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "is_resident": emp.is_resident_for_tax,
            "gross_salary_khr": float(item.gross_salary_khr),
            "nssf_pension_deduction_khr": float(item.nssf_pension_employee_khr),
            "taxable_salary_khr": float(item.taxable_salary_khr),
            "dependents_count": emp.spouse_dependent_count + emp.minor_children_count,
            "dependent_relief_khr": float(item.tax_relief_dependents_khr),
            "tax_base_salary_khr": float(item.tax_base_salary_khr),
            "tax_on_salary_khr": float(item.tax_on_salary_khr),
        })

    data = {
        "payroll_run_id": run.id,
        "period_name": run.period.name if run.period else "Monthly Cycle",
        "exchange_rate": float(run.exchange_rate_usd_to_khr),
        "total_employees": total_staff,
        "residents_count": residents_count,
        "non_residents_count": non_residents_count,
        "total_gross_khr": total_gross_khr,
        "total_taxable_khr": total_taxable_khr,
        "total_dependent_relief_khr": total_dependent_relief_khr,
        "total_tax_on_salary_khr": total_tax_collected_khr,
        "staff_details": staff_tax_lines,
    }
    return APIResponse(data=data, message="Cambodia GDT Tax on Salary declaration generated")


@router.get("/nssf-contribution-report", response_model=APIResponse[dict])
def get_nssf_contribution_report(
    payroll_run_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("payroll:view")),
):
    """
    Generates NSSF (National Social Security Fund) Monthly Contribution Ledger.
    Covers Occupational Risk (0.8%), Health Care (2.6%), and Pension Scheme (2% + 2%).
    """
    run = None
    if payroll_run_id:
        run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
    else:
        run = db.query(PayrollRun).order_by(PayrollRun.calculated_at.desc()).first()

    if not run:
        raise HTTPException(status_code=404, detail="No payroll run found.")

    items = db.query(PayrollItem, Employee).join(Employee, Employee.id == PayrollItem.employee_id).filter(PayrollItem.payroll_run_id == run.id).all()

    total_insured = len(items)
    pension_emp_khr = sum(float(i.nssf_pension_employee_khr) for i, _ in items)
    pension_empr_khr = sum(float(i.nssf_pension_employer_khr) for i, _ in items)
    health_empr_khr = sum(float(i.nssf_health_employer_khr) for i, _ in items)
    accident_empr_khr = sum(float(i.nssf_accident_employer_khr) for i, _ in items)

    total_nssf_due_khr = pension_emp_khr + pension_empr_khr + health_empr_khr + accident_empr_khr

    staff_lines = []
    for item, emp in items:
        staff_lines.append({
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "nssf_card_number": emp.nssf_card_number or "NSSF-PENDING",
            "contributory_wage_khr": float(item.nssf_contributory_wage_khr),
            "pension_employee_khr": float(item.nssf_pension_employee_khr),
            "pension_employer_khr": float(item.nssf_pension_employer_khr),
            "health_employer_khr": float(item.nssf_health_employer_khr),
            "accident_employer_khr": float(item.nssf_accident_employer_khr),
            "total_line_khr": float(
                item.nssf_pension_employee_khr
                + item.nssf_pension_employer_khr
                + item.nssf_health_employer_khr
                + item.nssf_accident_employer_khr
            ),
        })

    data = {
        "payroll_run_id": run.id,
        "total_insured_workers": total_insured,
        "total_pension_employee_khr": pension_emp_khr,
        "total_pension_employer_khr": pension_empr_khr,
        "total_health_employer_khr": health_empr_khr,
        "total_accident_employer_khr": accident_empr_khr,
        "total_nssf_remittance_khr": total_nssf_due_khr,
        "staff_details": staff_lines,
    }
    return APIResponse(data=data, message="Cambodia NSSF contribution ledger generated")


@router.get("/workforce-summary", response_model=APIResponse[dict])
def get_workforce_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:view")),
):
    total_active = db.query(Employee).filter(Employee.is_deleted == False).count()
    male_count = db.query(Employee).filter(Employee.is_deleted == False, Employee.gender == "MALE").count()
    female_count = db.query(Employee).filter(Employee.is_deleted == False, Employee.gender == "FEMALE").count()

    dept_stats = (
        db.query(Department.name_en, func.count(Employee.id))
        .join(Employee, Employee.department_id == Department.id)
        .filter(Employee.is_deleted == False)
        .group_by(Department.name_en)
        .all()
    )

    data = {
        "total_active_headcount": total_active,
        "gender_breakdown": {
            "male": male_count,
            "female": female_count,
            "male_percentage": round((male_count / max(total_active, 1)) * 100, 1),
            "female_percentage": round((female_count / max(total_active, 1)) * 100, 1),
        },
        "department_distribution": [
            {"department": name, "headcount": cnt} for name, cnt in dept_stats
        ],
    }
    return APIResponse(data=data, message="Workforce summary metrics retrieved")
