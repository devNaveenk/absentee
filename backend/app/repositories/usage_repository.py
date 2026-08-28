from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import UsageLog


class UsageLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, tenant_id: int | None, limit: int) -> list[UsageLog]:
        q = self.db.query(UsageLog).order_by(UsageLog.created_at.desc())
        if tenant_id is not None:
            q = q.filter(UsageLog.tenant_id == tenant_id)
        return q.limit(limit).all()

    def summary_since(self, since: datetime):
        return (
            self.db.query(
                UsageLog.tenant_id,
                func.count(UsageLog.id).label("total"),
                func.sum(func.if_(UsageLog.was_rate_limited.is_(True), 1, 0)).label("limited"),
                func.avg(UsageLog.duration_ms).label("avg_duration"),
            )
            .filter(UsageLog.created_at >= since)
            .group_by(UsageLog.tenant_id)
            .all()
        )
