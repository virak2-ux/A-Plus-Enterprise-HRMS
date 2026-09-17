import pytest
from decimal import Decimal
from datetime import date
from app.models.employee import Employee
from app.models.leave import LeaveType, LeaveRequest


def test_organization_hierarchy_chart(client, auth_headers):
    """Verifies recursive employee reporting hierarchy endpoint."""
    res = client.get("/api/v1/organization/hierarchy-chart", headers=auth_headers)
    assert res.status_code == 200, res.text
    tree = res.json()["data"]
    assert isinstance(tree, list)
    assert len(tree) > 0
    top_node = tree[0]
    assert "name_en" in top_node
    assert "name_kh" in top_node
    assert "position_title_en" in top_node
    assert "children" in top_node
    assert "direct_reports_count" in top_node
    assert isinstance(top_node["children"], list)


def test_organization_headcount_budget_analysis(client, auth_headers):
    """Verifies department headcount utilization and salary band analysis."""
    res = client.get("/api/v1/organization/budget-analysis", headers=auth_headers)
    assert res.status_code == 200, res.text
    data = res.json()["data"]
    assert "company_summary" in data
    assert "departments" in data
    summary = data["company_summary"]
    assert "total_approved_headcount" in summary
    assert "total_active_headcount" in summary
    assert "overall_utilization_pct" in summary
    assert "total_monthly_budget_usd" in summary

    depts = data["departments"]
    assert isinstance(depts, list)
    if len(depts) > 0:
        d = depts[0]
        assert "approved_headcount" in d
        assert "actual_headcount" in d
        assert "utilization_pct" in d
        assert "status" in d


def test_ess_leave_application_and_rejection(client, auth_headers, db_session):
    """Verifies employee leave submission and supervisor rejection workflow."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    lt = db_session.query(LeaveType).filter(LeaveType.code == "ANNUAL").first()
    if not lt:
        lt = db_session.query(LeaveType).first()
    if not lt:
        lt = LeaveType(code="ANNUAL", name_kh="ច្បាប់ប្រចាំឆ្នាំ", name_en="Annual Leave", default_days_per_year=18.0)
        db_session.add(lt)
        db_session.commit()
        db_session.refresh(lt)
    assert lt is not None

    # 1. Employee submits leave request
    leave_payload = {
        "employee_id": emp.id,
        "leave_type_id": lt.id,
        "start_date": "2026-11-10",
        "end_date": "2026-11-12",
        "reason": "Personal family wedding ceremony.",
    }
    res = client.post("/api/v1/leave/requests", json=leave_payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    req_data = res.json()["data"]
    assert req_data["status"] == "PENDING"
    req_id = req_data["id"]

    # 2. Supervisor rejects with reason
    res_rej = client.put(
        f"/api/v1/leave/requests/{req_id}/reject",
        json={"rejection_reason": "Urgent project deployment during requested period."},
        headers=auth_headers,
    )
    assert res_rej.status_code == 200, res_rej.text
    rej_data = res_rej.json()["data"]
    assert rej_data["status"] == "REJECTED"
    assert "Urgent project deployment" in rej_data["rejection_reason"]


def test_ess_loan_request_and_manager_approval(client, auth_headers, db_session):
    """Verifies employee loan / advance request and subsequent manager approval."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # 1. Employee applies for salary advance
    loan_payload = {
        "employee_id": emp.id,
        "loan_type": "SALARY_ADVANCE",
        "principal_amount": 300.0,
        "currency": "USD",
        "tenure_months": 3,
        "notes": "Emergency medical expenses for family member.",
    }
    res = client.post("/api/v1/loans/request", json=loan_payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    loan_data = res.json()["data"]
    assert loan_data["status"] == "PENDING"
    assert loan_data["monthly_deduction"] == 100.0
    loan_id = loan_data["id"]

    # 2. Manager approves loan application
    res_approve = client.put(
        f"/api/v1/loans/{loan_id}/status",
        json={"status": "ACTIVE", "notes": "Approved by HR Director."},
        headers=auth_headers,
    )
    assert res_approve.status_code == 200, res_approve.text
    assert res_approve.json()["data"]["status"] == "ACTIVE"
