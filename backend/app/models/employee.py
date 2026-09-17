from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Date, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Employee(BaseModel):
    __tablename__ = "employees"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    employee_code = Column(String(50), nullable=False, index=True)
    
    # Khmer & English Names
    first_name_kh = Column(String(100), nullable=False)
    last_name_kh = Column(String(100), nullable=False)
    first_name_en = Column(String(100), nullable=False)
    last_name_en = Column(String(100), nullable=False)
    preferred_name = Column(String(100), nullable=True)
    
    # Personal Details
    gender = Column(String(20), nullable=False)  # "MALE", "FEMALE", "OTHER"
    date_of_birth = Column(Date, nullable=False)
    place_of_birth = Column(String(255), nullable=True)
    nationality = Column(String(100), default="Cambodian", nullable=False)
    marital_status = Column(String(30), default="SINGLE", nullable=False)  # "SINGLE", "MARRIED", "DIVORCED", "WIDOWED"
    profile_photo_url = Column(String(500), nullable=True)

    # Cambodia Identification Fields
    national_id_number = Column(String(50), nullable=True, index=True)
    national_id_expiry = Column(Date, nullable=True)
    passport_number = Column(String(50), nullable=True)
    passport_expiry = Column(Date, nullable=True)
    nssf_card_number = Column(String(50), nullable=True)

    # Contact Info
    phone_primary = Column(String(50), nullable=False)
    phone_secondary = Column(String(50), nullable=True)
    email_work = Column(String(150), nullable=True, index=True)
    email_personal = Column(String(150), nullable=True)
    current_address = Column(Text, nullable=True)
    permanent_address = Column(Text, nullable=True)

    # Organizational Placement
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False, index=True)
    position_id = Column(String(36), ForeignKey("positions.id"), nullable=False, index=True)
    manager_id = Column(String(36), ForeignKey("employees.id"), nullable=True, index=True)

    # Employment Lifecycle Dates
    join_date = Column(Date, nullable=False)
    probation_start_date = Column(Date, nullable=True)
    probation_end_date = Column(Date, nullable=True)
    confirmation_date = Column(Date, nullable=True)
    resignation_date = Column(Date, nullable=True)
    termination_date = Column(Date, nullable=True)

    # Status & Contract Type
    employment_status = Column(String(30), default="ACTIVE", nullable=False, index=True)
    # Statuses: CANDIDATE, APPLICANT, OFFER, HIRED, ONBOARDING, PROBATION, ACTIVE, CONFIRMED, TRANSFERRED, PROMOTED, LEAVE_OF_ABSENCE, RESIGNED, TERMINATED, OFFBOARDING, ARCHIVED
    employment_type = Column(String(30), default="PERMANENT_UDC", nullable=False)
    # Types: PERMANENT_UDC, FIXED_TERM_FDC, PROBATIONARY, PART_TIME, INTERN, CONSULTANT

    # Compensation & Banking (Protected / Restricted)
    base_salary = Column(Numeric(16, 2), default=0.00, nullable=False)
    salary_currency = Column(String(3), default="KHR", nullable=False)  # "KHR" or "USD"
    payment_method = Column(String(30), default="BANK_TRANSFER", nullable=False)  # "BANK_TRANSFER", "CASH", "CHEQUE"
    bank_name = Column(String(100), nullable=True)  # e.g. ABA Bank, ACLEDA Bank, Canadia Bank
    bank_account_number = Column(String(100), nullable=True)
    bank_account_name = Column(String(150), nullable=True)

    # Cambodia Tax & NSSF Details
    is_resident_for_tax = Column(Boolean, default=True, nullable=False)
    spouse_dependent_count = Column(Integer, default=0, nullable=False)  # Dependent spouse rebate
    minor_children_count = Column(Integer, default=0, nullable=False)    # Child rebate (under 18 or student)

    # Relationships
    company = relationship("Company")
    branch = relationship("Branch")
    department = relationship("Department")
    position = relationship("Position")
    manager = relationship("Employee", remote_side="Employee.id")
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("EmployeeDocument", back_populates="employee", cascade="all, delete-orphan")
    salary_history = relationship("SalaryHistory", back_populates="employee", cascade="all, delete-orphan")
    dependents = relationship("EmployeeDependent", back_populates="employee", cascade="all, delete-orphan")


class EmployeeDependent(BaseModel):
    __tablename__ = "employee_dependents"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    full_name_kh = Column(String(150), nullable=False)
    full_name_en = Column(String(150), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # "SPOUSE", "CHILD", "PARENT"
    date_of_birth = Column(Date, nullable=False)
    is_tax_deductible = Column(Boolean, default=True, nullable=False)
    notes = Column(String(255), nullable=True)

    employee = relationship("Employee", back_populates="dependents")


class Contract(BaseModel):
    __tablename__ = "contracts"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    contract_number = Column(String(100), unique=True, nullable=False)
    contract_type = Column(String(30), nullable=False)  # "FDC" (Fixed Duration), "UDC" (Undetermined Duration), "PROBATION", "INTERNSHIP"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)              # Mandatory for FDC (max 2 years under Cambodia law)
    base_salary = Column(Numeric(16, 2), nullable=False)
    currency = Column(String(3), default="KHR", nullable=False)
    status = Column(String(30), default="ACTIVE", nullable=False)  # "DRAFT", "ACTIVE", "EXPIRED", "TERMINATED", "RENEWED"
    renewal_reminder_days = Column(Integer, default=30, nullable=False)
    document_url = Column(String(500), nullable=True)
    terms_summary = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="contracts")


class EmployeeDocument(BaseModel):
    __tablename__ = "employee_documents"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    document_type = Column(String(50), nullable=False)  # "NATIONAL_ID", "PASSPORT", "CV", "CONTRACT", "DEGREE", "CERTIFICATE", "DISCIPLINARY"
    title = Column(String(255), nullable=False)
    document_number = Column(String(100), nullable=True)
    file_url = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    is_confidential = Column(Boolean, default=True, nullable=False)
    uploaded_by_user_id = Column(String(36), nullable=True)

    employee = relationship("Employee", back_populates="documents")


class SalaryHistory(BaseModel):
    __tablename__ = "salary_histories"

    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False, index=True)
    previous_salary = Column(Numeric(16, 2), nullable=False)
    new_salary = Column(Numeric(16, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    effective_date = Column(Date, nullable=False)
    change_reason = Column(String(255), nullable=True)
    approved_by_user_id = Column(String(36), nullable=True)

    employee = relationship("Employee", back_populates="salary_history")
