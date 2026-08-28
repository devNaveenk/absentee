from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.repositories.tenant_repository import TenantRepository
from app.repositories.usage_repository import UsageLogRepository
from app.schemas.schemas import UsageSummary


class UsageService:
    """Read-side reporting for the superadmin usage/rate-limit dashboard."""

    def __init__(self, db: Session, usage: UsageLogRepository | None = None, tenants: TenantRepository | None = None):
        self.usage = usage or UsageLogRepository(db)
        self.tenants = tenants or TenantRepository(db)

    def list_logs(self, tenant_id: int | None, *, offset: int, limit: int) -> tuple[list, int]:
        return self.usage.list_page(tenant_id, offset=offset, limit=limit), self.usage.count(tenant_id)

    def summary(self, hours: int) -> list[UsageSummary]:
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).replace(tzinfo=None)
        rows = self.usage.summary_since(since)

        tenants = {t.id: t for t in self.tenants.list_all()}
        result = []
        for tenant_id, total, limited, avg_duration in rows:
            tenant = tenants.get(tenant_id)
            result.append(
                UsageSummary(
                    tenant_id=tenant_id,
                    tenant_name=tenant.name if tenant else "Unknown",
                    total_requests=total,
                    rate_limited_requests=int(limited or 0),
                    avg_duration_ms=round(float(avg_duration or 0), 1),
                    requests_per_minute_limit=tenant.rate_limit.requests_per_minute if tenant and tenant.rate_limit else None,
                )
            )
        return result
