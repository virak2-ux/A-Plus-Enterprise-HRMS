from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import verify_password, get_password_hash, create_access_token, validate_password_strength
from app.models.user import User, Role, Permission, UserRole, RolePermission
from app.schemas.auth import LoginRequest, TokenResponse, UserOut, ChangePasswordRequest
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticates user with username or email and returns JWT access token."""
    user = (
        db.query(User)
        .filter(
            (User.email == login_data.username_or_email) | (User.username == login_data.username_or_email),
            User.is_deleted == False
        )
        .first()
    )
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    AuditService.log_event(
        db=db,
        action="LOGIN",
        module="auth",
        entity_type="User",
        entity_id=user.id,
        user_id=user.id,
    )

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "email": user.email,
            "username": user.username,
            "company_id": user.company_id,
            "is_superuser": user.is_superuser,
        }
    )
    return TokenResponse(access_token=token, token_type="bearer", expires_in=86400)


@router.get("/me", response_model=APIResponse[UserOut])
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns profile and RBAC permissions for the authenticated user."""
    roles = getattr(current_user, "role_codes", [])
    permissions = list(getattr(current_user, "permission_codes", set()))

    user_out = UserOut(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        company_id=current_user.company_id,
        employee_id=current_user.employee_id,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        preferred_language=current_user.preferred_language,
        roles=roles,
        permissions=permissions,
    )
    return APIResponse(data=user_out, message="Current user profile retrieved")


@router.post("/change-password", response_model=APIResponse[dict])
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Changes password after verifying old password and enforcing strength rules."""
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match.",
        )
    valid, msg = validate_password_strength(data.new_password)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    AuditService.log_event(
        db=db,
        action="CHANGE_PASSWORD",
        module="auth",
        entity_type="User",
        entity_id=current_user.id,
        user_id=current_user.id,
    )

    return APIResponse(data={"updated": True}, message="Password updated successfully")
