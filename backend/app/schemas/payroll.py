from typing import Optional, List, Any
from datetime import date, datetime
from pydantic import BaseModel


class PayrollPeriodCreate(BaseModel):
    company_id: str
    name: str
    cycle_type: str = "MONTHLY"
    start_date: date
    end_date: date
    cutoff_date: date
    payment_date: date


class PayrollPeriodOut(PayrollPeriodCreate):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollRunTrigger(BaseModel):
    payroll_period_id: str
    exchange_rate_usd_to_khr: float = 4100.0000


class PayrollItemDetailOut(BaseModel):
    id: str
    component_type: str
    code: str
    name_kh: str
    name_en: str
    amount_khr: float
    amount_usd: float
    formula_trace: Optional[str] = None

    class Config:
        from_attributes = True


class PayrollItemOut(BaseModel):
    id: str
    payroll_run_id: str
    employee_id: str
    employee_code: Optional[str] = None
    employee_name_kh: Optional[str] = None
    employee_name_en: Optional[str] = None
    
    base_salary_contract: float
    currency_contract: str
    worked_days: float
    unpaid_absence_days: float
    overtime_hours: float
    total_overtime_pay_khr: Optional[float] = 0.0
    loan_deduction_khr: Optional[float] = 0.0
    
    gross_salary_khr: float
    nssf_pension_employee_khr: float
    nssf_pension_employer_khr: float
    nssf_health_employer_khr: float
    nssf_accident_employer_khr: float
    
    taxable_salary_khr: float
    tax_relief_dependents_khr: float
    tax_base_salary_khr: float
    tax_on_salary_khr: float
    
    total_deductions_khr: float
    net_salary_khr: float
    net_salary_usd: float
    
    calculation_snapshot: Optional[Any] = None
    details: List[PayrollItemDetailOut] = []

    class Config:
        from_attributes = True


class PayrollRunOut(BaseModel):
    id: str
    payroll_period_id: str
    run_number: int
    exchange_rate_usd_to_khr: float
    total_gross_khr: float
    total_net_khr: float
    total_tax_khr: float
    total_nssf_khr: float
    status: str
    calculated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    locked_at: Optional[datetime] = None
    items_count: Optional[int] = 0

    class Config:
        from_attributes = True
