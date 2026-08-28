from sqlalchemy.orm import Session, joinedload

from app.models.models import AbsenteeApplication, ApplicationEvent, ApplicationStatus, User

PROCESSED_STATUSES = {
    ApplicationStatus.rejected,
    ApplicationStatus.cure,
    ApplicationStatus.reapproved,
    ApplicationStatus.abs_sent,
}


class ApplicationRepository:
    """Persistence for absentee applications and their audit events."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, tenant_id: int, application_id: int) -> AbsenteeApplication | None:
        return (
            self.db.query(AbsenteeApplication)
            .options(joinedload(AbsenteeApplication.voter), joinedload(AbsenteeApplication.events))
            .filter(AbsenteeApplication.id == application_id, AbsenteeApplication.tenant_id == tenant_id)
            .first()
        )

    def list(
        self,
        tenant_id: int,
        *,
        view: str,
        status_filter: ApplicationStatus | None,
        reapproval_only: bool,
        limit: int,
    ) -> list[AbsenteeApplication]:
        q = self.db.query(AbsenteeApplication).options(joinedload(AbsenteeApplication.voter)).filter(
            AbsenteeApplication.tenant_id == tenant_id
        )

        if view == "unprocessed":
            q = q.filter(AbsenteeApplication.status == ApplicationStatus.unprocessed)
        elif status_filter and status_filter in PROCESSED_STATUSES:
            q = q.filter(AbsenteeApplication.status == status_filter)
        else:
            q = q.filter(AbsenteeApplication.status.in_(PROCESSED_STATUSES))

        if reapproval_only:
            q = q.filter(AbsenteeApplication.is_reapproval.is_(True))

        return q.order_by(AbsenteeApplication.created_at.desc()).limit(limit).all()

    def add(self, application: AbsenteeApplication) -> AbsenteeApplication:
        self.db.add(application)
        self.db.flush()
        return application

    def add_event(
        self,
        application: AbsenteeApplication,
        action: str,
        actor: User,
        *,
        reason: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        self.db.add(
            ApplicationEvent(
                application_id=application.id,
                action=action,
                actor_user_id=actor.id,
                reason=reason,
                event_metadata=metadata,
            )
        )

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, application: AbsenteeApplication) -> None:
        self.db.refresh(application)
