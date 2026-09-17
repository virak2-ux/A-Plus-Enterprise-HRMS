from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Table
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class RolePermission(BaseModel):
    __tablename__ = "role_permissions"

    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False, index=True)
    permission_id = Column(String(36), ForeignKey("permissions.id"), nullable=False, index=True)

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")


class UserRole(BaseModel):
    __tablename__ = "user_roles"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False, index=True)

    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")


class Permission(BaseModel):
    __tablename__ = "permissions"

    code = Column(String(100), unique=True, index=True, nullable=False)  # e.g., "payroll:calculate", "employee:view_sensitive"
    module = Column(String(50), nullable=False, index=True)               # e.g., "payroll", "employee", "leave"
    action = Column(String(50), nullable=False)                          # e.g., "view", "create", "approve", "export"
    description = Column(String(255), nullable=True)
    is_sensitive = Column(Boolean, default=False, nullable=False)        # For salary, bank accounts, confidential files

    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class Role(BaseModel):
    __tablename__ = "roles"

    code = Column(String(50), unique=True, index=True, nullable=False)   # e.g., "SUPER_ADMIN", "HR_DIRECTOR", "EMPLOYEE"
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_system_role = Column(Boolean, default=False, nullable=False)

    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(150), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    employee_id = Column(String(36), nullable=True, index=True)  # Links to employee master record
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    preferred_language = Column(String(5), default="km", nullable=False)  # "km" or "en"
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    company = relationship("Company")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
