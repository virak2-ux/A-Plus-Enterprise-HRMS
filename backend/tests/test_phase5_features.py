import pytest
from decimal import Decimal
from datetime import date, datetime, timezone
from app.models.employee import Employee
from app.models.company import Company
from app.models.payroll import PayrollPeriod, Loan
from app.models.overtime import OvertimeRequest


def test_overtime_rules(client, auth_headers):
    """Verifies statutory Cambodia Labor Law Article 139 overtime rates."""
    response = client.get("/api/v1/overtime/rules", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 4
    normal = next(r for r in data if r["day_type"] == "NORMAL_DAY")
    sunday = next(r for r in data if r["day_type"] == "WEEKLY_REST_DAY")
    holiday = next(r for r in data if r["day_type"] == "PUBLIC_HOLIDAY")
    assert normal["multiplier_rate"] == 1.50
    assert sunday["multiplier_rate"] == 2.00
    assert holiday["multiplier_rate"] == 2.00


def test_overtime_submission_and_approval(client, auth_headers, db_session):
    """Tests overtime submission with auto-multiplier and manager approval."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # 1. Normal Day Overtime (1.5x)
    payload1 = {
        "employee_id": emp.id,
        "date": "2026-10-05",
        "start_time": "2026-10-05T18:00:00Z",
        "end_time": "2026-10-05T20:00:00Z",
        "total_hours": 2.0,
        "day_type": "NORMAL_DAY",
        "reason": "Quarter-end closing",
    }
    r1 = client.post("/api/v1/overtime", json=payload1, headers=auth_headers)
    assert r1.status_code == 200
    ot1 = r1.json()["data"]
    assert ot1["multiplier_rate"] == 1.5
    assert ot1["status"] == "PENDING"

    # 2. Weekly Rest Day Overtime (2.0x)
    payload2 = {
        "employee_id": emp.id,
        "date": "2026-10-11",
        "start_time": "2026-10-11T08:00:00Z",
        "end_time": "2026-10-11T12:00:00Z",
        "total_hours": 4.0,
        "day_type": "WEEKLY_REST_DAY",
        "reason": "Emergency production maintenance",
    }
    r2 = client.post("/api/v1/overtime", json=payload2, headers=auth_headers)
    assert r2.status_code == 200
    ot2 = r2.json()["data"]
    assert ot2["multiplier_rate"] == 2.0

    # 3. Approve ot1 individually
    r_app = client.put(f"/api/v1/overtime/{ot1['id']}/status", json={"status": "APPROVED"}, headers=auth_headers)
    assert r_app.status_code == 200
    assert r_app.json()["data"]["status"] == "APPROVED"

    # 4. Batch approve ot2
    r_batch = client.post(
        "/api/v1/overtime/batch-approve",
        json={"request_ids": [ot2["id"]], "status": "APPROVED"},
        headers=auth_headers,
    )
    assert r_batch.status_code == 200
    assert r_batch.json()["data"]["processed_count"] == 1


def test_payroll_automatic_overtime_and_loan_ingestion(client, auth_headers, db_session):
    """Verifies that payroll run automatically pulls approved overtime and active loan deductions."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None
    comp = db_session.query(Company).filter(Company.id == emp.company_id).first()
    assert comp is not None

    # 1. Create an approved overtime record directly for this employee
    ot_req = OvertimeRequest(
        employee_id=emp.id,
        date=date(2026, 11, 15),
        start_time=datetime(2026, 11, 15, 8, 0, tzinfo=timezone.utc),
        end_time=datetime(2026, 11, 15, 12, 0, tzinfo=timezone.utc),
        total_hours=Decimal("4.00"),
        day_type="WEEKLY_REST_DAY",
        multiplier_rate=Decimal("2.00"),
        reason="Scheduled critical system migration",
        status="APPROVED",
        payroll_status="UNPROCESSED",
    )
    db_session.add(ot_req)

    # 2. Create an active loan of $300 with $100 monthly deduction
    loan = Loan(
        employee_id=emp.id,
        loan_type="SALARY_ADVANCE",
        principal_amount=Decimal("300.00"),
        currency="USD",
        interest_rate=Decimal("0.00"),
        monthly_deduction_amount=Decimal("100.00"),
        remaining_balance=Decimal("300.00"),
        start_date=date(2026, 11, 1),
        end_date=date(2027, 2, 1),
        status="ACTIVE",
    )
    db_session.add(loan)
    db_session.commit()

    # 3. Create Payroll Period for November 2026
    period = PayrollPeriod(
        company_id=comp.id,
        name="November 2026 Operations Payroll",
        cycle_type="MONTHLY",
        start_date=date(2026, 11, 1),
        end_date=date(2026, 11, 30),
        cutoff_date=date(2026, 11, 25),
        payment_date=date(2026, 11, 30),
        status="DRAFT",
    )
    db_session.add(period)
    db_session.commit()

    # 4. Trigger payroll calculation with rate 4100
    r_calc = client.post(
        "/api/v1/payroll/runs/calculate",
        json={"payroll_period_id": period.id, "exchange_rate_usd_to_khr": 4100.0},
        headers=auth_headers,
    )
    assert r_calc.status_code == 200, r_calc.text
    run_data = r_calc.json()["data"]

    # 5. Fetch payroll items
    r_items = client.get(f"/api/v1/payroll/runs/{run_data['id']}/items", headers=auth_headers)
    assert r_items.status_code == 200
    items = r_items.json()["data"]
    emp_item = next(i for i in items if i["employee_id"] == emp.id)

    # Verify overtime hours were ingested (4.0h)
    assert emp_item["overtime_hours"] == 4.0
    assert emp_item["total_overtime_pay_khr"] > 0

    # Verify loan deduction was ingested ($100 * 4100 = 410,000 KHR)
    assert emp_item["loan_deduction_khr"] == 410000.0

    # 6. Lock payroll and verify overtime becomes PROCESSED and loan balance decreases
    r_lock = client.put(f"/api/v1/payroll/runs/{run_data['id']}/lock", headers=auth_headers)
    assert r_lock.status_code == 200

    db_session.refresh(loan)
    # Remaining balance should be $300 - $100 = $200
    assert float(loan.remaining_balance) == 200.0

    # Check overtime request status is PROCESSED
    db_session.refresh(ot_req)
    assert ot_req.payroll_status == "PROCESSED"


def test_system_settings_and_audit_logs(client, auth_headers):
    """Verifies retrieval and update of system settings, and audit log generation."""
    # Retrieve initial settings
    r_get = client.get("/api/v1/system/settings", headers=auth_headers)
    assert r_get.status_code == 200
    initial_settings = r_get.json()["data"]
    assert "exchange_rate" in initial_settings

    # Update settings
    payload = {
        "exchange_rate": 4125,
        "dependent_rebate": 150000,
        "ai_enabled": True,
    }
    r_put = client.put("/api/v1/system/settings", json=payload, headers=auth_headers)
    assert r_put.status_code == 200
    updated = r_put.json()["data"]
    assert updated["exchange_rate"] == 4125

    # Verify audit log was recorded
    r_audit = client.get("/api/v1/system/audit-logs?module=system", headers=auth_headers)
    assert r_audit.status_code == 200
    audit_data = r_audit.json()["data"]
    assert any(a["action"] == "UPDATE_SETTINGS" for a in audit_data)
