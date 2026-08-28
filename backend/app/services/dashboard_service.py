from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.models import AbsenteeApplication, ApplicationStatus, ReturnedBallot
from app.schemas.schemas import DashboardSummary


class DashboardService:
    """The 4 PRD-mandated operational metric cards -- intentionally simple, no charts."""

    def __init__(self, db: Session):
        self.db = db

    def summary(self, tenant_id: int) -> DashboardSummary:
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).replace(tzinfo=None)

        daily_incoming = (
            self.db.query(AbsenteeApplication)
            .filter(AbsenteeApplication.tenant_id == tenant_id, AbsenteeApplication.created_at >= since)
            .count()
        )
        queued = (
            self.db.query(AbsenteeApplication)
            .filter(
                AbsenteeApplication.tenant_id == tenant_id,
                AbsenteeApplication.status == ApplicationStatus.unprocessed,
            )
            .count()
        )
        in_cure = (
            self.db.query(AbsenteeApplication)
            .filter(AbsenteeApplication.tenant_id == tenant_id, AbsenteeApplication.status == ApplicationStatus.cure)
            .count()
        )
        completed_ballots = self.db.query(ReturnedBallot).filter(ReturnedBallot.tenant_id == tenant_id).count()

        return DashboardSummary(
            daily_incoming_requests=daily_incoming,
            completed_ballots_received=completed_ballots,
            current_queued_items=queued,
            items_in_cure_process=in_cure,
        )
