from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, require_permission
from app.models.company import Company, Branch, Department, Position
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
