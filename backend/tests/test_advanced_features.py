"""
Tests for Phase 2 advanced features:
- Bilingual Payslip generation & JSON trace
- Bank Export (ABA, ACLEDA, Excel)
- Bulk Employee Import engine
- Biometric webhook punch ingestion
- Offboarding final settlement calculation
"""

import io
from datetime import date, datetime, timezone
from decimal import Decimal
from openpyxl import load_workbook
import pytest
from app.models.company import Company, Department, Position
from app.models.employee import Employee
from app.models.payroll import PayrollPeriod, PayrollRun, PayrollItem
from app.models.offboarding import OffboardingRequest, OffboardingTask, FinalSettlement
from app.services.payslip_generator import PayslipGenerator
from app.services.bank_export_service import BankExportService
from app.services.employee_import_service import EmployeeImportService


def test_payslip_html_and_json_generation(db_session):
    co = db_session.query(Company).first()
    emp = db_session.query(Employee).first()
    assert co is not None
    assert emp is not None

    period = db_session.query(PayrollPeriod).first()
    if not period:
        period = PayrollPeriod(
            company_id=co.id,
            name="March 2026",
            cycle_type="MONTHLY",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 3, 31),
            cutoff_date=date(2026, 3, 25),
            payment_date=date(2026, 3, 31),
            status="OPEN",
        )
        db_session.add(period)
        db_session.flush()

    run = db_session.query(PayrollRun).filter(PayrollRun.payroll_period_id == period.id).first()
    if not run:
        run = PayrollRun(
            payroll_period_id=period.id,
            exchange_rate_usd_to_khr=Decimal("4100.0"),
            status="CALCULATED",
        )
        db_session.add(run)
        db_session.flush()

    item = db_session.query(PayrollItem).filter(PayrollItem.employee_id == emp.id).first()
    if not item:
        item = PayrollItem(
            payroll_run_id=run.id,
            employee_id=emp.id,
            base_salary_contract=Decimal("1500.00"),
            currency_contract="USD",
            base_salary_earned_khr=Decimal("6150000.00"),
            gross_salary_khr=Decimal("6150000.00"),
            nssf_pension_employee_khr=Decimal("24000.00"),
            nssf_pension_employer_khr=Decimal("24000.00"),
            nssf_health_employer_khr=Decimal("31200.00"),
            nssf_accident_employer_khr=Decimal("9600.00"),
            taxable_salary_khr=Decimal("6126000.00"),
            tax_relief_dependents_khr=Decimal("150000.00"),
            tax_base_salary_khr=Decimal("5976000.00"),
            tax_on_salary_khr=Decimal("597600.00"),
            total_deductions_khr=Decimal("621600.00"),
            net_salary_khr=Decimal("5528400.00"),
            net_salary_usd=Decimal("1348.39"),
        )
        db_session.add(item)
        db_session.commit()

    html = PayslipGenerator.generate_html(
        item=item,
        employee=emp,
        run=run,
        period=period,
        company=co,
    )

    assert "ប័ណ្ណបើកប្រាក់បៀវត្សរ៍" in html
    assert "PAYSLIP" in html
    assert emp.employee_code in html
    assert "4,100" in html
    assert "ប.ស.ស." in html
    assert "NET TAKE-HOME SALARY" in html


def test_bank_export_csv_and_excel(db_session):
    co = db_session.query(Company).first()
    emp = db_session.query(Employee).first()
    assert emp is not None

    item = db_session.query(PayrollItem).filter(PayrollItem.employee_id == emp.id).first()
    if not item:
        period = db_session.query(PayrollPeriod).first()
        if not period:
            period = PayrollPeriod(
                company_id=co.id,
                name="March 2026",
                cycle_type="MONTHLY",
                start_date=date(2026, 3, 1),
                end_date=date(2026, 3, 31),
                cutoff_date=date(2026, 3, 25),
                payment_date=date(2026, 3, 31),
                status="OPEN",
            )
            db_session.add(period)
            db_session.flush()

        run = db_session.query(PayrollRun).filter(PayrollRun.payroll_period_id == period.id).first()
        if not run:
            run = PayrollRun(
                payroll_period_id=period.id,
                exchange_rate_usd_to_khr=Decimal("4100.0"),
                status="CALCULATED",
            )
            db_session.add(run)
            db_session.flush()

        item = PayrollItem(
            payroll_run_id=run.id,
            employee_id=emp.id,
            base_salary_contract=Decimal("1500.00"),
            currency_contract="USD",
            base_salary_earned_khr=Decimal("6150000.00"),
            gross_salary_khr=Decimal("6150000.00"),
            nssf_pension_employee_khr=Decimal("24000.00"),
            nssf_pension_employer_khr=Decimal("24000.00"),
            nssf_health_employer_khr=Decimal("31200.00"),
            nssf_accident_employer_khr=Decimal("9600.00"),
            taxable_salary_khr=Decimal("6126000.00"),
            tax_relief_dependents_khr=Decimal("150000.00"),
            tax_base_salary_khr=Decimal("5976000.00"),
            tax_on_salary_khr=Decimal("597600.00"),
            total_deductions_khr=Decimal("621600.00"),
            net_salary_khr=Decimal("5528400.00"),
            net_salary_usd=Decimal("1348.39"),
        )
        db_session.add(item)
        db_session.commit()

    items_with_emp = [(item, emp)]

    # Test ABA CSV export
    aba_csv = BankExportService.generate_csv(items_with_emp, bank_format="ABA")
    assert "Beneficiary Account" in aba_csv
    assert "Beneficiary Name" in aba_csv
    assert emp.employee_code in aba_csv

    # Test ACLEDA CSV export
    acleda_csv = BankExportService.generate_csv(items_with_emp, bank_format="ACLEDA")
    assert "Staff ID" in acleda_csv
    assert emp.employee_code in acleda_csv

    # Test Excel generation
    excel_bytes = BankExportService.generate_excel(items_with_emp, bank_format="ABA")
    assert len(excel_bytes) > 1000
    wb = load_workbook(io.BytesIO(excel_bytes))
    assert "ABA_PAYROLL" in wb.sheetnames[0].upper()


