from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, Role, Permission, UserRole, RolePermission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Authenticates the bearer token and returns the current user with roles/permissions attached."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception
        
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account."
        )

    # Attach loaded roles and permissions in memory for rapid RBAC checks
    user_roles = (
        db.query(Role)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .all()
    )
    role_ids = [r.id for r in user_roles]
    user.role_codes = [r.code for r in user_roles]

    user_permissions = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id.in_(role_ids))
        .all()
    ) if role_ids else []
    
    user.permission_codes = set(p[0] for p in user_permissions)
    return user


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    """Restricts endpoint to superusers."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser privileges required."
        )
    return current_user


def require_permission(permission_code: str) -> Callable:
    """Factory dependency to enforce granular RBAC permissions."""
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        if permission_code not in getattr(current_user, "permission_codes", set()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: missing required permission '{permission_code}'."
            )
        return current_user
    return permission_checker
