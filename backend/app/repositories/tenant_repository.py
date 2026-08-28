from sqlalchemy.orm import Session

from app.models.models import RateLimitConfig, Tenant


class TenantRepository:
    """Persistence for tenants and their rate-limit configuration."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, tenant_id: int) -> Tenant | None:
        return self.db.get(Tenant, tenant_id)

    def get_by_slug(self, slug: str, *, active_only: bool = False) -> Tenant | None:
        q = self.db.query(Tenant).filter(Tenant.slug == slug)
        if active_only:
            q = q.filter(Tenant.is_active.is_(True))
        return q.first()

    def list_all(self) -> list[Tenant]:
        return self.db.query(Tenant).all()

    def add(self, tenant: Tenant) -> Tenant:
        self.db.add(tenant)
        self.db.flush()
        return tenant

    def get_rate_limit_config(self, tenant_id: int) -> RateLimitConfig | None:
        return self.db.query(RateLimitConfig).filter(RateLimitConfig.tenant_id == tenant_id).first()

    def upsert_rate_limit(self, tenant_id: int, requests_per_minute: int) -> RateLimitConfig:
        config = self.get_rate_limit_config(tenant_id)
        if not config:
            config = RateLimitConfig(tenant_id=tenant_id, requests_per_minute=requests_per_minute)
            self.db.add(config)
        else:
            config.requests_per_minute = requests_per_minute
        return config

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, tenant: Tenant) -> None:
        self.db.refresh(tenant)
