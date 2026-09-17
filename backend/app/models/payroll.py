from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class PayrollPeriod(BaseModel):
    __tablename__ = "payroll_periods"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "September 2026 Monthly Payroll"
    cycle_type = Column(String(30), default="MONTHLY", nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    cutoff_date = Column(Date, nullable=False)
    payment_date = Column(Date, nullable=False)
    
    status = Column(String(30), default="DRAFT", nullable=False, index=True)
    # Statuses: DRAFT, CALCULATING, REVIEW, APPROVED, LOCKED

    payroll_runs = relationship("PayrollRun", back_populates="period", cascade="all, delete-orphan")


class PayrollRun(BaseModel):
    __tablename__ = "payroll_runs"

    payroll_period_id = Column(String(36), ForeignKey("payroll_periods.id"), nullable=False, index=True)
    run_number = Column(Integer, default=1, nullable=False)
    exchange_rate_usd_to_khr = Column(Numeric(18, 4), default=4100.0000, nullable=False)
    
    calculated_at = Column(DateTime(timezone=True), nullable=True)
    calculated_by_user_id = Column(String(36), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by_user_id = Column(String(36), nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)

    total_gross_khr = Column(Numeric(18, 2), default=0.00, nullable=False)
    total_net_khr = Column(Numeric(18, 2), default=0.00, nullable=False)
    total_tax_khr = Column(Numeric(18, 2), default=0.00, nullable=False)
    total_nssf_khr = Column(Numeric(18, 2), default=0.00, nullable=False)
    status = Column(String(30), default="DRAFT", nullable=False)

    period = relationship("PayrollPeriod", back_populates="payroll_runs")
    items = relationship("PayrollItem", back_populates="payroll_run", cascade="all, delete-orphan")


class PayrollItem(BaseModel):
    __tablename__ = "payroll_items"

    payroll_run_id = Column(String(36), ForeignKey("payroll_runs.id"), nullable=False, index=True)
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)

    # Base & Inputs
    base_salary_contract = Column(Numeric(16, 2), nullable=False)
    currency_contract = Column(String(3), nullable=False)
    worked_days = Column(Numeric(5, 2), default=0.00, nullable=False)
    unpaid_absence_days = Column(Numeric(5, 2), default=0.00, nullable=False)
    overtime_hours = Column(Numeric(6, 2), default=0.00, nullable=False)

    # Gross Earnings
    base_salary_earned_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    total_allowances_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    total_overtime_pay_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    total_bonuses_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    seniority_indemnity_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    gross_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)

    # NSSF Contributions
    nssf_contributory_wage_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    nssf_pension_employee_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    nssf_pension_employer_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    nssf_health_employer_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    nssf_accident_employer_khr = Column(Numeric(16, 2), default=0.00, nullable=False)

    # Cambodia Tax on Salary (ToS)
    taxable_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    tax_relief_dependents_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    tax_base_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    tax_on_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)

    # Deductions & Net
    loan_deduction_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    other_deductions_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    total_deductions_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    
    net_salary_khr = Column(Numeric(16, 2), default=0.00, nullable=False)
    net_salary_usd = Column(Numeric(16, 2), default=0.00, nullable=False)

    # Immutable Audit Snapshot with complete calculation breakdown
    calculation_snapshot = Column(JSON, nullable=True)

    payroll_run = relationship("PayrollRun", back_populates="items")
    employee = relationship("Employee")
    details = relationship("PayrollItemDetail", back_populates="payroll_item", cascade="all, delete-orphan")


class PayrollItemDetail(BaseModel):
    __tablename__ = "payroll_item_details"

    payroll_item_id = Column(String(36), ForeignKey("payroll_items.id"), nullable=False, index=True)
    component_type = Column(String(50), nullable=False)  # "EARNING", "NSSF_EMPLOYEE", "NSSF_EMPLOYER", "TAX", "DEDUCTION"
    code = Column(String(50), nullable=False)
    name_kh = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    amount_khr = Column(Numeric(16, 2), nullable=False)
    amount_usd = Column(Numeric(16, 2), nullable=False)
    formula_trace = Column(String(255), nullable=True)

    payroll_item = relationship("PayrollItem", back_populates="details")


class TaxRule(BaseModel):
    __tablename__ = "tax_rules"

    country = Column(String(50), default="Cambodia", nullable=False)
    name = Column(String(100), nullable=False)
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    
    # Dependent Rebate per qualifying spouse or child (e.g., 150,000 KHR)
    dependent_rebate_khr = Column(Numeric(16, 2), default=150000.00, nullable=False)
    non_resident_flat_rate = Column(Numeric(5, 4), default=0.2000, nullable=False)
    
    # Progressive tax brackets stored as JSON list:
    # [{"min_khr": 0, "max_khr": 1500000, "rate": 0.00}, ...]
    brackets_config = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ContributionRule(BaseModel):
    __tablename__ = "contribution_rules"

    country = Column(String(50), default="Cambodia", nullable=False)
    name = Column(String(100), nullable=False)
    contribution_type = Column(String(50), nullable=False)  # "NSSF_HEALTH", "NSSF_ACCIDENT", "NSSF_PENSION"
    effective_from = Column(Date, nullable=False)
    effective_to = Column(Date, nullable=True)
    
    employer_rate = Column(Numeric(6, 4), default=0.00, nullable=False)
    employee_rate = Column(Numeric(6, 4), default=0.00, nullable=False)
    wage_floor_khr = Column(Numeric(16, 2), default=400000.00, nullable=False)
    wage_ceiling_khr = Column(Numeric(16, 2), default=1200000.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Loan(BaseModel):
    __tablename__ = "loans"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    loan_type = Column(String(50), default="SALARY_ADVANCE", nullable=False)  # "SALARY_ADVANCE", "COMPANY_LOAN"
    principal_amount = Column(Numeric(16, 2), nullable=False)
    currency = Column(String(3), default="KHR", nullable=False)
    interest_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    monthly_deduction_amount = Column(Numeric(16, 2), nullable=False)
    remaining_balance = Column(Numeric(16, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False)  # "ACTIVE", "PAID_OFF", "CANCELLED"
    notes = Column(Text, nullable=True)

    employee = relationship("Employee")


class Benefit(BaseModel):
    __tablename__ = "benefits"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    name_kh = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # "HEALTH_INSURANCE", "TRANSPORTATION", "MEAL", "HOUSING"
    employer_cost = Column(Numeric(16, 2), default=0.00, nullable=False)
    employee_cost = Column(Numeric(16, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="KHR", nullable=False)
    is_taxable = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
