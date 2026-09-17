from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, EmailStr


class EmployeeBase(BaseModel):
    company_id: str
    employee_code: str
    first_name_kh: str
    last_name_kh: str
    first_name_en: str
    last_name_en: str
    preferred_name: Optional[str] = None
    gender: str
    date_of_birth: date
    place_of_birth: Optional[str] = None
    nationality: str = "Cambodian"
    marital_status: str = "SINGLE"
    
    phone_primary: str
    phone_secondary: Optional[str] = None
    email_work: Optional[str] = None
    email_personal: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None

    branch_id: Optional[str] = None
    department_id: str
    position_id: str
    manager_id: Optional[str] = None

    join_date: date
    probation_end_date: Optional[date] = None
    employment_status: str = "ACTIVE"
    employment_type: str = "PERMANENT_UDC"

    # Cambodia Tax & NSSF specifics
    is_resident_for_tax: bool = True
    spouse_dependent_count: int = 0
    minor_children_count: int = 0


class EmployeeCreate(EmployeeBase):
    # Compensation info on creation
    base_salary: float = 0.0
    salary_currency: str = "KHR"
    payment_method: str = "BANK_TRANSFER"
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    national_id_number: Optional[str] = None
    national_id_expiry: Optional[date] = None
    passport_number: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name_kh: Optional[str] = None
    last_name_kh: Optional[str] = None
    first_name_en: Optional[str] = None
    last_name_en: Optional[str] = None
    preferred_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    marital_status: Optional[str] = None
    phone_primary: Optional[str] = None
    phone_secondary: Optional[str] = None
    email_work: Optional[str] = None
    email_personal: Optional[str] = None
    current_address: Optional[str] = None
    permanent_address: Optional[str] = None
    department_id: Optional[str] = None
    position_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_status: Optional[str] = None
    employment_type: Optional[str] = None
    is_resident_for_tax: Optional[bool] = None
    spouse_dependent_count: Optional[int] = None
    minor_children_count: Optional[int] = None

    # Sensitive fields (authorized only)
    base_salary: Optional[float] = None
    salary_currency: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    national_id_number: Optional[str] = None


class EmployeeListOut(BaseModel):
    id: str
    company_id: str
    employee_code: str
    first_name_kh: str
    last_name_kh: str
    first_name_en: str
    last_name_en: str
    gender: str
    phone_primary: str
    email_work: Optional[str] = None
    department_id: str
    department_name: Optional[str] = None
    position_id: str
    position_title: Optional[str] = None
    employment_status: str
    employment_type: str
    join_date: date

    class Config:
        from_attributes = True


class EmployeeOut(EmployeeBase):
    id: str
    # Sensitive fields are present here (masked or included based on authorization)
    base_salary: Optional[float] = None
    salary_currency: Optional[str] = None
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    national_id_number: Optional[str] = None
    national_id_expiry: Optional[date] = None
    passport_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
