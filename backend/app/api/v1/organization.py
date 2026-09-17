from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_permission
from app.models.company import Company, Branch, Department, Position
from app.models.employee import Employee
from app.schemas.company import CompanyCreate, CompanyOut, DepartmentCreate, DepartmentOut, PositionCreate, PositionOut
from app.schemas.common import APIResponse

router = APIRouter()


# Company Endpoints
@router.get("/companies", response_model=APIResponse[List[CompanyOut]])
def list_companies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    companies = db.query(Company).filter(Company.is_deleted == False).all()
    return APIResponse(data=companies, message="Companies retrieved")


@router.post("/companies", response_model=APIResponse[CompanyOut])
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:create"))
):
    existing = db.query(Company).filter(Company.code == data.code, Company.is_deleted == False).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Company with code '{data.code}' already exists.")
    
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return APIResponse(data=company, message="Company created successfully")


# Department Endpoints
@router.get("/departments", response_model=APIResponse[List[DepartmentOut]])
def list_departments(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Department).filter(Department.is_deleted == False)
    if company_id:
        query = query.filter(Department.company_id == company_id)
    departments = query.all()
    return APIResponse(data=departments, message="Departments retrieved")


@router.post("/departments", response_model=APIResponse[DepartmentOut])
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:create"))
):
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return APIResponse(data=dept, message="Department created successfully")


# Position Endpoints
@router.get("/positions", response_model=APIResponse[List[PositionOut]])
def list_positions(
    company_id: Optional[str] = None,
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Position).filter(Position.is_deleted == False)
    if company_id:
        query = query.filter(Position.company_id == company_id)
    if department_id:
        query = query.filter(Position.department_id == department_id)
    positions = query.all()
    return APIResponse(data=positions, message="Positions retrieved")


@router.post("/positions", response_model=APIResponse[PositionOut])
def create_position(
    data: PositionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("organization:create"))
):
    pos = Position(**data.model_dump())
    db.add(pos)
    db.commit()
    db.refresh(pos)
    return APIResponse(data=pos, message="Position created successfully")


