from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import LoginRequest, LoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    user, token, tenant_slug = service.login(payload.email, payload.password, payload.tenant_slug)
    return LoginResponse(access_token=token, role=user.role, tenant_slug=tenant_slug, email=user.email)
