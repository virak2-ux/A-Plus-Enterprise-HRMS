from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class CompanyBase(BaseModel):
    code: str
    name_kh: str
    name_en: str
    legal_name: Optional[str] = None
    tax_id_number: Optional[str] = None
    nssf_number: Optional[str] = None
    default_currency: str = "KHR"
    secondary_currency: str = "USD"
    timezone: str = "Asia/Phnom_Penh"
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyOut(CompanyBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentBase(BaseModel):
    company_id: str
    branch_id: Optional[str] = None
    parent_id: Optional[str] = None
    code: str
    name_kh: str
    name_en: str
    description: Optional[str] = None
    manager_employee_id: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PositionBase(BaseModel):
    company_id: str
    department_id: Optional[str] = None
    code: str
    title_kh: str
    title_en: str
    job_grade: Optional[str] = None
    description: Optional[str] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    headcount_budget: int = 1


class PositionCreate(PositionBase):
    pass


class PositionOut(PositionBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
