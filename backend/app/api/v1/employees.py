from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, get_current_user, require_permission
from app.models.employee import Employee, SalaryHistory, Contract
from app.models.company import Department, Position
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeListOut
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.audit_service import AuditService
from app.services.employee_import_service import EmployeeImportService

router = APIRouter()


def can_view_sensitive_data(current_user, employee: Employee) -> bool:
    """Checks whether the user has permission to see salary, bank details, and national IDs."""
    if current_user.is_superuser:
        return True
    # Employee can view their own details
    if current_user.employee_id == employee.id:
        return True
    user_perms = getattr(current_user, "permission_codes", set())
    if "salary:view" in user_perms or "employee:view_sensitive" in user_perms:
        return True
    return False


@router.get("", response_model=PaginatedResponse[EmployeeListOut])
def list_employees(
    company_id: Optional[str] = None,
    department_id: Optional[str] = None,
    employment_status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Paginated, filtered list of employees for TanStack table views."""
    query = (
        db.query(Employee, Department.name_en.label("dept_name"), Position.title_en.label("pos_title"))
        .join(Department, Department.id == Employee.department_id)
        .join(Position, Position.id == Employee.position_id)
        .filter(Employee.is_deleted == False)
    )

    if company_id:
        query = query.filter(Employee.company_id == company_id)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if employment_status:
        query = query.filter(Employee.employment_status == employment_status)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Employee.employee_code.ilike(search_fmt),
                Employee.first_name_en.ilike(search_fmt),
                Employee.last_name_en.ilike(search_fmt),
                Employee.first_name_kh.ilike(search_fmt),
                Employee.last_name_kh.ilike(search_fmt),
                Employee.email_work.ilike(search_fmt),
            )
        )

    total = query.count()
    total_pages = (total + limit - 1) // limit
    records = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for emp, dept_name, pos_title in records:
        items.append(
            EmployeeListOut(
                id=emp.id,
                company_id=emp.company_id,
                employee_code=emp.employee_code,
                first_name_kh=emp.first_name_kh,
                last_name_kh=emp.last_name_kh,
                first_name_en=emp.first_name_en,
                last_name_en=emp.last_name_en,
                gender=emp.gender,
                phone_primary=emp.phone_primary,
                email_work=emp.email_work,
                department_id=emp.department_id,
                department_name=dept_name,
                position_id=emp.position_id,
                position_title=pos_title,
                employment_status=emp.employment_status,
                employment_type=emp.employment_type,
                join_date=emp.join_date,
            )
        )

    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/import/template")
def download_import_template(
    current_user=Depends(require_permission("employee:create")),
):
    """Downloads sample Excel onboarding template."""
    content = EmployeeImportService.generate_template_excel()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Cambodia_HRMS_Employee_Import_Template.xlsx"'},
    )


@router.post("/import", response_model=APIResponse[dict])
async def import_employees(
    company_id: str = Query(...),
    dry_run: bool = Query(True),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:create")),
):
    """Processes bulk employee import from Excel or CSV with dry-run validation and audit logging."""
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = EmployeeImportService.process_import(
        db=db,
        company_id=company_id,
        file_bytes=file_bytes,
        filename=file.filename or "import.xlsx",
        dry_run=dry_run,
        actor_user_id=current_user.id,
    )
    return APIResponse(data=result, message="Spreadsheet processed successfully")


@router.get("/{employee_id}", response_model=APIResponse[EmployeeOut])
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Fetches employee master details with sensitive field masking based on caller permissions."""
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.is_deleted == False).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    has_sensitive_access = can_view_sensitive_data(current_user, emp)

    emp_out = EmployeeOut(
        id=emp.id,
        company_id=emp.company_id,
        employee_code=emp.employee_code,
        first_name_kh=emp.first_name_kh,
        last_name_kh=emp.last_name_kh,
        first_name_en=emp.first_name_en,
        last_name_en=emp.last_name_en,
        preferred_name=emp.preferred_name,
        gender=emp.gender,
        date_of_birth=emp.date_of_birth,
        place_of_birth=emp.place_of_birth,
        nationality=emp.nationality,
        marital_status=emp.marital_status,
        phone_primary=emp.phone_primary,
        phone_secondary=emp.phone_secondary,
        email_work=emp.email_work,
        email_personal=emp.email_personal,
        current_address=emp.current_address,
        permanent_address=emp.permanent_address,
        branch_id=emp.branch_id,
        department_id=emp.department_id,
        position_id=emp.position_id,
        manager_id=emp.manager_id,
        join_date=emp.join_date,
        probation_end_date=emp.probation_end_date,
        employment_status=emp.employment_status,
        employment_type=emp.employment_type,
        is_resident_for_tax=emp.is_resident_for_tax,
        spouse_dependent_count=emp.spouse_dependent_count,
        minor_children_count=emp.minor_children_count,
        # Masked unless authorized
        base_salary=float(emp.base_salary) if has_sensitive_access else None,
        salary_currency=emp.salary_currency if has_sensitive_access else None,
        payment_method=emp.payment_method if has_sensitive_access else None,
        bank_name=emp.bank_name if has_sensitive_access else None,
        bank_account_number=emp.bank_account_number if has_sensitive_access else None,
        bank_account_name=emp.bank_account_name if has_sensitive_access else None,
        national_id_number=emp.national_id_number if has_sensitive_access else None,
        national_id_expiry=emp.national_id_expiry if has_sensitive_access else None,
        passport_number=emp.passport_number if has_sensitive_access else None,
        created_at=emp.created_at,
    )

    return APIResponse(data=emp_out, message="Employee details retrieved")


@router.post("", response_model=APIResponse[EmployeeOut])
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:create")),
):
    """Creates an employee record, sets up initial salary history and contract."""
    existing = db.query(Employee).filter(
        Employee.company_id == data.company_id,
        Employee.employee_code == data.employee_code,
        Employee.is_deleted == False
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Employee with code '{data.employee_code}' already exists in this company."
        )

    emp_dict = data.model_dump()
    employee = Employee(**emp_dict)
    db.add(employee)
    db.commit()
    db.refresh(employee)

    # Automatically record initial salary history
    if data.base_salary > 0:
        salary_history = SalaryHistory(
            employee_id=employee.id,
            previous_salary=0.0,
            new_salary=data.base_salary,
            currency=data.salary_currency,
            effective_date=data.join_date,
            change_reason="Initial employment contract",
            approved_by_user_id=current_user.id,
        )
        db.add(salary_history)

    # Automatically initialize initial contract record
    contract = Contract(
        employee_id=employee.id,
        contract_number=f"CTR-{employee.employee_code}-01",
        contract_type="UDC" if "UDC" in data.employment_type else "FDC",
        start_date=data.join_date,
        base_salary=data.base_salary,
        currency=data.salary_currency,
        status="ACTIVE",
    )
    db.add(contract)
    db.commit()

    AuditService.log_event(
        db=db,
        action="CREATE",
        module="employee",
        entity_type="Employee",
        entity_id=employee.id,
        user_id=current_user.id,
        new_values={"employee_code": employee.employee_code, "name_en": f"{employee.first_name_en} {employee.last_name_en}"},
    )

    return APIResponse(data=employee, message="Employee created successfully")
