from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_admin, require_tenant_user, tenant_scope
from app.models.models import User
from app.schemas.mappers import tenant_to_my_summary
from app.schemas.schemas import (
    BrandingUpdate,
    MyTenantSummary,
    ReasonListsUpdate,
    TenantUserCreate,
    TenantUserOut,
)
from app.services.tenant_settings_service import TenantSettingsService

router = APIRouter(prefix="/api/tenant/settings", tags=["tenant-settings"], dependencies=[Depends(require_tenant_user)])


def get_service(db: Session = Depends(get_db)) -> TenantSettingsService:
    return TenantSettingsService(db)


@router.patch("/reasons", response_model=MyTenantSummary)
def update_reason_lists(
    payload: ReasonListsUpdate,
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    return tenant_to_my_summary(service.update_reason_lists(tenant_scope(user), payload))


@router.patch("/branding", response_model=MyTenantSummary)
def update_branding(
    payload: BrandingUpdate,
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    return tenant_to_my_summary(service.update_branding(tenant_scope(user), payload))


@router.post("/branding/logo", response_model=MyTenantSummary)
async def upload_logo(
    file: UploadFile = File(...),
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    content = await file.read()
    return tenant_to_my_summary(service.upload_logo(tenant_scope(user), file.filename or "logo.png", content))


@router.get("/branding/logo")
def get_logo(
    user: User = Depends(require_tenant_user),
    service: TenantSettingsService = Depends(get_service),
):
    path = service.get_logo_path(tenant_scope(user))
    return FileResponse(path)


@router.get("/users", response_model=list[TenantUserOut])
def list_users(
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    return service.list_users(tenant_scope(user))


@router.post("/users", response_model=TenantUserOut, status_code=201)
def create_user(
    payload: TenantUserCreate,
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    return service.create_user(tenant_scope(user), payload)


@router.patch("/users/{user_id}/status", response_model=TenantUserOut)
def set_user_status(
    user_id: int,
    is_active: bool,
    user: User = Depends(require_tenant_admin),
    service: TenantSettingsService = Depends(get_service),
):
    return service.set_user_status(tenant_scope(user), user_id, is_active)