# Organization Tree Endpoint
@router.get("/tree", response_model=APIResponse[List[dict]])
def get_organization_tree(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Returns full organization hierarchy tree for visual org-chart rendering."""
    target_company = db.query(Company).filter(Company.is_deleted == False)
    if company_id:
        target_company = target_company.filter(Company.id == company_id)
    companies = target_company.all()

    result = []
    for comp in companies:
        comp_node = {
            "id": comp.id,
            "name": comp.name_en,
            "name_kh": comp.name_kh,
            "type": "COMPANY",
            "departments": []
        }
        departments = db.query(Department).filter(
            Department.company_id == comp.id,
            Department.is_deleted == False,
            Department.parent_id == None
        ).all()
        for dept in departments:
            positions = db.query(Position).filter(
                Position.department_id == dept.id,
                Position.is_deleted == False
            ).all()
            comp_node["departments"].append({
                "id": dept.id,
                "name": dept.name_en,
                "name_kh": dept.name_kh,
                "positions": [
                    {"id": p.id, "title": p.title_en, "title_kh": p.title_kh, "headcount": p.headcount_budget}
                    for p in positions
                ]
            })
        result.append(comp_node)

    return APIResponse(data=result, message="Organization hierarchy retrieved")


# Interactive Reporting Hierarchy Chart Endpoint
@router.get("/hierarchy-chart", response_model=APIResponse[List[dict]])
def get_hierarchy_chart(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns recursive reporting hierarchy starting from top executive leaders (CEO / Directors)
    down through direct report lines for interactive visual org-chart rendering.
    """
    emp_query = db.query(Employee).filter(
        Employee.is_deleted == False,
        Employee.employment_status.in_(["ACTIVE", "PROBATION", "CONFIRMED"])
    )
    if company_id:
        emp_query = emp_query.filter(Employee.company_id == company_id)
    employees = emp_query.all()

    # Map employees by ID and by manager_id
    emp_map = {e.id: e for e in employees}
    by_manager = {}
    for e in employees:
        m_id = e.manager_id
        if m_id not in by_manager:
            by_manager[m_id] = []
        by_manager[m_id].append(e)

    # Roots: employees with no manager_id, or whose manager is not in active employees
    root_emps = [e for e in employees if not e.manager_id or e.manager_id not in emp_map]

    # If all employees have valid non-null manager_ids, pick the first employee as root
    if not root_emps and employees:
        root_emps = [employees[0]]

    visited = set()

    def build_node(emp: Employee) -> dict:
        visited.add(emp.id)
        children_emps = [c for c in by_manager.get(emp.id, []) if c.id not in visited]
        child_nodes = [build_node(c) for c in children_emps]

        pos_title_en = emp.position.title_en if emp.position else "Staff"
        pos_title_kh = emp.position.title_kh if emp.position else "បុគ្គលិក"
        dept_name_en = emp.department.name_en if emp.department else "General"
        dept_name_kh = emp.department.name_kh if emp.department else "ទូទៅ"

        total_subordinates = len(child_nodes) + sum(c.get("total_subordinates_count", 0) for c in child_nodes)

        return {
            "id": emp.id,
            "employee_code": emp.employee_code,
            "name_en": f"{emp.first_name_en} {emp.last_name_en}",
            "name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "gender": emp.gender,
            "email": emp.email_work or emp.email_personal,
            "phone": emp.phone_primary,
            "position_title_en": pos_title_en,
            "position_title_kh": pos_title_kh,
            "department_name_en": dept_name_en,
            "department_name_kh": dept_name_kh,
            "employment_type": emp.employment_type,
            "profile_photo_url": emp.profile_photo_url,
            "base_salary": float(emp.base_salary) if emp.base_salary else 0.0,
            "salary_currency": emp.salary_currency,
            "direct_reports_count": len(child_nodes),
            "total_subordinates_count": total_subordinates,
            "children": child_nodes,
        }

    chart_tree = [build_node(root) for root in root_emps]

    # Fallback if DB has no employees yet: provide standard organization sample tree
    if not chart_tree:
        chart_tree = [
            {
                "id": "sample-ceo",
                "employee_code": "EXEC-001",
                "name_en": "Channarith Seng",
                "name_kh": "សេង ច័ន្ទណារិទ្ធ",
                "gender": "MALE",
                "email": "c.seng@camtech.com.kh",
                "phone": "+855 12 900 100",
                "position_title_en": "Chief Executive Officer (CEO)",
                "position_title_kh": "នាយកប្រតិបត្តិ",
                "department_name_en": "Executive Board",
                "department_name_kh": "ក្រុមប្រឹក្សាភិបាល",
                "employment_type": "PERMANENT_UDC",
                "profile_photo_url": None,
                "base_salary": 5000.0,
                "salary_currency": "USD",
                "direct_reports_count": 3,
                "total_subordinates_count": 8,
                "children": [
                    {
                        "id": "sample-hrd",
                        "employee_code": "EMP-001",
                        "name_en": "Sokha Heng",
                        "name_kh": "ហេង សុខា",
                        "gender": "FEMALE",
                        "email": "sokha.heng@camtech.com.kh",
                        "phone": "+855 12 345 678",
                        "position_title_en": "HR Director",
                        "position_title_kh": "ប្រធានផ្នែកធនធានមនុស្ស",
                        "department_name_en": "Human Resources",
                        "department_name_kh": "នាយកដ្ឋានធនធានមនុស្ស",
                        "employment_type": "PERMANENT_UDC",
                        "profile_photo_url": None,
                        "base_salary": 2200.0,
                        "salary_currency": "USD",
                        "direct_reports_count": 2,
                        "total_subordinates_count": 2,
                        "children": [
                            {
                                "id": "sample-hro1",
                                "employee_code": "EMP-005",
                                "name_en": "Dara Vong",
                                "name_kh": "វង្ស ដារ៉ា",
                                "gender": "MALE",
                                "email": "dara.vong@camtech.com.kh",
                                "phone": "+855 12 789 012",
                                "position_title_en": "HR Officer (Talent)",
                                "position_title_kh": "មន្ត្រីធនធានមនុស្ស",
                                "department_name_en": "Human Resources",
                                "department_name_kh": "នាយកដ្ឋានធនធានមនុស្ស",
                                "employment_type": "PERMANENT_UDC",
                                "profile_photo_url": None,
                                "base_salary": 750.0,
                                "salary_currency": "USD",
                                "direct_reports_count": 0,
                                "total_subordinates_count": 0,
                                "children": [],
                            },
                            {
                                "id": "sample-hro2",
                                "employee_code": "EMP-006",
                                "name_en": "Neary Chea",
                                "name_kh": "ជា នារី",
                                "gender": "FEMALE",
                                "email": "neary.chea@camtech.com.kh",
                                "phone": "+855 12 456 123",
                                "position_title_en": "Payroll Specialist",
                                "position_title_kh": "ជំនាញការប្រាក់បៀវត្ស",
                                "department_name_en": "Human Resources",
                                "department_name_kh": "នាយកដ្ឋានធនធានមនុស្ស",
                                "employment_type": "PERMANENT_UDC",
                                "profile_photo_url": None,
                                "base_salary": 800.0,
                                "salary_currency": "USD",
                                "direct_reports_count": 0,
                                "total_subordinates_count": 0,
                                "children": [],
                            }
                        ]
                    },
                    {
                        "id": "sample-engd",
                        "employee_code": "EMP-002",
                        "name_en": "Bopha Chan",
                        "name_kh": "ចាន់ បុប្ផា",
                        "gender": "FEMALE",
                        "email": "bopha.chan@camtech.com.kh",
                        "phone": "+855 98 765 432",
                        "position_title_en": "Engineering Lead",
                        "position_title_kh": "ប្រធានក្រុមវិស្វកម្ម",
                        "department_name_en": "Software Engineering",
                        "department_name_kh": "នាយកដ្ឋានវិស្វកម្មបច្ចេកវិទ្យា",
                        "employment_type": "PERMANENT_UDC",
                        "profile_photo_url": None,
                        "base_salary": 2500.0,
                        "salary_currency": "USD",
                        "direct_reports_count": 2,
                        "total_subordinates_count": 2,
                        "children": [
                            {
                                "id": "sample-eng1",
                                "employee_code": "EMP-007",
                                "name_en": "Rithy Sovann",
                                "name_kh": "សុវណ្ណ រិទ្ធី",
                                "gender": "MALE",
                                "email": "rithy.s@camtech.com.kh",
                                "phone": "+855 77 112 233",
                                "position_title_en": "Senior Software Engineer",
                                "position_title_kh": "វិស្វករផ្នែកទន់ជាន់ខ្ពស់",
                                "department_name_en": "Software Engineering",
                                "department_name_kh": "នាយកដ្ឋានវិស្វកម្មបច្ចេកវិទ្យា",
                                "employment_type": "PERMANENT_UDC",
                                "profile_photo_url": None,
                                "base_salary": 1600.0,
                                "salary_currency": "USD",
                                "direct_reports_count": 0,
                                "total_subordinates_count": 0,
                                "children": [],
                            },
                            {
                                "id": "sample-eng2",
                                "employee_code": "EMP-008",
                                "name_en": "Sreymom Pich",
                                "name_kh": "ពេជ្រ ស្រីមុំ",
                                "gender": "FEMALE",
                                "email": "sreymom.p@camtech.com.kh",
                                "phone": "+855 88 334 455",
                                "position_title_en": "QA Automation Engineer",
                                "position_title_kh": "វិស្វករត្រួតពិនិត្យគុណភាព",
                                "department_name_en": "Software Engineering",
                                "department_name_kh": "នាយកដ្ឋានវិស្វកម្មបច្ចេកវិទ្យា",
                                "employment_type": "PERMANENT_UDC",
                                "profile_photo_url": None,
                                "base_salary": 1100.0,
                                "salary_currency": "USD",
                                "direct_reports_count": 0,
                                "total_subordinates_count": 0,
                                "children": [],
                            }
                        ]
                    },
                    {
                        "id": "sample-find",
                        "employee_code": "EMP-003",
                        "name_en": "Visal Mao",
                        "name_kh": "ម៉ៅ វិសាល",
                        "gender": "MALE",
                        "email": "visal.mao@camtech.com.kh",
                        "phone": "+855 10 556 677",
                        "position_title_en": "Finance Director",
                        "position_title_kh": "ប្រធានផ្នែកហិរញ្ញវត្ថុ",
                        "department_name_en": "Finance & Accounting",
                        "department_name_kh": "នាយកដ្ឋានហិរញ្ញវត្ថុ",
                        "employment_type": "PERMANENT_UDC",
                        "profile_photo_url": None,
                        "base_salary": 2400.0,
                        "salary_currency": "USD",
                        "direct_reports_count": 1,
                        "total_subordinates_count": 1,
                        "children": [
                            {
                                "id": "sample-acc",
                                "employee_code": "EMP-009",
                                "name_en": "Kosol Keo",
                                "name_kh": "កែវ កុសល",
                                "gender": "MALE",
                                "email": "kosol.keo@camtech.com.kh",
                                "phone": "+855 12 667 788",
                                "position_title_en": "Senior Accountant",
                                "position_title_kh": "គណនេយ្យករជាន់ខ្ពស់",
                                "department_name_en": "Finance & Accounting",
                                "department_name_kh": "នាយកដ្ឋានហិរញ្ញវត្ថុ",
                                "employment_type": "PERMANENT_UDC",
                                "profile_photo_url": None,
                                "base_salary": 1200.0,
                                "salary_currency": "USD",
                                "direct_reports_count": 0,
                                "total_subordinates_count": 0,
                                "children": [],
                            }
                        ]
                    }
                ]
            }
        ]

    return APIResponse(data=chart_tree, message="Organizational hierarchy chart retrieved successfully")


# Headcount & Compensation Budgeting Analysis Endpoint
@router.get("/budget-analysis", response_model=APIResponse[dict])
def get_budget_analysis(
    company_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Computes comprehensive department headcount utilization, salary spend burden,
    open vacancies, and checks for salary band compliance across all positions.
    """
    dept_query = db.query(Department).filter(Department.is_deleted == False)
    if company_id:
        dept_query = dept_query.filter(Department.company_id == company_id)
    departments = dept_query.all()

    active_employees = (
        db.query(Employee)
        .filter(
            Employee.is_deleted == False,
            Employee.employment_status.in_(["ACTIVE", "PROBATION", "CONFIRMED"]),
        )
        .all()
    )

    # Group employees by department_id
    dept_emps_map = {}
    for emp in active_employees:
        dept_emps_map.setdefault(emp.department_id, []).append(emp)

    dept_metrics = []
    total_approved = 0
    total_actual = 0
    total_budget_usd = Decimal("0.00")
    total_burden_usd = Decimal("0.00")
    all_violations = []

    for dept in departments:
        positions = (
            db.query(Position)
            .filter(Position.department_id == dept.id, Position.is_deleted == False)
            .all()
        )
        dept_approved = sum(p.headcount_budget for p in positions)
        dept_active_emps = dept_emps_map.get(dept.id, [])
        dept_actual = len(dept_active_emps)

        total_approved += dept_approved
        total_actual += dept_actual

        dept_budget = Decimal("0.00")
        for p in positions:
            min_s = p.min_salary or Decimal("500")
            max_s = p.max_salary or Decimal("1000")
            midpoint = (min_s + max_s) / Decimal("2")
            dept_budget += midpoint * Decimal(str(p.headcount_budget))

        # Actual salary burden (assuming standard 4100 KHR/USD)
        dept_burden = Decimal("0.00")
        pos_map = {p.id: p for p in positions}

        dept_violations = []
        for emp in dept_active_emps:
            sal = emp.base_salary or Decimal("0.00")
            sal_usd = (sal / Decimal("4100")) if emp.salary_currency == "KHR" else sal
            dept_burden += sal_usd

            pos = pos_map.get(emp.position_id)
            if pos and pos.min_salary and pos.max_salary:
                # Check band
                if sal_usd < pos.min_salary:
                    dept_violations.append({
                        "employee_id": emp.id,
                        "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
                        "position": pos.title_en,
                        "current_salary_usd": float(sal_usd),
                        "band_min": float(pos.min_salary),
                        "band_max": float(pos.max_salary),
                        "violation_type": "BELOW_BAND_MINIMUM",
                    })
                elif sal_usd > pos.max_salary:
                    dept_violations.append({
                        "employee_id": emp.id,
                        "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
                        "position": pos.title_en,
                        "current_salary_usd": float(sal_usd),
                        "band_min": float(pos.min_salary),
                        "band_max": float(pos.max_salary),
                        "violation_type": "ABOVE_BAND_MAXIMUM",
                    })

        all_violations.extend(dept_violations)
        total_budget_usd += dept_budget
        total_burden_usd += dept_burden

        vacancies = max(0, dept_approved - dept_actual)
        utilization = round((dept_actual / dept_approved * 100), 1) if dept_approved > 0 else 100.0

        if dept_actual > dept_approved:
            dept_status = "OVER_BUDGET"
        elif dept_actual == dept_approved:
            dept_status = "OPTIMAL"
        else:
            dept_status = "UNDER_STAFFED"

        dept_metrics.append({
            "department_id": dept.id,
            "code": dept.code,
            "name_en": dept.name_en,
            "name_kh": dept.name_kh,
            "approved_headcount": dept_approved,
            "actual_headcount": dept_actual,
            "vacancies": vacancies,
            "utilization_pct": utilization,
            "status": dept_status,
            "monthly_budget_usd": float(dept_budget.quantize(Decimal("0.01"))),
            "actual_burden_usd": float(dept_burden.quantize(Decimal("0.01"))),
            "variance_usd": float((dept_burden - dept_budget).quantize(Decimal("0.01"))),
            "salary_band_violations": dept_violations,
            "positions_count": len(positions),
        })

    total_vacancies = max(0, total_approved - total_actual)
    overall_utilization = round((total_actual / total_approved * 100), 1) if total_approved > 0 else 100.0

    analysis_data = {
        "company_summary": {
            "total_approved_headcount": total_approved,
            "total_active_headcount": total_actual,
            "total_vacancies": total_vacancies,
            "overall_utilization_pct": overall_utilization,
            "total_monthly_budget_usd": float(total_budget_usd.quantize(Decimal("0.01"))),
            "total_actual_burden_usd": float(total_burden_usd.quantize(Decimal("0.01"))),
            "total_variance_usd": float((total_burden_usd - total_budget_usd).quantize(Decimal("0.01"))),
            "total_salary_band_violations": len(all_violations),
        },
        "departments": dept_metrics,
        "salary_band_violations": all_violations,
    }

    return APIResponse(data=analysis_data, message="Headcount and compensation budget analysis calculated")

