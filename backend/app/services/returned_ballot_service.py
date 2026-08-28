from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.identifiers import generate_code
from app.domain.verification import missing_verification_checks
from app.models.models import ReturnedBallot, ReturnedBallotRejectionReason, ReturnedBallotStatus, User
from app.repositories.returned_ballot_repository import ReturnedBallotRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.voter_repository import VoterRepository
from app.services.ocr import OCRProvider, get_ocr_provider
from app.services.storage import FileStorage, get_file_storage


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ReturnedBallotService:
    """Business rules for returned-ballot verification (PRD Phase 2)."""

    def __init__(
        self,
        db: Session,
        ballots: ReturnedBallotRepository | None = None,
        voters: VoterRepository | None = None,
        tenants: TenantRepository | None = None,
        ocr: OCRProvider | None = None,
        storage: FileStorage | None = None,
    ):
        self.db = db
        self.ballots = ballots or ReturnedBallotRepository(db)
        self.voters = voters or VoterRepository(db)
        self.tenants = tenants or TenantRepository(db)
        self.ocr = ocr or get_ocr_provider()
        self.storage = storage or get_file_storage()

    def list_ballots(self, tenant_id: int, *, view: str, status_filter, limit: int):
        return self.ballots.list(tenant_id, view=view, status_filter=status_filter, limit=limit)

    def get_ballot(self, tenant_id: int, ballot_id: int) -> ReturnedBallot:
        ballot = self.ballots.get(tenant_id, ballot_id)
        if not ballot:
            raise NotFoundError("Returned ballot not found")
        return ballot

    def get_envelope_image_path(self, tenant_id: int, ballot_id: int):
        ballot = self.get_ballot(tenant_id, ballot_id)
        if not ballot.envelope_scan_image_path:
            raise NotFoundError("No envelope scan for this ballot")
        path = self.storage.resolve(ballot.envelope_scan_image_path)
        if not path.exists():
            raise NotFoundError("Envelope scan file missing")
        return path

    def _attach_voter_and_application(self, tenant_id: int, ballot: ReturnedBallot, voter_id: int) -> None:
        voter = self.voters.get(tenant_id, voter_id)
        if not voter:
            raise NotFoundError("Voter not found")
        ballot.voter_id = voter.id
        original = self.ballots.find_latest_abs_sent_application(tenant_id, voter.id)
        if original:
            ballot.absentee_application_id = original.id

    def create_manual(self, tenant_id: int, actor: User, payload) -> ReturnedBallot:
        ballot = self.ballots.add(
            ReturnedBallot(
                tenant_id=tenant_id,
                tracking_number=generate_code("RB"),
                submitted_full_name=payload.submitted_full_name,
                submitted_address=payload.submitted_address,
                status=ReturnedBallotStatus.received,
            )
        )
        if payload.voter_id is not None:
            self._attach_voter_and_application(tenant_id, ballot, payload.voter_id)

        self.ballots.add_event(ballot, "received", actor, metadata={"source": "manual_entry"})
        self.ballots.commit()
        return self.get_ballot(tenant_id, ballot.id)

    async def create_from_scan(self, tenant_id: int, actor: User, filename: str, content: bytes) -> ReturnedBallot:
        tenant = self.tenants.get(tenant_id)
        if tenant.processing_mode.value != "scan":
            raise ValidationError(
                "Tenant is in Manual Mode. Scanned envelope intake with OCR is only available in Scan Mode."
            )

        relative_path = self.storage.save(tenant_id, "envelopes", filename, content)
        extracted = self.ocr.extract_application_fields(relative_path)

        ballot = self.ballots.add(
            ReturnedBallot(
                tenant_id=tenant_id,
                tracking_number=generate_code("RB"),
                submitted_full_name=extracted["full_name"],
                submitted_address=extracted["address"],
                envelope_scan_image_path=relative_path,
                ocr_raw_response=extracted["raw"],
                status=ReturnedBallotStatus.received,
            )
        )
        self.ballots.add_event(
            ballot, "received", actor, metadata={"source": "scan_ocr", "confidence": extracted["confidence"]}
        )
        self.ballots.commit()
        return self.get_ballot(tenant_id, ballot.id)

    def match_voter(self, tenant_id: int, actor: User, ballot_id: int, voter_id: int) -> ReturnedBallot:
        ballot = self.get_ballot(tenant_id, ballot_id)
        if ballot.status != ReturnedBallotStatus.received:
            raise ValidationError("Only pending ballots can be re-matched")

        self._attach_voter_and_application(tenant_id, ballot, voter_id)
        self.ballots.add_event(ballot, "matched_voter", actor, metadata={"voter_id": voter_id})
        self.ballots.commit()
        return self.get_ballot(tenant_id, ballot.id)

    def verify(self, tenant_id: int, actor: User, ballot_id: int, verification_checklist: dict[str, bool]) -> ReturnedBallot:
        ballot = self.get_ballot(tenant_id, ballot_id)
        tenant = self.tenants.get(tenant_id)

        if ballot.status != ReturnedBallotStatus.received:
            raise ValidationError("Only pending ballots can be verified")
        if not ballot.voter_id:
            raise ValidationError("Match this ballot to a voter before final approval")

        missing = missing_verification_checks(tenant.verification_methods, verification_checklist)
        if missing:
            raise ValidationError(
                f"Confirm all required verification checks before final approval: {', '.join(sorted(missing))}"
            )

        ballot.status = ReturnedBallotStatus.verified
        ballot.processed_by_user_id = actor.id
        ballot.processed_at = _now()
        self.ballots.add_event(
            ballot,
            "verified",
            actor,
            metadata={
                "note": "routed to Final Bin for Election Day counting",
                "verification_checklist": verification_checklist,
            },
        )
        self.ballots.commit()
        return self.get_ballot(tenant_id, ballot.id)

    def reject(
        self, tenant_id: int, actor: User, ballot_id: int, reason: ReturnedBallotRejectionReason
    ) -> ReturnedBallot:
        ballot = self.get_ballot(tenant_id, ballot_id)
        if ballot.status != ReturnedBallotStatus.received:
            raise ValidationError("Only pending ballots can be rejected")

        ballot.status = ReturnedBallotStatus.rejected
        ballot.rejection_reason = reason
        ballot.processed_by_user_id = actor.id
        ballot.processed_at = _now()
        self.ballots.add_event(ballot, "rejected", actor, reason=reason.value)
        self.ballots.commit()
        return self.get_ballot(tenant_id, ballot.id)
