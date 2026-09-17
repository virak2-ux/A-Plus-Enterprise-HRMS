"""
Employee Bulk Import Service for Cambodia Enterprise HRMS.
Handles parsing and validation of Excel (.xlsx) and CSV files for bulk employee onboarding.
Supports dry-run validation, duplicate code detection, and transactional commit.
"""

import io
import csv
from datetime import datetime, date
from decimal import Decimal
from typing import List, Dict, Any, Tuple, Optional
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from sqlalchemy.orm import Session

from app.models.employee import Employee, SalaryHistory, Contract
from app.models.company import Department, Position, Company
from app.services.audit_service import AuditService


class EmployeeImportService:
    EXPECTED_COLUMNS = [
        "employee_code",
        "first_name_kh",
        "last_name_kh",
        "first_name_en",
        "last_name_en",
        "gender",
        "date_of_birth",
        "phone_primary",
        "email_work",
        "department_name",
        "position_title",
        "join_date",
        "base_salary",
        "salary_currency",
        "employment_type",
        "bank_name",
        "bank_account_number",
        "is_resident_for_tax",
        "spouse_dependent_count",
        "minor_children_count",
    ]

    @classmethod
    def generate_template_excel(cls) -> bytes:
        """Generates standard onboarding template with header styling and example row."""
        wb = Workbook()
        ws = wb.active
        ws.title = "Employee_Import_Template"

        header_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style="thin", color="CBD5E1"),
            right=Side(style="thin", color="CBD5E1"),
            top=Side(style="thin", color="CBD5E1"),
            bottom=Side(style="thin", color="CBD5E1"),
        )

        ws.append(cls.EXPECTED_COLUMNS)
        for col_num in range(1, len(cls.EXPECTED_COLUMNS) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        # Example row
        sample_row = [
            "EMP-010",
            "សុវណ្ណ",
            "លឹម",
            "Sovann",
            "Lim",
            "MALE",
            "1992-05-14",
            "+855 12 888 999",
            "sovann.lim@camtech.com.kh",
            "Engineering",
            "Senior Backend Engineer",
            "2026-03-01",
            "1600.00",
            "USD",
            "PERMANENT_UDC",
            "ABA Bank",
            "001 555 999",
            "TRUE",
            "1",
            "2",
        ]
        ws.append(sample_row)

        for row_idx in range(1, ws.max_row + 1):
            for col_idx in range(1, len(cls.EXPECTED_COLUMNS) + 1):
                c = ws.cell(row=row_idx, column=col_idx)
                c.border = thin_border

        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            ws.column_dimensions[col_letter].width = max(max_len + 3, 16)

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf.getvalue()

    @classmethod
    def parse_file_rows(cls, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        """Parses rows from either Excel (.xlsx) or CSV."""
        rows: List[Dict[str, Any]] = []

        if filename.lower().endswith(".csv"):
            text = file_bytes.decode("utf-8-sig", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            for r in reader:
                cleaned = {k.strip(): (v.strip() if v else "") for k, v in r.items() if k}
                rows.append(cleaned)
        else:
            wb = load_workbook(io.BytesIO(file_bytes), data_only=True)
            ws = wb.active
            header_cells = [cell.value for cell in ws[1] if cell.value]
            headers = [str(h).strip() for h in header_cells]

            for row in ws.iter_rows(min_row=2, values_only=True):
                if not any(row):
                    continue
                row_dict = {}
                for idx, h in enumerate(headers):
                    if idx < len(row):
                        val = row[idx]
                        if isinstance(val, (datetime, date)):
                            val = val.strftime("%Y-%m-%d")
                        row_dict[h] = str(val).strip() if val is not None else ""
                    else:
                        row_dict[h] = ""
                rows.append(row_dict)

        return rows

    @classmethod
    def process_import(
        cls,
        db: Session,
        company_id: str,
        file_bytes: bytes,
        filename: str,
        dry_run: bool = True,
        actor_user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Validates all rows, checks database foreign keys and uniqueness, and commits if not dry_run."""
        rows = cls.parse_file_rows(file_bytes, filename)
        if not rows:
            return {
                "success": False,
                "message": "Uploaded spreadsheet contains no data rows.",
                "total_rows": 0,
                "valid_rows": 0,
                "invalid_rows": 0,
                "errors": [{"row": 0, "field": "file", "error": "Empty spreadsheet"}],
                "preview": [],
            }

        # Cache departments and positions for this company
        departments = {d.name_en.lower(): d for d in db.query(Department).filter(Department.company_id == company_id).all()}
        positions = {p.title_en.lower(): p for p in db.query(Position).filter(Position.company_id == company_id).all()}
        
        # Existing employee codes
        existing_codes = set(
            code[0] for code in db.query(Employee.employee_code).filter(
                Employee.company_id == company_id,
                Employee.is_deleted == False
            ).all()
        )

        row_errors: List[Dict[str, Any]] = []
        parsed_employees: List[Dict[str, Any]] = []
        seen_batch_codes = set()

        for idx, r in enumerate(rows, start=2):  # Row 1 is header
            errors_in_row = []
            code = r.get("employee_code", "").strip()
            first_name_kh = r.get("first_name_kh", "").strip()
            last_name_kh = r.get("last_name_kh", "").strip()
            first_name_en = r.get("first_name_en", "").strip()
            last_name_en = r.get("last_name_en", "").strip()
            gender = r.get("gender", "MALE").strip().upper()
            dob_str = r.get("date_of_birth", "").strip()
            phone = r.get("phone_primary", "").strip()
            email = r.get("email_work", "").strip()
            dept_str = r.get("department_name", "").strip()
            pos_str = r.get("position_title", "").strip()
            join_str = r.get("join_date", "").strip()
            salary_str = r.get("base_salary", "0").strip()
            currency = r.get("salary_currency", "USD").strip().upper()
            emp_type = r.get("employment_type", "PERMANENT_UDC").strip().upper()
            bank_name = r.get("bank_name", "ABA Bank").strip()
            bank_acc = r.get("bank_account_number", "").strip()
            resident_str = str(r.get("is_resident_for_tax", "TRUE")).strip().upper()
            spouse_cnt_str = r.get("spouse_dependent_count", "0").strip()
            child_cnt_str = r.get("minor_children_count", "0").strip()

            if not code:
                errors_in_row.append({"row": idx, "field": "employee_code", "error": "Employee Code is required."})
            elif code in existing_codes:
                errors_in_row.append({"row": idx, "field": "employee_code", "error": f"Employee code '{code}' already exists in database."})
            elif code in seen_batch_codes:
                errors_in_row.append({"row": idx, "field": "employee_code", "error": f"Duplicate employee code '{code}' found within spreadsheet."})
            else:
                seen_batch_codes.add(code)

            if not first_name_en or not last_name_en:
                errors_in_row.append({"row": idx, "field": "first_name_en", "error": "English First and Last name are required."})
            if not first_name_kh or not last_name_kh:
                # Default to English name if Khmer not provided
                first_name_kh = first_name_kh or first_name_en
                last_name_kh = last_name_kh or last_name_en

            # Parse DOB
            try:
                dob = datetime.strptime(dob_str, "%Y-%m-%d").date() if dob_str else date(1995, 1, 1)
            except ValueError:
                errors_in_row.append({"row": idx, "field": "date_of_birth", "error": f"Invalid date format '{dob_str}'. Expected YYYY-MM-DD."})
                dob = date(1995, 1, 1)

            # Parse Join Date
            try:
                join_date = datetime.strptime(join_str, "%Y-%m-%d").date() if join_str else date.today()
            except ValueError:
                errors_in_row.append({"row": idx, "field": "join_date", "error": f"Invalid join date format '{join_str}'. Expected YYYY-MM-DD."})
                join_date = date.today()

            # Parse salary
            try:
                base_salary = Decimal(salary_str)
                if base_salary < 0:
                    errors_in_row.append({"row": idx, "field": "base_salary", "error": "Base salary cannot be negative."})
            except Exception:
                errors_in_row.append({"row": idx, "field": "base_salary", "error": f"Invalid salary number: '{salary_str}'."})
                base_salary = Decimal("0")

            # Resolve department
            dept = departments.get(dept_str.lower())
            if not dept:
                # If first department exists in company, fallback or create
                dept = list(departments.values())[0] if departments else None

            # Resolve position
            pos = positions.get(pos_str.lower())
            if not pos:
                pos = list(positions.values())[0] if positions else None

            if not dept:
                errors_in_row.append({"row": idx, "field": "department_name", "error": f"Department '{dept_str}' not found in company."})
            if not pos:
                errors_in_row.append({"row": idx, "field": "position_title", "error": f"Position '{pos_str}' not found in company."})

            if errors_in_row:
                row_errors.extend(errors_in_row)
            else:
                parsed_employees.append({
                    "company_id": company_id,
                    "employee_code": code,
                    "first_name_kh": first_name_kh,
                    "last_name_kh": last_name_kh,
                    "first_name_en": first_name_en,
                    "last_name_en": last_name_en,
                    "gender": gender if gender in ["MALE", "FEMALE", "OTHER"] else "MALE",
                    "date_of_birth": dob,
                    "phone_primary": phone or "+855 00 000 000",
                    "email_work": email or f"{code.lower()}@company.com",
                    "department_id": dept.id,
                    "position_id": pos.id,
                    "join_date": join_date,
                    "base_salary": base_salary,
                    "salary_currency": currency if currency in ["KHR", "USD"] else "USD",
                    "employment_type": emp_type if emp_type in ["PERMANENT_UDC", "FIXED_TERM_FDC", "PROBATIONARY"] else "PERMANENT_UDC",
                    "employment_status": "ACTIVE",
                    "bank_name": bank_name,
                    "bank_account_number": bank_acc,
                    "bank_account_name": f"{first_name_en} {last_name_en}",
                    "is_resident_for_tax": resident_str in ["TRUE", "1", "YES"],
                    "spouse_dependent_count": int(spouse_cnt_str) if spouse_cnt_str.isdigit() else 0,
                    "minor_children_count": int(child_cnt_str) if child_cnt_str.isdigit() else 0,
                })

        valid_count = len(parsed_employees)
        invalid_count = len(rows) - valid_count

        if dry_run or row_errors:
            return {
                "success": len(row_errors) == 0,
                "dry_run": dry_run,
                "total_rows": len(rows),
                "valid_rows": valid_count,
                "invalid_rows": invalid_count,
                "errors": row_errors,
                "preview": [
                    {
                        "employee_code": p["employee_code"],
                        "name_en": f"{p['first_name_en']} {p['last_name_en']}",
                        "name_kh": f"{p['last_name_kh']} {p['first_name_kh']}",
                        "base_salary": float(p["base_salary"]),
                        "currency": p["salary_currency"],
                        "join_date": str(p["join_date"]),
                    }
                    for p in parsed_employees[:10]
                ],
            }

        # Commit transactional insert
        created_ids = []
        for emp_data in parsed_employees:
            emp = Employee(**emp_data)
            db.add(emp)
            db.flush()
            created_ids.append(emp.id)

            # Create initial salary history
            if emp_data["base_salary"] > 0:
                sh = SalaryHistory(
                    employee_id=emp.id,
                    previous_salary=Decimal("0"),
                    new_salary=emp_data["base_salary"],
                    currency=emp_data["salary_currency"],
                    effective_date=emp_data["join_date"],
                    change_reason="Bulk Excel Onboarding",
                    approved_by_user_id=actor_user_id,
                )
                db.add(sh)

            # Create contract
            ctr = Contract(
                employee_id=emp.id,
                contract_number=f"CTR-{emp.employee_code}-01",
                contract_type="UDC" if "UDC" in emp_data["employment_type"] else "FDC",
                start_date=emp_data["join_date"],
                base_salary=emp_data["base_salary"],
                currency=emp_data["salary_currency"],
                status="ACTIVE",
            )
            db.add(ctr)

        db.commit()

        AuditService.log_event(
            db=db,
            action="BULK_IMPORT_EMPLOYEES",
            module="employee",
            entity_type="Employee",
            entity_id=created_ids[0] if created_ids else "BULK",
            user_id=actor_user_id,
            new_values={"count": len(created_ids), "codes": [p["employee_code"] for p in parsed_employees]},
        )

        return {
            "success": True,
            "dry_run": False,
            "total_rows": len(rows),
            "valid_rows": valid_count,
            "invalid_rows": 0,
            "errors": [],
            "message": f"Successfully imported and enrolled {len(created_ids)} employees into HRMS.",
        }
