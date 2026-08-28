from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.models import (
    DEFAULT_VERIFICATION_METHODS_GA,
    DEFAULT_VERIFICATION_METHODS_OTHER,
    RateLimitConfig,
    Tenant,
    User,
    UserRole,
)
from app.repositories.tenant_repository import TenantRepository
from app.services.rate_limiter import rate_limiter


def default_verification_methods(jurisdiction_state: str | None) -> list[str]:
    if jurisdiction_state == "GA":
        return list(DEFAULT_VERIFICATION_METHODS_GA)
    return list(DEFAULT_VERIFICATION_METHODS_OTHER)


class TenantService:
    """Superadmin-facing tenant provisioning and configuration rules."""

    def __init__(self, db: Session, tenants: TenantRepository | None = None):
        self.db = db
        self.tenants = tenants or TenantRepository(db)

    def list_tenants(self) -> list[Tenant]:
        return self.tenants.list_all()

    def create_tenant(self, payload) -> Tenant:
        if self.tenants.get_by_slug(payload.slug):
            raise ConflictError("Tenant slug already exists")

        tenant = self.tenants.add(
            Tenant(
                name=payload.name,
                slug=payload.slug,
                processing_mode=payload.processing_mode,
                jurisdiction_state=payload.jurisdiction_state,
                cure_notification_method=payload.cure_notification_method,
                verification_methods=(
                    [m.value for m in payload.verification_methods]
                    if payload.verification_methods
                    else default_verification_methods(payload.jurisdiction_state)
                ),
            )
        )
        self.db.add(
            User(
                tenant_id=tenant.id,
                email=payload.admin_email,
                hashed_password=hash_password(payload.admin_password),
                role=UserRole.tenant_admin,
            )
        )
        self.db.add(RateLimitConfig(tenant_id=tenant.id, requests_per_minute=payload.requests_per_minute))
        self.tenants.commit()
        self.tenants.refresh(tenant)
        return tenant

    def _get_or_404(self, tenant_id: int) -> Tenant:
        tenant = self.tenants.get(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return tenant

    def update_rate_limit(self, tenant_id: int, requests_per_minute: int) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        self.tenants.upsert_rate_limit(tenant_id, requests_per_minute)
        self.tenants.commit()
        rate_limiter.update_capacity(tenant_id, requests_per_minute)
        self.tenants.refresh(tenant)
        return tenant

    def set_status(self, tenant_id: int, is_active: bool) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        tenant.is_active = is_active
        self.tenants.commit()
        return tenant

    def update_config(self, tenant_id: int, payload) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        if payload.processing_mode is not None:
            tenant.processing_mode = payload.processing_mode
        if payload.jurisdiction_state is not None:
            tenant.jurisdiction_state = payload.jurisdiction_state or None
        if payload.cure_notification_method is not None:
            tenant.cure_notification_method = payload.cure_notification_method
        if payload.verification_methods is not None:
            tenant.verification_methods = [m.value for m in payload.verification_methods]
        self.tenants.commit()
        self.tenants.refresh(tenant)
        return tenant
