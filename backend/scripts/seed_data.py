import sys
import os
from decimal import Decimal
from datetime import date, datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    Company, Branch, Department, Position,
    User, Role, Permission, UserRole, RolePermission,
    Employee, Contract,
    TaxRule, ContributionRule, Holiday
)
from app.services.payroll_engine import DEFAULT_CAMBODIA_TOS_BRACKETS


def seed_database(db_session=None):
    print("Beginning Cambodia HRMS Database Seeding...")
    db = db_session if db_session is not None else SessionLocal()
    should_close = db_session is None

    try:
        # 1. Seed Roles
        roles_data = [
            ("SUPER_ADMIN", "Super Administrator", "Full system privileges"),
            ("COMPANY_ADMIN", "Company Administrator", "Company configuration and user management"),
            ("HR_DIRECTOR", "HR Director", "Executive HR management, policies, and senior approvals"),
            ("HR_MANAGER", "HR Manager", "Day-to-day HR operational oversight and approvals"),
            ("HR_OFFICER", "HR Officer", "Employee record maintenance and document administration"),
            ("PAYROLL_OFFICER", "Payroll Officer", "Salary computation, payroll execution, and bank exports"),
            ("FINANCE_OFFICER", "Finance Officer", "Financial reconciliation and payroll final authorization"),
            ("DEPT_MANAGER", "Department Manager", "Departmental staff attendance, leave, and review approvals"),
            ("SUPERVISOR", "Supervisor", "Team attendance verification and first-level leave approval"),
            ("EMPLOYEE", "Employee", "Self-service attendance, leave requests, and personal payslips"),
            ("AUDITOR", "Auditor", "Read-only access to audit trail and historical payroll records"),
            ("READ_ONLY", "Read Only", "General read-only access with sensitive data masked"),
        ]

        roles_dict = {}
        for code, name, desc in roles_data:
            role = db.query(Role).filter(Role.code == code).first()
            if not role:
                role = Role(code=code, name=name, description=desc, is_system_role=True)
                db.add(role)
                db.flush()
            roles_dict[code] = role

        # 2. Seed Granular Permissions
        permissions_data = [
            ("organization:view", "organization", "view", "View companies and organizational chart", False),
            ("organization:create", "organization", "create", "Create companies, departments, positions", False),
            ("organization:edit", "organization", "edit", "Modify company structures", False),
            ("employee:view", "employee", "view", "View employee public profiles", False),
            ("employee:create", "employee", "create", "Onboard new employees", False),
            ("employee:edit", "employee", "edit", "Edit employee profiles", False),
            ("employee:view_sensitive", "employee", "view_sensitive", "View national IDs and confidential files", True),
            ("salary:view", "salary", "view", "View base salaries and compensation records", True),
            ("salary:manage", "salary", "manage", "Update salary structures and allowances", True),
            ("attendance:view", "attendance", "view", "View attendance records", False),
            ("attendance:manage", "attendance", "manage", "Adjust attendance and punch logs", False),
            ("leave:view", "leave", "view", "View leave requests and balances", False),
            ("leave:approve", "leave", "approve", "Approve or reject leave applications", False),
            ("overtime:view", "overtime", "view", "View overtime records", False),
            ("overtime:approve", "overtime", "approve", "Approve overtime claims", False),
            ("payroll:view", "payroll", "view", "View payroll runs and periods", True),
            ("payroll:calculate", "payroll", "calculate", "Execute payroll calculation engine", True),
            ("payroll:approve", "payroll", "approve", "Sign off and approve payroll runs", True),
            ("payroll:lock", "payroll", "lock", "Permanently lock finalized payroll periods", True),
            ("recruitment:manage", "recruitment", "manage", "Manage vacancies and candidate pipeline", False),
            ("talent:manage", "talent", "manage", "Conduct performance reviews and training logs", False),
            ("system:audit", "system", "audit", "Inspect immutable audit logs", False),
            ("system:configure", "system", "configure", "Manage system and company settings", False),
        ]

        for code, module, action, desc, is_sens in permissions_data:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(code=code, module=module, action=action, description=desc, is_sensitive=is_sens)
                db.add(perm)
                db.flush()

        db.commit()

        # Link all permissions to SUPER_ADMIN
        all_perms = db.query(Permission).all()
        for p in all_perms:
            rp = db.query(RolePermission).filter(
                RolePermission.role_id == roles_dict["SUPER_ADMIN"].id,
                RolePermission.permission_id == p.id
            ).first()
            if not rp:
                db.add(RolePermission(role_id=roles_dict["SUPER_ADMIN"].id, permission_id=p.id))

        # Link payroll permissions to PAYROLL_OFFICER
        payroll_perm_codes = ["employee:view", "salary:view", "salary:manage", "payroll:view", "payroll:calculate", "attendance:view"]
        for p in all_perms:
            if p.code in payroll_perm_codes:
                rp = db.query(RolePermission).filter(
                    RolePermission.role_id == roles_dict["PAYROLL_OFFICER"].id,
                    RolePermission.permission_id == p.id
                ).first()
                if not rp:
                    db.add(RolePermission(role_id=roles_dict["PAYROLL_OFFICER"].id, permission_id=p.id))

        # Link HR permissions to HR_MANAGER
        hr_perm_codes = ["organization:view", "employee:view", "employee:create", "employee:edit", "employee:view_sensitive", "attendance:view", "attendance:manage", "leave:view", "leave:approve", "overtime:view", "overtime:approve", "recruitment:manage", "talent:manage"]
        for p in all_perms:
            if p.code in hr_perm_codes:
                rp = db.query(RolePermission).filter(
                    RolePermission.role_id == roles_dict["HR_MANAGER"].id,
                    RolePermission.permission_id == p.id
                ).first()
                if not rp:
                    db.add(RolePermission(role_id=roles_dict["HR_MANAGER"].id, permission_id=p.id))

        db.commit()

        # 3. Seed Cambodia Demo Company
        company = db.query(Company).filter(Company.code == "CAMTECH").first()
        if not company:
            company = Company(
                code="CAMTECH",
                name_kh="ក្រុមហ៊ុន ខេមតិច សូលូសិន ឯ.ក",
                name_en="CamTech Solutions Co., Ltd.",
                legal_name="CamTech Solutions Co., Ltd.",
                tax_id_number="K008-987654321",
                nssf_number="0098765432",
                default_currency="KHR",
                secondary_currency="USD",
                timezone="Asia/Phnom_Penh",
                address="#128, Russian Federation Blvd, Sangkat Toek Laak I, Khan Toul Kork, Phnom Penh",
                phone="+855 23 999 888",
                email="info@camtech-solutions.com.kh",
                website="https://camtech-solutions.com.kh",
                is_active=True,
            )
            db.add(company)
            db.commit()
            db.refresh(company)

        # 4. Seed Departments
        dept_data = [
            ("DEP-HR", "នាយកដ្ឋានធនធានមនុស្ស", "Human Resources"),
            ("DEP-FIN", "នាយកដ្ឋានហិរញ្ញវត្ថុ", "Finance & Accounting"),
            ("DEP-ENG", "នាយកដ្ឋានវិស្វកម្មបច្ចេកវិទ្យា", "Software Engineering"),
            ("DEP-SALES", "នាយកដ្ឋានលក់ និងទីផ្សារ", "Sales & Marketing"),
            ("DEP-OPS", "នាយកដ្ឋានប្រតិបត្តិការ", "Operations"),
        ]
        dept_dict = {}
        for d_code, d_kh, d_en in dept_data:
            dept = db.query(Department).filter(Department.company_id == company.id, Department.code == d_code).first()
            if not dept:
                dept = Department(
                    company_id=company.id,
                    code=d_code,
                    name_kh=d_kh,
                    name_en=d_en,
                    is_active=True,
                )
                db.add(dept)
                db.flush()
            dept_dict[d_code] = dept

        # 5. Seed Positions
        pos_data = [
            ("POS-HRD", dept_dict["DEP-HR"].id, "ប្រធានផ្នែកធនធានមនុស្ស", "HR Director", "GRADE-E1", 1500, 3000),
            ("POS-ACC", dept_dict["DEP-FIN"].id, "គណនេយ្យករជាន់ខ្ពស់", "Senior Accountant", "GRADE-S2", 800, 1500),
            ("POS-ENG-SR", dept_dict["DEP-ENG"].id, "វិស្វករផ្នែកទន់ជាន់ខ្ពស់", "Senior Software Engineer", "GRADE-S2", 1200, 2500),
            ("POS-ENG-JR", dept_dict["DEP-ENG"].id, "វិស្វករផ្នែកទន់", "Software Engineer", "GRADE-S1", 600, 1200),
            ("POS-SALES", dept_dict["DEP-SALES"].id, "មន្ត្រីទំនាក់ទំនងលក់", "Sales Executive", "GRADE-S1", 450, 1000),
        ]
        pos_dict = {}
        for p_code, p_dept_id, p_kh, p_en, grade, min_s, max_s in pos_data:
            pos = db.query(Position).filter(Position.company_id == company.id, Position.code == p_code).first()
            if not pos:
                pos = Position(
                    company_id=company.id,
                    department_id=p_dept_id,
                    code=p_code,
                    title_kh=p_kh,
                    title_en=p_en,
                    job_grade=grade,
                    min_salary=Decimal(str(min_s)),
                    max_salary=Decimal(str(max_s)),
                    is_active=True,
                )
                db.add(pos)
                db.flush()
            pos_dict[p_code] = pos

        db.commit()

        # 6. Seed Super Admin, HR Manager, and Payroll Users
        user_specs = [
            ("admin@cambodia-hrms.com", "admin", "Admin@123456", "System Administrator", "SUPER_ADMIN", True),
            ("hrmanager@cambodia-hrms.com", "hrmanager", "Hr@123456", "Sokha Heng (HR Manager)", "HR_MANAGER", False),
            ("payroll@cambodia-hrms.com", "payrollofficer", "Payroll@123456", "Dara Chan (Payroll Officer)", "PAYROLL_OFFICER", False),
        ]
        for email, uname, pwd, fname, role_code, is_sup in user_specs:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    username=uname,
                    hashed_password=get_password_hash(pwd),
                    full_name=fname,
                    company_id=company.id,
                    is_active=True,
                    is_superuser=is_sup,
                    preferred_language="en",
                )
                db.add(user)
                db.flush()

                # Assign Role
                ur = UserRole(user_id=user.id, role_id=roles_dict[role_code].id)
                db.add(ur)

        db.commit()

        # 7. Seed Cambodia Statutory Tax & NSSF Rules
        existing_tax_rule = db.query(TaxRule).filter(TaxRule.country == "Cambodia").first()
        if not existing_tax_rule:
            tax_rule = TaxRule(
                country="Cambodia",
                name="Cambodia GDT Standard Progressive Tax on Salary",
                effective_from=date(2025, 1, 1),
                dependent_rebate_khr=Decimal("150000"),
                non_resident_flat_rate=Decimal("0.20"),
                brackets_config=[
                    {"min_khr": 0, "max_khr": 1500000, "rate": 0.00},
                    {"min_khr": 1500001, "max_khr": 2000000, "rate": 0.05},
                    {"min_khr": 2000001, "max_khr": 8500000, "rate": 0.10},
                    {"min_khr": 8500001, "max_khr": 12500000, "rate": 0.15},
                    {"min_khr": 12500001, "max_khr": None, "rate": 0.20},
                ],
                is_active=True,
            )
            db.add(tax_rule)

        # NSSF Rules (Health, Pension, Accident)
        nssf_rules = [
            ("NSSF_HEALTH", "NSSF Health Care Scheme", Decimal("0.026"), Decimal("0.00")),
            ("NSSF_PENSION", "NSSF Pension Scheme (Phase 1)", Decimal("0.020"), Decimal("0.020")),
            ("NSSF_ACCIDENT", "NSSF Occupational Risk Scheme", Decimal("0.008"), Decimal("0.00")),
        ]
        for ctype, cname, em_rate, ee_rate in nssf_rules:
            existing_crule = db.query(ContributionRule).filter(ContributionRule.contribution_type == ctype).first()
            if not existing_crule:
                crule = ContributionRule(
                    country="Cambodia",
                    name=cname,
                    contribution_type=ctype,
                    effective_from=date(2025, 1, 1),
                    employer_rate=em_rate,
                    employee_rate=ee_rate,
                    wage_floor_khr=Decimal("400000"),
                    wage_ceiling_khr=Decimal("1200000"),
                    is_active=True,
                )
                db.add(crule)

        # 8. Seed Official Cambodia Holidays 2026
        holidays_data = [
            ("ទិវាចូលឆ្នាំសកល", "International New Year's Day", date(2026, 1, 1)),
            ("ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍", "Victory over Genocide Day", date(2026, 1, 7)),
            ("ទិវានារីអន្តរជាតិ", "International Women's Day", date(2026, 3, 8)),
            ("ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", "Khmer New Year Day 1", date(2026, 4, 14)),
            ("ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", "Khmer New Year Day 2", date(2026, 4, 15)),
            ("ពិធីបុណ្យចូលឆ្នាំថ្មី ប្រពៃណីជាតិ", "Khmer New Year Day 3", date(2026, 4, 16)),
            ("ទិវាពលកម្មអន្តរជាតិ", "International Labor Day", date(2026, 5, 1)),
            ("ព្រះរាជពិធីបុណ្យច្រត់ព្រះនង្គ័ល", "Royal Plowing Ceremony", date(2026, 5, 5)),
            ("ពិធីបុណ្យភ្ជុំបិណ្ឌ", "Pchum Ben Day 1", date(2026, 10, 10)),
            ("ពិធីបុណ្យភ្ជុំបិណ្ឌ", "Pchum Ben Day 2", date(2026, 10, 11)),
            ("ពិធីបុណ្យភ្ជុំបិណ្ឌ", "Pchum Ben Day 3", date(2026, 10, 12)),
            ("ទិវាបុណ្យឯករាជ្យជាតិ", "National Independence Day", date(2026, 11, 9)),
        ]
        for h_kh, h_en, h_date in holidays_data:
            existing_hol = db.query(Holiday).filter(Holiday.date == h_date).first()
            if not existing_hol:
                hol = Holiday(
                    company_id=company.id,
                    name_kh=h_kh,
                    name_en=h_en,
                    date=h_date,
                    year=h_date.year,
                    is_paid=True,
                    holiday_type="GOVERNMENT",
                )
                db.add(hol)

        # 9. Seed Initial Diverse Employee Profiles for Testing
        employees_seed = [
            {
                "code": "EMP-001",
                "fn_kh": "សុខា", "ln_kh": "ហេង",
                "fn_en": "Sokha", "ln_en": "Heng",
                "gender": "FEMALE", "dob": date(1988, 5, 12),
                "phone": "012345678", "email": "sokha.heng@camtech-solutions.com.kh",
                "dept": dept_dict["DEP-HR"].id, "pos": pos_dict["POS-HRD"].id,
                "join": date(2023, 1, 15), "salary": 2200.00, "curr": "USD",
                "spouse": 1, "child": 2, "tax_res": True,
            },
            {
                "code": "EMP-002",
                "fn_kh": "ដារ៉ា", "ln_kh": "ចាន់",
                "fn_en": "Dara", "ln_en": "Chan",
                "gender": "MALE", "dob": date(1992, 8, 20),
                "phone": "098765432", "email": "dara.chan@camtech-solutions.com.kh",
                "dept": dept_dict["DEP-FIN"].id, "pos": pos_dict["POS-ACC"].id,
                "join": date(2023, 3, 1), "salary": 1100.00, "curr": "USD",
                "spouse": 0, "child": 1, "tax_res": True,
            },
            {
                "code": "EMP-003",
                "fn_kh": "វិសាល", "ln_kh": "កែវ",
                "fn_en": "Visal", "ln_en": "Keo",
                "gender": "MALE", "dob": date(1995, 11, 4),
                "phone": "077123456", "email": "visal.keo@camtech-solutions.com.kh",
                "dept": dept_dict["DEP-ENG"].id, "pos": pos_dict["POS-ENG-SR"].id,
                "join": date(2023, 6, 1), "salary": 1800.00, "curr": "USD",
                "spouse": 1, "child": 0, "tax_res": True,
            },
            {
                "code": "EMP-004",
                "fn_kh": "រតនា", "ln_kh": "សោម",
                "fn_en": "Rathana", "ln_en": "Som",
                "gender": "FEMALE", "dob": date(1998, 2, 17),
                "phone": "089887766", "email": "rathana.som@camtech-solutions.com.kh",
                "dept": dept_dict["DEP-ENG"].id, "pos": pos_dict["POS-ENG-JR"].id,
                "join": date(2024, 2, 1), "salary": 3200000.00, "curr": "KHR",  # KHR Salary
                "spouse": 0, "child": 0, "tax_res": True,
            },
            {
                "code": "EMP-005",
                "fn_kh": "បូរ៉ា", "ln_kh": "ទេព",
                "fn_en": "Bora", "ln_en": "Tep",
                "gender": "MALE", "dob": date(1996, 9, 30),
                "phone": "010998877", "email": "bora.tep@camtech-solutions.com.kh",
                "dept": dept_dict["DEP-SALES"].id, "pos": pos_dict["POS-SALES"].id,
                "join": date(2024, 5, 10), "salary": 650.00, "curr": "USD",
                "spouse": 0, "child": 0, "tax_res": True,
            }
        ]

        for ed in employees_seed:
            emp = db.query(Employee).filter(Employee.company_id == company.id, Employee.employee_code == ed["code"]).first()
            if not emp:
                emp = Employee(
                    company_id=company.id,
                    employee_code=ed["code"],
                    first_name_kh=ed["fn_kh"],
                    last_name_kh=ed["ln_kh"],
                    first_name_en=ed["fn_en"],
                    last_name_en=ed["ln_en"],
                    gender=ed["gender"],
                    date_of_birth=ed["dob"],
                    nationality="Cambodian",
                    marital_status="MARRIED" if ed["spouse"] > 0 else "SINGLE",
                    phone_primary=ed["phone"],
                    email_work=ed["email"],
                    department_id=ed["dept"],
                    position_id=ed["pos"],
                    join_date=ed["join"],
                    employment_status="ACTIVE",
                    employment_type="PERMANENT_UDC",
                    base_salary=Decimal(str(ed["salary"])),
                    salary_currency=ed["curr"],
                    payment_method="BANK_TRANSFER",
                    bank_name="ABA Bank",
                    bank_account_number="001 234 567",
                    bank_account_name=f"{ed['ln_en'].upper()} {ed['fn_en'].upper()}",
                    is_resident_for_tax=ed["tax_res"],
                    spouse_dependent_count=ed["spouse"],
                    minor_children_count=ed["child"],
                )
                db.add(emp)
                db.flush()

                # Contract
                contract = Contract(
                    employee_id=emp.id,
                    contract_number=f"CTR-{emp.employee_code}",
                    contract_type="UDC",
                    start_date=emp.join_date,
                    base_salary=emp.base_salary,
                    currency=emp.salary_currency,
                    status="ACTIVE",
                )
                db.add(contract)

        db.commit()
        print("Seeding completed successfully! Sample data and statutory rules are ready.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
