from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_superadmin
from app.schemas.mappers import tenant_to_out
from app.schemas.schemas import (
    RateLimitUpdate,
    TenantConfigUpdate,
    TenantCreate,
    TenantOut,
    UsageLogOut,
    UsageSummary,
)
from app.services.tenant_service import TenantService
from app.services.usage_service import UsageService

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"], dependencies=[Depends(require_superadmin)])


def get_tenant_service(db: Session = Depends(get_db)) -> TenantService:
    return TenantService(db)


def get_usage_service(db: Session = Depends(get_db)) -> UsageService:
    return UsageService(db)


@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(service: TenantService = Depends(get_tenant_service)):
    return [tenant_to_out(t) for t in service.list_tenants()]


@router.post("/tenants", response_model=TenantOut, status_code=201)
def create_tenant(payload: TenantCreate, service: TenantService = Depends(get_tenant_service)):
    return tenant_to_out(service.create_tenant(payload))


@router.patch("/tenants/{tenant_id}/rate-limit", response_model=TenantOut)
def update_rate_limit(tenant_id: int, payload: RateLimitUpdate, service: TenantService = Depends(get_tenant_service)):
    return tenant_to_out(service.update_rate_limit(tenant_id, payload.requests_per_minute))


@router.patch("/tenants/{tenant_id}/status", response_model=TenantOut)
def set_tenant_status(tenant_id: int, is_active: bool, service: TenantService = Depends(get_tenant_service)):
    return tenant_to_out(service.set_status(tenant_id, is_active))


@router.patch("/tenants/{tenant_id}/config", response_model=TenantOut)
def update_tenant_config(tenant_id: int, payload: TenantConfigUpdate, service: TenantService = Depends(get_tenant_service)):
    return tenant_to_out(service.update_config(tenant_id, payload))


@router.get("/usage-logs", response_model=list[UsageLogOut])
def usage_logs(
    tenant_id: int | None = None,
    limit: int = Query(100, le=1000),
    service: UsageService = Depends(get_usage_service),
):
    return service.list_logs(tenant_id, limit)


@router.get("/usage-summary", response_model=list[UsageSummary])
def usage_summary(hours: int = 24, service: UsageService = Depends(get_usage_service)):
    return service.summary(hours)
