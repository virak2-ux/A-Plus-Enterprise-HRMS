"""
Test suite for Phase 4 Enterprise Features:
- Loans & Salary Advances (amortization, repayment, balance updates)
- Talent & 360 Appraisals (cycles, reviews, course enrollment)
- Secure Document Vault (registration, expiry alerts, threshold)
- AI HR Advisor (Cambodia Labor Law and GDT tax guidance)
"""

from datetime import date, timedelta
from decimal import Decimal
import pytest
from app.models.employee import Employee
from app.models.company import Company, Department, Position


def test_loans_lifecycle(client, auth_headers, db_session):
    """Tests loan creation, amortization calculation, and repayment."""
    emp = db_session.query(Employee).first()
    assert emp is not None

    # 1. Create a loan
    payload = {
        "employee_id": emp.id,
        "loan_type": "SALARY_ADVANCE",
        "principal_amount": 500.0,
        "currency": "USD",
        "tenure_months": 5,
        "start_date": date.today().isoformat(),
        "notes": "Emergency family support advance",
    }
    res = client.post("/api/v1/loans", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    loan_id = res.json()["data"]["id"]
    assert res.json()["data"]["remaining_balance"] == 500.0

    # 2. List loans
    res = client.get(f"/api/v1/loans?employee_id={emp.id}", headers=auth_headers)
    assert res.status_code == 200
    loans = res.json()["data"]
    assert len(loans) >= 1
    target = next(l for l in loans if l["id"] == loan_id)
    assert target["monthly_deduction_amount"] == 100.0  # 500 / 5 months
    assert target["status"] == "ACTIVE"

    # 3. Record repayment of $100
    repay_payload = {"amount": 100.0, "notes": "Cash repayment at Finance desk"}
    res = client.post(f"/api/v1/loans/{loan_id}/repay", json=repay_payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["remaining_balance"] == 400.0

    # 4. Pay off remainder
    repay_remainder = {"amount": 400.0, "notes": "Early full settlement"}
    res = client.post(f"/api/v1/loans/{loan_id}/repay", json=repay_remainder, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["remaining_balance"] == 0.0
    assert res.json()["data"]["status"] == "PAID_OFF"


def test_talent_and_appraisals_flow(client, auth_headers, db_session):
    """Tests appraisal cycle, review scoring, and certified training enrollment."""
    comp = db_session.query(Company).first()
    emp = db_session.query(Employee).first()

    # 1. Create cycle
    cycle_payload = {
        "company_id": comp.id,
        "title": "2026 Q3 Enterprise Review",
        "year": 2026,
        "start_date": "2026-07-01",
        "end_date": "2026-09-30",
        "rating_scale_max": 5,
    }
    res = client.post("/api/v1/talent/cycles", json=cycle_payload, headers=auth_headers)
    assert res.status_code == 200
    cycle_id = res.json()["data"]["id"]

    # 2. Submit 360 Review
    review_payload = {
        "cycle_id": cycle_id,
        "employee_id": emp.id,
        "self_score": 4.5,
        "self_comments": "Exceeded engineering sprint deliverables and assisted junior team members.",
        "manager_score": 4.8,
        "manager_comments": "Exceptional leadership in Cambodia HRMS system architecture.",
        "strengths": "Architecture, technical diligence, compliance precision.",
        "development_goals": "Expand mentoring across frontend team.",
    }
    res = client.post("/api/v1/talent/reviews", json=review_payload, headers=auth_headers)
    assert res.status_code == 200
    # Expected weighted score: (4.5 * 0.4) + (4.8 * 0.6) = 1.8 + 2.88 = 4.68
    assert res.json()["data"]["final_score"] == 4.68
    assert res.json()["data"]["status"] == "COMPLETED"

    # 3. Create course and enroll
    course_payload = {
        "company_id": comp.id,
        "title_en": "Cambodia Labor Law & Statutory Payroll Compliance",
        "title_kh": "ច្បាប់ការងារកម្ពុជា និងការអនុលោមប្រាក់បៀវត្ស",
        "provider": "Ministry of Labour & CamHR Institute",
        "duration_hours": 16.0,
        "cost": 150.0,
        "currency": "USD",
        "description": "Certified executive training on Prakas 443 and GDT circulars.",
    }
    res = client.post("/api/v1/talent/courses", json=course_payload, headers=auth_headers)
    assert res.status_code == 200
    course_id = res.json()["data"]["id"]

    enroll_payload = {
        "employee_id": emp.id,
        "completion_date": date.today().isoformat(),
        "score": 95.5,
        "certificate_url": "https://certs.camtech.com.kh/verify/LL-2026-981",
    }
    res = client.post(f"/api/v1/talent/courses/{course_id}/enroll", json=enroll_payload, headers=auth_headers)
    assert res.status_code == 200
    assert "certified" in res.json()["message"].lower()


def test_document_vault_and_expiry_alerts(client, auth_headers, db_session):
    """Tests document upload, days-to-expiry calculation, and threshold filtering."""
    emp = db_session.query(Employee).first()

    # 1. Register document expiring in 25 days (CRITICAL alert)
    expiry_25d = date.today() + timedelta(days=25)
    doc_payload = {
        "employee_id": emp.id,
        "document_type": "PASSPORT",
        "title": "Cambodia Official Passport",
        "document_number": "N99182736",
        "file_url": "https://vault.camtech.com.kh/docs/passports/p1.pdf",
        "file_size_bytes": 204800,
        "mime_type": "application/pdf",
        "issue_date": (date.today() - timedelta(days=365 * 9)).isoformat(),
        "expiry_date": expiry_25d.isoformat(),
        "is_confidential": True,
    }
    res = client.post("/api/v1/documents", json=doc_payload, headers=auth_headers)
    assert res.status_code == 200
    doc_id = res.json()["data"]["id"]

    # 2. Query documents
    res = client.get(f"/api/v1/documents?employee_id={emp.id}", headers=auth_headers)
    assert res.status_code == 200
    docs = res.json()["data"]
    target = next(d for d in docs if d["id"] == doc_id)
    assert target["days_to_expiry"] == 25

    # 3. Query expiring documents (30-day threshold)
    res = client.get("/api/v1/documents/expiring?days_threshold=30", headers=auth_headers)
    assert res.status_code == 200
    expiring = res.json()["data"]
    assert any(d["id"] == doc_id for d in expiring)
    critical_item = next(d for d in expiring if d["id"] == doc_id)
    assert critical_item["severity"] == "CRITICAL"


def test_ai_hr_advisor_queries(client, auth_headers):
    """Tests AI HR advisor on Cambodia Labor Law articles and GDT tax."""
    # 1. Query Seniority Indemnity
    res = client.post("/api/v1/ai/chat", json={"message": "How is seniority indemnity calculated under Art. 89?"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "15 days" in data["reply"]
    assert "Cambodia Labor Law Art. 89" in data["legal_references"]

    # 2. Query Overtime Multipliers
    res = client.post("/api/v1/ai/chat", json={"message": "What is the overtime rate for night shifts and holidays?"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "200%" in data["reply"] or "2.0x" in data["reply"]

    # 3. Query Tax on Salary
    res = client.post("/api/v1/ai/chat", json={"message": "What are the GDT salary tax brackets and dependent relief?"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "150,000 KHR" in data["reply"]
    assert "0%" in data["reply"]
