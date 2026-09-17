from sqlalchemy import Column, String, ForeignKey, Integer, Numeric, Boolean, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Company(BaseModel):
    __tablename__ = "companies"

    code = Column(String(50), unique=True, index=True, nullable=False)
    name_kh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    tax_id_number = Column(String(50), nullable=True)  # Cambodia TIN
    nssf_number = Column(String(50), nullable=True)    # Cambodia NSSF Enterprise ID
    registration_number = Column(String(100), nullable=True)
    logo_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(150), nullable=True)
    website = Column(String(150), nullable=True)
    
    default_currency = Column(String(3), default="KHR", nullable=False)
    secondary_currency = Column(String(3), default="USD", nullable=False)
    timezone = Column(String(50), default="Asia/Phnom_Penh", nullable=False)
    fiscal_year_start_month = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    branches = relationship("Branch", back_populates="company", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="company", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="company", cascade="all, delete-orphan")


class Branch(BaseModel):
    __tablename__ = "branches"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    code = Column(String(50), nullable=False)
    name_kh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    is_headquarters = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="branches")
    departments = relationship("Department", back_populates="branch")


class Department(BaseModel):
    __tablename__ = "departments"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True, index=True)
    parent_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    code = Column(String(50), nullable=False)
    name_kh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    manager_employee_id = Column(String(36), nullable=True)  # References Employee ID
    is_active = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="departments")
    branch = relationship("Branch", back_populates="departments")
    teams = relationship("Team", back_populates="department", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="department")


class Team(BaseModel):
    __tablename__ = "teams"

    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False, index=True)
    name_kh = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    lead_employee_id = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    department = relationship("Department", back_populates="teams")


class Position(BaseModel):
    __tablename__ = "positions"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True, index=True)
    code = Column(String(50), nullable=False)
    title_kh = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    job_grade = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    min_salary = Column(Numeric(16, 2), nullable=True)
    max_salary = Column(Numeric(16, 2), nullable=True)
    headcount_budget = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="positions")
    department = relationship("Department", back_populates="positions")