def test_employee_bulk_import_template_and_dry_run(db_session):
    co = db_session.query(Company).first()
    assert co is not None

    # Test template generation
    template_bytes = EmployeeImportService.generate_template_excel()
    assert len(template_bytes) > 1000
    wb = load_workbook(io.BytesIO(template_bytes))
    ws = wb.active
    assert ws.cell(row=1, column=1).value == "employee_code"

    # Test dry run validation on empty or valid data
    csv_data = (
        "employee_code,first_name_kh,last_name_kh,first_name_en,last_name_en,gender,date_of_birth,phone_primary,email_work,department_name,position_title,join_date,base_salary,salary_currency,employment_type,bank_name,bank_account_number,is_resident_for_tax,spouse_dependent_count,minor_children_count\n"
        "EMP-TEST-999,តារា,មាន,Dara,Mean,MALE,1994-06-12,+855 12 111 222,dara.mean@camtech.com.kh,Engineering,Senior Software Engineer,2026-03-01,1500,USD,PERMANENT_UDC,ABA Bank,001 999 111,TRUE,1,1\n"
    ).encode("utf-8")

    result = EmployeeImportService.process_import(
        db=db_session,
        company_id=co.id,
        file_bytes=csv_data,
        filename="test_employees.csv",
        dry_run=True,
    )

    assert result["total_rows"] == 1
    assert result["valid_rows"] == 1
    assert result["invalid_rows"] == 0
    assert len(result["preview"]) == 1
    assert result["preview"][0]["employee_code"] == "EMP-TEST-999"


def test_biometric_punch_flow(client, auth_headers, db_session):
    emp = db_session.query(Employee).first()
    assert emp is not None

    payload = {
        "device_id": "BIO-TEST-01",
        "device_name": "Main Turnstile",
        "punches": [
            {
                "employee_code": emp.employee_code,
                "timestamp": "2026-03-25T08:15:00Z",
                "punch_type": "CHECK_IN",
                "verify_mode": "FINGERPRINT",
            },
            {
                "employee_code": emp.employee_code,
                "timestamp": "2026-03-25T17:35:00Z",
                "punch_type": "CHECK_OUT",
                "verify_mode": "FINGERPRINT",
            }
        ]
    }

    res = client.post("/api/v1/attendance/biometric-webhook", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["processed"] == 2
    assert data["created"] == 1
    assert data["updated"] == 1


def test_offboarding_settlement_calculator(client, auth_headers, db_session):
    co = db_session.query(Company).first()
    dept = db_session.query(Department).first()
    pos = db_session.query(Position).first()

    # Create dedicated test employee for offboarding
    exit_emp = Employee(
        company_id=co.id,
        employee_code="EMP-TEST-EXIT",
        first_name_kh="ចាកចេញ",
        last_name_kh="តេស្ត",
        first_name_en="Exit",
        last_name_en="Test",
        gender="MALE",
        date_of_birth=date(1990, 1, 1),
        phone_primary="+855 12 000 111",
        email_work="exit.test@company.com",
        department_id=dept.id,
        position_id=pos.id,
        join_date=date(2023, 1, 1),
        base_salary=Decimal("1200.00"),
        salary_currency="USD",
        employment_status="ACTIVE",
    )
    db_session.add(exit_emp)
    db_session.commit()
    db_session.refresh(exit_emp)

    req_payload = {
        "employee_id": exit_emp.id,
        "reason": "RESIGNATION",
        "notice_date": "2026-03-01",
        "last_working_date": "2026-03-31",
        "exit_interview_notes": "Moving abroad",
    }

    # Create offboarding request
    create_res = client.post("/api/v1/offboarding/requests", json=req_payload, headers=auth_headers)
    assert create_res.status_code == 200
    req_id = create_res.json()["data"]["id"]

    # Calculate final settlement
    settle_res = client.get(f"/api/v1/offboarding/requests/{req_id}/settlement", headers=auth_headers)
    assert settle_res.status_code == 200
    data = settle_res.json()["data"]
    assert "prorated_salary_khr" in data
    assert "unused_leave_encashment_khr" in data
    assert "seniority_indemnity_khr" in data
    assert data["final_net_payable_khr"] > 0

