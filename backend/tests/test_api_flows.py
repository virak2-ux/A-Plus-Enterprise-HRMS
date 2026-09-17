from datetime import date


def get_auth_token(client, username="admin@cambodia-hrms.com", password="Admin@123456"):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": password}
    )
    return login_resp.json()["access_token"]


def test_list_companies(client):
    token = get_auth_token(client)
    res = client.get("/api/v1/organization/companies", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["data"]) >= 1
    assert data["data"][0]["code"] == "CAMTECH"


def test_list_employees(client):
    token = get_auth_token(client)
    res = client.get("/api/v1/employees", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5


def test_attendance_check_in_and_out(client):
    token = get_auth_token(client)
    # Get first employee
    emp_res = client.get("/api/v1/employees", headers={"Authorization": f"Bearer {token}"})
    emp_id = emp_res.json()["data"][0]["id"]

    # Check in
    checkin_res = client.post(
        "/api/v1/attendance/check-in",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "source": "WEB", "notes": "Test punch"}
    )
    assert checkin_res.status_code == 200
    assert checkin_res.json()["data"]["status"] == "PRESENT"

    # Check out
    checkout_res = client.post(
        "/api/v1/attendance/check-out",
        headers={"Authorization": f"Bearer {token}"},
        json={"employee_id": emp_id, "source": "WEB"}
    )
    assert checkout_res.status_code == 200


def test_payroll_period_and_calculation_lifecycle(client):
    token = get_auth_token(client)
    comp_res = client.get("/api/v1/organization/companies", headers={"Authorization": f"Bearer {token}"})
    comp_id = comp_res.json()["data"][0]["id"]

    # 1. Create payroll period
    period_res = client.post(
        "/api/v1/payroll/periods",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company_id": comp_id,
            "name": "Test September 2026 Payroll",
            "cycle_type": "MONTHLY",
            "start_date": "2026-09-01",
            "end_date": "2026-09-30",
            "cutoff_date": "2026-09-25",
            "payment_date": "2026-09-30",
        }
    )
    assert period_res.status_code == 200
    period_id = period_res.json()["data"]["id"]

    # 2. Trigger Payroll Run Calculation
    calc_res = client.post(
        "/api/v1/payroll/runs/calculate",
        headers={"Authorization": f"Bearer {token}"},
        json={"payroll_period_id": period_id, "exchange_rate_usd_to_khr": 4100.0}
    )
    assert calc_res.status_code == 200
    run_data = calc_res.json()["data"]
    run_id = run_data["id"]
    assert run_data["total_gross_khr"] > 0
    assert run_data["total_net_khr"] > 0

    # 3. Fetch Itemized Employee Breakdown
    items_res = client.get(
        f"/api/v1/payroll/runs/{run_id}/items",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert items_res.status_code == 200
    items = items_res.json()["data"]
    assert len(items) >= 5
    # Verify calculation snapshot is present for auditability
    assert "inputs" in items[0]["calculation_snapshot"]

    # 4. Approve Run
    appr_res = client.put(
        f"/api/v1/payroll/runs/{run_id}/approve",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["data"]["status"] == "APPROVED"

    # 5. Lock Run
    lock_res = client.put(
        f"/api/v1/payroll/runs/{run_id}/lock",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert lock_res.status_code == 200
    assert lock_res.json()["data"]["status"] == "LOCKED"
