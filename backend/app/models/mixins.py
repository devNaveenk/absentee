from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column


class AuditEventMixin:
    """Shared shape for per-record audit trails (who / what / why / when).

    Used by ApplicationEvent and ReturnedBallotEvent so the two audit-log
    tables don't redeclare identical columns. Each subclass still declares
    its own primary key and the FK back to its parent record.
    """

    action: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
