import pytest
from decimal import Decimal
from datetime import date
from app.models.employee import Employee
from app.models.talent import DisciplinaryRecord


def test_disciplinary_action_and_warning_letter(client, auth_headers, db_session):
    """Verifies progressive disciplinary workflow, warning letter generation, and acknowledgment."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # 1. Issue First Written Warning
    payload = {
        "employee_id": emp.id,
        "incident_date": "2026-10-12",
        "category": "LATENESS",
        "description": "Repeated unexcused late arrivals exceeding 45 minutes on three consecutive days.",
        "action_taken": "FIRST_WRITTEN_WARNING",
        "improvement_plan": "Employee must maintain punctual attendance for the next 60 days.",
    }
    res = client.post("/api/v1/disciplinary", json=payload, headers=auth_headers)
    assert res.status_code == 200, res.text
    disc_data = res.json()["data"]
    disc_id = disc_data["id"]
    assert "WL-2026-" in disc_data["warning_letter_number"]
    assert disc_data["action_taken"] == "FIRST_WRITTEN_WARNING"

    # 2. Acknowledge disciplinary action
    res_ack = client.put(
        f"/api/v1/disciplinary/{disc_id}/acknowledge",
        json={"employee_comments": "Understood and signed. Committing to punctuality."},
        headers=auth_headers,
    )
    assert res_ack.status_code == 200
    assert res_ack.json()["data"]["acknowledged"] is True

    # 3. Retrieve printable bilingual Warning Letter HTML
    res_html = client.get(f"/api/v1/disciplinary/{disc_id}/warning-letter", headers=auth_headers)
    assert res_html.status_code == 200
    assert "text/html" in res_html.headers["content-type"]
    assert "ព្រះរាជាណាចក្រកម្ពុជា" in res_html.text
    assert "First Written Warning Letter" in res_html.text
    assert disc_data["warning_letter_number"] in res_html.text


def test_article_27_suspension_limit(client, auth_headers, db_session):
    """Enforces Cambodia Labor Law Article 27: Disciplinary suspension shall not exceed 7 days."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # 1. Attempt invalid suspension of 10 days (> 7 days)
    invalid_payload = {
        "employee_id": emp.id,
        "incident_date": "2026-10-15",
        "category": "INSUBORDINATION",
        "description": "Refusal to perform lawful work assignments.",
        "action_taken": "SUSPENSION",
        "suspension_days": 10,
    }
    res_invalid = client.post("/api/v1/disciplinary", json=invalid_payload, headers=auth_headers)
    assert res_invalid.status_code == 400
    assert "Article 27" in res_invalid.json()["detail"]

    # 2. Issue valid suspension of 5 days (<= 7 days)
    valid_payload = {
        "employee_id": emp.id,
        "incident_date": "2026-10-15",
        "category": "INSUBORDINATION",
        "description": "Refusal to perform lawful work assignments.",
        "action_taken": "SUSPENSION",
        "suspension_days": 5,
    }
    res_valid = client.post("/api/v1/disciplinary", json=valid_payload, headers=auth_headers)
    assert res_valid.status_code == 200
    assert res_valid.json()["data"]["suspension_days"] == 5


def test_article_166_seniority_leave(client, auth_headers, db_session):
    """Verifies statutory seniority annual leave calculation (+1 extra day for every 3 years)."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # Set employee join date to 7 years ago
    emp.join_date = date(2019, 1, 1)
    db_session.commit()

    res = client.get(f"/api/v1/leave/seniority-calculation/{emp.id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["base_annual_leave_days"] == 18.0
    # 7 years // 3 = 2 extra days
    assert data["seniority_bonus_days"] == 2.0
    assert data["total_annual_entitlement"] == 20.0


def test_article_167_leave_encashment_and_holidays(client, auth_headers, db_session):
    """Verifies unused leave encashment formula and public holidays calendar."""
    emp = db_session.query(Employee).filter(Employee.is_deleted == False).first()
    assert emp is not None

    # 1. Leave Encashment Preview
    res_encash = client.get(f"/api/v1/leave/encashment-preview/{emp.id}?exchange_rate=4100", headers=auth_headers)
    assert res_encash.status_code == 200
    encash_data = res_encash.json()["data"]
    assert encash_data["daily_wage_khr"] > 0
    assert encash_data["encashment_amount_khr"] > 0
    assert encash_data["encashment_amount_usd"] > 0

    # 2. Public Holidays Calendar
    res_holidays = client.get("/api/v1/leave/public-holidays?year=2026", headers=auth_headers)
    assert res_holidays.status_code == 200
    holidays = res_holidays.json()["data"]
    assert len(holidays) >= 15
    # Check Khmer New Year and Pchum Ben exist
    assert any("Khmer New Year" in h["name_en"] for h in holidays)
    assert any("Pchum Ben" in h["name_en"] for h in holidays)
