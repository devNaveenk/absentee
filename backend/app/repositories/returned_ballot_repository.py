from sqlalchemy.orm import Session, joinedload

from app.models.models import (
    AbsenteeApplication,
    ApplicationStatus,
    ReturnedBallot,
    ReturnedBallotEvent,
    ReturnedBallotStatus,
    User,
)


class ReturnedBallotRepository:
    """Persistence for returned ballots and their audit events."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, tenant_id: int, ballot_id: int) -> ReturnedBallot | None:
        return (
            self.db.query(ReturnedBallot)
            .options(
                joinedload(ReturnedBallot.voter),
                joinedload(ReturnedBallot.absentee_application),
                joinedload(ReturnedBallot.events),
            )
            .filter(ReturnedBallot.id == ballot_id, ReturnedBallot.tenant_id == tenant_id)
            .first()
        )

    def list(self, tenant_id: int, *, view: str, status_filter: ReturnedBallotStatus | None, limit: int) -> list[ReturnedBallot]:
        q = self.db.query(ReturnedBallot).options(joinedload(ReturnedBallot.voter)).filter(
            ReturnedBallot.tenant_id == tenant_id
        )

        if view == "pending":
            q = q.filter(ReturnedBallot.status == ReturnedBallotStatus.received)
        elif status_filter and status_filter != ReturnedBallotStatus.received:
            q = q.filter(ReturnedBallot.status == status_filter)
        else:
            q = q.filter(ReturnedBallot.status.in_([ReturnedBallotStatus.verified, ReturnedBallotStatus.rejected]))

        return q.order_by(ReturnedBallot.created_at.desc()).limit(limit).all()

    def add(self, ballot: ReturnedBallot) -> ReturnedBallot:
        self.db.add(ballot)
        self.db.flush()
        return ballot

    def find_latest_abs_sent_application(self, tenant_id: int, voter_id: int) -> AbsenteeApplication | None:
        return (
            self.db.query(AbsenteeApplication)
            .filter(
                AbsenteeApplication.tenant_id == tenant_id,
                AbsenteeApplication.voter_id == voter_id,
                AbsenteeApplication.status == ApplicationStatus.abs_sent,
            )
            .order_by(AbsenteeApplication.processed_at.desc())
            .first()
        )

    def add_event(
        self,
        ballot: ReturnedBallot,
        action: str,
        actor: User,
        *,
        reason: str | None = None,
        metadata: dict | None = None,
    ) -> None:
        self.db.add(
            ReturnedBallotEvent(
                returned_ballot_id=ballot.id,
                action=action,
                actor_user_id=actor.id,
                reason=reason,
                event_metadata=metadata,
            )
        )

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, ballot: ReturnedBallot) -> None:
        self.db.refresh(ballot)
