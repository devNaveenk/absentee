from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ValidationError
from app.core.security import decode_access_token
from app.models.models import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    payload = decode_access_token(token)
    if not payload:
        raise credentials_error
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_error
    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise credentials_error
    return user


def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.superadmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required")
    return user


def require_tenant_user(user: User = Depends(get_current_user)) -> User:
    if user.role == UserRole.superadmin:
        return user
    if not user.tenant_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant membership required")
    return user


def require_tenant_admin(user: User = Depends(get_current_user)) -> User:
    if user.role == UserRole.superadmin:
        return user
    if not user.tenant_id or user.role != UserRole.tenant_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant admin access required")
    return user


def tenant_scope(user: User) -> int:
    """The tenant_id a request should be scoped to, or raise if the caller has none.

    Shared by every tenant-data router (voters, applications, returned
    ballots) instead of each re-declaring the same guard.
    """
    if not user.tenant_id:
        raise ValidationError("Superadmin accounts are not tenant-scoped")
    return user.tenant_id
