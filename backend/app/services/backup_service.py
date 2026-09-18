"""
Backup and Data Export Service for Cambodia Enterprise HRMS.
Provides full database backups in multi-sheet Microsoft Excel (.xlsx) and
RFC-4180 CSV / ZIP archive formats with Khmer Unicode UTF-8 BOM encoding.
"""

import io
import csv
import zipfile
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from decimal import Decimal

from sqlalchemy.orm import Session
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.models.employee import Employee
from app.models.company import Department, Position, Branch, Company
from app.models.attendance import AttendanceRecord
from app.models.leave import LeaveRequest, LeaveType
from app.models.payroll import PayrollRun, PayrollItem, PayrollPeriod
from app.models.system import AuditLog, SystemSetting


class BackupService:
    @staticmethod
    def _format_value(val: Any) -> Any:
        """Formats dates, times, decimals, and booleans for export."""
        if val is None:
            return ""
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        if isinstance(val, Decimal):
            return float(val)
        if isinstance(val, bool):
            return "Yes" if val else "No"
        return str(val)

    @classmethod
    def get_employees_data(cls, db: Session) -> Dict[str, Any]:
        records = db.query(Employee).order_by(Employee.employee_code.asc()).all()
        departments = {d.id: d.name_en for d in db.query(Department).all()}
        positions = {p.id: p.title_en for p in db.query(Position).all()}

        headers = [
            "Employee Code",
            "Name (Khmer)",
            "Name (English)",
            "Gender",
            "Date of Birth",
            "Nationality",
            "Marital Status",
            "Phone Primary",
            "Work Email",
            "Department",
            "Position",
            "Join Date",
            "Employment Status",
            "Employment Type",
            "Base Salary",
            "Currency",
            "Bank Name",
            "Bank Account",
            "National ID",
            "NSSF Card",
        ]

        rows = []
        for emp in records:
            rows.append([
                emp.employee_code or "",
                f"{emp.last_name_kh} {emp.first_name_kh}",
                f"{emp.first_name_en} {emp.last_name_en}",
                emp.gender or "",
                emp.date_of_birth.isoformat() if emp.date_of_birth else "",
                emp.nationality or "Cambodian",
                emp.marital_status or "SINGLE",
                emp.phone_primary or "",
                emp.email_work or "",
                departments.get(emp.department_id, "N/A"),
                positions.get(emp.position_id, "N/A"),
                emp.join_date.isoformat() if emp.join_date else "",
                emp.employment_status or "ACTIVE",
                emp.employment_type or "PERMANENT_UDC",
                float(emp.base_salary) if emp.base_salary is not None else 0.0,
                emp.salary_currency or "USD",
                emp.bank_name or "",
                emp.bank_account_number or "",
                emp.national_id_number or "",
                emp.nssf_card_number or "",
            ])
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_departments_data(cls, db: Session) -> Dict[str, Any]:
        records = db.query(Department).order_by(Department.code.asc()).all()
        headers = [
            "Department Code",
            "Name (Khmer)",
            "Name (English)",
            "Description",
            "Manager Employee ID",
            "Active",
        ]
        rows = [
            [
                d.code or "",
                d.name_kh or "",
                d.name_en or "",
                d.description or "",
                d.manager_employee_id or "",
                "Yes" if d.is_active else "No",
            ]
            for d in records
        ]
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_positions_data(cls, db: Session) -> Dict[str, Any]:
        records = db.query(Position).order_by(Position.code.asc()).all()
        departments = {d.id: d.name_en for d in db.query(Department).all()}
        headers = [
            "Position Code",
            "Title (Khmer)",
            "Title (English)",
            "Department",
            "Job Grade",
            "Min Salary",
            "Max Salary",
            "Headcount Budget",
            "Active",
        ]
        rows = [
            [
                p.code or "",
                p.title_kh or "",
                p.title_en or "",
                departments.get(p.department_id, "N/A"),
                p.job_grade or "N/A",
                float(p.min_salary) if p.min_salary is not None else "",
                float(p.max_salary) if p.max_salary is not None else "",
                p.headcount_budget or 1,
                "Yes" if p.is_active else "No",
            ]
            for p in records
        ]
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_attendance_data(cls, db: Session) -> Dict[str, Any]:
        records = (
            db.query(AttendanceRecord, Employee)
            .join(Employee, Employee.id == AttendanceRecord.employee_id)
            .order_by(AttendanceRecord.date.desc())
            .limit(5000)
            .all()
        )
        headers = [
            "Date",
            "Employee Code",
            "Employee Name",
            "Check-In Time",
            "Check-Out Time",
            "Late (Minutes)",
            "Early Departure (Minutes)",
            "Total Work Hours",
            "Status",
            "Source",
            "Notes",
        ]
        rows = []
        for att, emp in records:
            rows.append([
                att.date.isoformat() if att.date else "",
                emp.employee_code,
                f"{emp.first_name_en} {emp.last_name_en}",
                att.check_in_time.strftime("%H:%M:%S") if att.check_in_time else "",
                att.check_out_time.strftime("%H:%M:%S") if att.check_out_time else "",
                att.late_minutes or 0,
                att.early_departure_minutes or 0,
                float(att.total_work_hours) if att.total_work_hours is not None else 0.0,
                att.status or "PRESENT",
                att.source or "WEB",
                att.notes or "",
            ])
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_leave_data(cls, db: Session) -> Dict[str, Any]:
        records = (
            db.query(LeaveRequest, Employee, LeaveType)
            .join(Employee, Employee.id == LeaveRequest.employee_id)
            .join(LeaveType, LeaveType.id == LeaveRequest.leave_type_id)
            .order_by(LeaveRequest.created_at.desc())
            .all()
        )
        headers = [
            "Employee Code",
            "Employee Name",
            "Leave Type",
            "Start Date",
            "End Date",
            "Total Days",
            "Status",
            "Reason",
            "Created At",
        ]
        rows = []
        for req, emp, lt in records:
            rows.append([
                emp.employee_code,
                f"{emp.first_name_en} {emp.last_name_en}",
                lt.name_en,
                req.start_date.isoformat() if req.start_date else "",
                req.end_date.isoformat() if req.end_date else "",
                float(req.total_days) if req.total_days is not None else 0.0,
                req.status or "PENDING",
                req.reason or "",
                req.created_at.isoformat() if req.created_at else "",
            ])
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_payroll_data(cls, db: Session) -> Dict[str, Any]:
        records = (
            db.query(PayrollItem, Employee, PayrollRun, PayrollPeriod)
            .join(Employee, Employee.id == PayrollItem.employee_id)
            .join(PayrollRun, PayrollRun.id == PayrollItem.payroll_run_id)
            .join(PayrollPeriod, PayrollPeriod.id == PayrollRun.payroll_period_id)
            .order_by(PayrollRun.calculated_at.desc())
            .all()
        )
        headers = [
            "Period Name",
            "Employee Code",
            "Employee Name",
            "Contract Base Salary",
            "Currency",
            "Gross Salary (KHR)",
            "NSSF Pension Emp (KHR)",
            "Tax on Salary (KHR)",
            "Net Salary (KHR)",
            "Exchange Rate (USD->KHR)",
        ]
        rows = []
        for item, emp, run, period in records:
            rows.append([
                period.name,
                emp.employee_code,
                f"{emp.first_name_en} {emp.last_name_en}",
                float(item.base_salary_contract) if item.base_salary_contract is not None else 0.0,
                item.currency_contract,
                float(item.gross_salary_khr) if item.gross_salary_khr is not None else 0.0,
                float(item.nssf_pension_employee_khr) if item.nssf_pension_employee_khr is not None else 0.0,
                float(item.tax_on_salary_khr) if item.tax_on_salary_khr is not None else 0.0,
                float(item.net_salary_khr) if item.net_salary_khr is not None else 0.0,
                float(run.exchange_rate_usd_to_khr) if run.exchange_rate_usd_to_khr is not None else 4100.0,
            ])
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_audit_logs_data(cls, db: Session) -> Dict[str, Any]:
        records = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(2000).all()
        headers = [
            "Timestamp",
            "User ID",
            "Action",
            "Module",
            "Entity Type",
            "Entity ID",
            "IP Address",
        ]
        rows = [
            [
                log.created_at.isoformat() if log.created_at else "",
                log.user_id or "System",
                log.action or "",
                log.module or "",
                log.entity_type or "",
                log.entity_id or "",
                log.ip_address or "",
            ]
            for log in records
        ]
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_settings_data(cls, db: Session) -> Dict[str, Any]:
        records = db.query(SystemSetting).order_by(SystemSetting.category.asc(), SystemSetting.key.asc()).all()
        headers = [
            "Category",
            "Key",
            "Value",
            "Description",
        ]
        rows = [
            [
                s.category or "general",
                s.key or "",
                cls._format_value(s.value),
                s.description or "",
            ]
            for s in records
        ]
        return {"headers": headers, "rows": rows}

    @classmethod
    def get_table_data(cls, db: Session, table: str) -> Dict[str, Any]:
        """Maps table identifier to its dataset."""
        mapping = {
            "employees": cls.get_employees_data,
            "departments": cls.get_departments_data,
            "positions": cls.get_positions_data,
            "attendance": cls.get_attendance_data,
            "leave": cls.get_leave_data,
            "payroll": cls.get_payroll_data,
            "audit_logs": cls.get_audit_logs_data,
            "settings": cls.get_settings_data,
        }
        getter = mapping.get(table.lower().strip())
        if getter:
            return getter(db)
        # Default fallback
        return cls.get_employees_data(db)

    @classmethod
    def generate_excel_backup(cls, db: Session) -> bytes:
        """
        Generates a comprehensive multi-sheet Excel (.xlsx) workbook
        with enterprise styling, blue headers, borders, and auto-width columns.
        """
        wb = Workbook()
        # Remove default sheet
        wb.remove(wb.active)

        sheets_config = [
            ("Employees", cls.get_employees_data(db)),
            ("Departments", cls.get_departments_data(db)),
            ("Positions", cls.get_positions_data(db)),
            ("Attendance", cls.get_attendance_data(db)),
            ("Leave Requests", cls.get_leave_data(db)),
            ("Payroll Ledger", cls.get_payroll_data(db)),
            ("Audit Logs", cls.get_audit_logs_data(db)),
            ("System Settings", cls.get_settings_data(db)),
        ]

        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

        data_font = Font(name="Calibri", size=10)
        thin_border = Border(
            left=Side(style="thin", color="E5E7EB"),
            right=Side(style="thin", color="E5E7EB"),
            top=Side(style="thin", color="E5E7EB"),
            bottom=Side(style="thin", color="E5E7EB"),
        )

        for sheet_title, data in sheets_config:
            ws = wb.create_sheet(title=sheet_title)
            ws.views.sheetView[0].showGridLines = True

            headers = data["headers"]
            rows = data["rows"]

            # Write header
            ws.append(headers)
            for col_idx in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_idx)
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = header_align
                cell.border = thin_border
            ws.row_dimensions[1].height = 26

            # Write data rows
            for r_idx, row in enumerate(rows, start=2):
                ws.append(row)
                ws.row_dimensions[r_idx].height = 20
                for c_idx in range(1, len(row) + 1):
                    c = ws.cell(row=r_idx, column=c_idx)
                    c.font = data_font
                    c.border = thin_border
                    # Right-align numeric columns
                    if isinstance(c.value, (int, float)):
                        c.alignment = Alignment(horizontal="right", vertical="center")
                    else:
                        c.alignment = Alignment(horizontal="left", vertical="center")

            # Adjust column widths automatically
            for col in ws.columns:
                max_len = 0
                col_letter = get_column_letter(col[0].column)
                for cell in col:
                    val_str = str(cell.value or "")
                    max_len = max(max_len, len(val_str))
                ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output.getvalue()

    @classmethod
    def generate_csv_data(cls, db: Session, table: str) -> str:
        """
        Generates standard RFC-4180 CSV with UTF-8 BOM (\ufeff)
        so Khmer script renders without corruption in Microsoft Excel.
        """
        data = cls.get_table_data(db, table)
        string_io = io.StringIO()
        # Prepend UTF-8 BOM
        string_io.write("\ufeff")
        writer = csv.writer(string_io, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(data["headers"])
        for row in data["rows"]:
            writer.writerow([cls._format_value(v) for v in row])
        return string_io.getvalue()

    @classmethod
    def generate_csv_zip_backup(cls, db: Session) -> bytes:
        """
        Packages all system data tables into individual UTF-8 BOM CSV files
        inside a compressed .zip archive.
        """
        tables = [
            ("employees.csv", "employees"),
            ("departments.csv", "departments"),
            ("positions.csv", "positions"),
            ("attendance_records.csv", "attendance"),
            ("leave_requests.csv", "leave"),
            ("payroll_ledger.csv", "payroll"),
            ("audit_logs.csv", "audit_logs"),
            ("system_settings.csv", "settings"),
        ]

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for filename, tbl in tables:
                csv_content = cls.generate_csv_data(db, tbl)
                # UTF-8 BOM string encoded to bytes
                zf.writestr(filename, csv_content.encode("utf-8-sig"))

        zip_buffer.seek(0)
        return zip_buffer.getvalue()
