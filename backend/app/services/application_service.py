from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.identifiers import generate_code
from app.domain.reasons import validate_reason
from app.domain.verification import missing_verification_checks
from app.models.models import AbsenteeApplication, ApplicationStatus, CureNotificationMethod, User
from app.repositories.application_repository import ApplicationRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.voter_repository import VoterRepository
from app.services.notifications import NotificationProvider, get_notification_provider
from app.services.ocr import OCRProvider, get_ocr_provider
from app.services.storage import FileStorage, get_file_storage


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ApplicationService:
    """Business rules for the absentee-application workflow (PRD Phase 1).

    Routers depend on this instead of touching SQLAlchemy or raising
    HTTPException directly: it's the single place that knows the valid
    status transitions, the verification-checklist gate, and how OCR /
    storage / notifications get invoked.
    """

    def __init__(
        self,
        db: Session,
        applications: ApplicationRepository | None = None,
        voters: VoterRepository | None = None,
        tenants: TenantRepository | None = None,
        ocr: OCRProvider | None = None,
        storage: FileStorage | None = None,
        notifications: NotificationProvider | None = None,
    ):
        self.db = db
        self.applications = applications or ApplicationRepository(db)
        self.voters = voters or VoterRepository(db)
        self.tenants = tenants or TenantRepository(db)
        self.ocr = ocr or get_ocr_provider()
        self.storage = storage or get_file_storage()
        self.notifications = notifications or get_notification_provider()

    def list_applications(self, tenant_id: int, *, view: str, status_filter, reapproval_only: bool, limit: int):
        return self.applications.list(
            tenant_id, view=view, status_filter=status_filter, reapproval_only=reapproval_only, limit=limit
        )

    def get_application(self, tenant_id: int, application_id: int) -> AbsenteeApplication:
        app_ = self.applications.get(tenant_id, application_id)
        if not app_:
            raise NotFoundError("Application not found")
        return app_

    def get_scan_image_path(self, tenant_id: int, application_id: int):
        app_ = self.get_application(tenant_id, application_id)
        if not app_.scan_image_path:
            raise NotFoundError("No scan image for this application")
        path = self.storage.resolve(app_.scan_image_path)
        if not path.exists():
            raise NotFoundError("Scan file missing")
        return path

    def get_signature_image_path(self, tenant_id: int, application_id: int):
        app_ = self.get_application(tenant_id, application_id)
        if not app_.signature_image_path:
            raise NotFoundError("No signature on file for this application")
        path = self.storage.resolve(app_.signature_image_path)
        if not path.exists():
            raise NotFoundError("Signature file missing")
        return path

    def set_signature(self, tenant_id: int, application_id: int, filename: str, content: bytes) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        app_.signature_image_path = self.storage.save(tenant_id, "application_signatures", filename, content)
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def create_manual(self, tenant_id: int, actor: User, payload) -> AbsenteeApplication:
        voter = None
        if payload.voter_id is not None:
            voter = self.voters.get(tenant_id, payload.voter_id)
            if not voter:
                raise NotFoundError("Voter not found")
        if payload.received_via:
            tenant = self.tenants.get(tenant_id)
            validate_reason(tenant.received_via_options, payload.received_via)

        app_ = self.applications.add(
            AbsenteeApplication(
                tenant_id=tenant_id,
                application_number=generate_code("APP"),
                voter_id=voter.id if voter else None,
                submitted_full_name=payload.submitted_full_name,
                submitted_address=payload.submitted_address,
                submitted_dl_number=payload.submitted_dl_number,
                mailing_address=payload.mailing_address,
                received_via=payload.received_via,
                status=ApplicationStatus.unprocessed,
            )
        )
        self.applications.add_event(app_, "created", actor, metadata={"source": "manual_entry"})
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    async def create_from_scan(self, tenant_id: int, actor: User, filename: str, content: bytes) -> AbsenteeApplication:
        tenant = self.tenants.get(tenant_id)
        if tenant.processing_mode.value != "scan":
            raise ValidationError("Tenant is in Manual Mode. Scanned intake with OCR is only available in Scan Mode.")

        relative_path = self.storage.save(tenant_id, "applications", filename, content)
        extracted = self.ocr.extract_application_fields(relative_path)

        app_ = self.applications.add(
            AbsenteeApplication(
                tenant_id=tenant_id,
                application_number=generate_code("APP"),
                submitted_full_name=extracted["full_name"],
                submitted_address=extracted["address"],
                submitted_dl_number=extracted["dl_number"] or None,
                scan_image_path=relative_path,
                ocr_raw_response=extracted["raw"],
                status=ApplicationStatus.unprocessed,
            )
        )
        self.applications.add_event(
            app_, "created", actor, metadata={"source": "scan_ocr", "confidence": extracted["confidence"]}
        )
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def update_fields(self, tenant_id: int, actor: User, application_id: int, payload) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        if app_.status != ApplicationStatus.unprocessed:
            raise ValidationError("Only unprocessed applications can be edited")

        if payload.received_via:
            tenant = self.tenants.get(tenant_id)
            validate_reason(tenant.received_via_options, payload.received_via)

        changed = {}
        for field in ("submitted_full_name", "submitted_address", "submitted_dl_number", "mailing_address", "received_via"):
            value = getattr(payload, field)
            if value is not None:
                setattr(app_, field, value)
                changed[field] = value

        if changed:
            self.applications.add_event(app_, "fields_edited", actor, metadata=changed)
            self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def match_voter(self, tenant_id: int, actor: User, application_id: int, voter_id: int) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        voter = self.voters.get(tenant_id, voter_id)
        if not voter:
            raise NotFoundError("Voter not found")

        app_.voter_id = voter.id
        self.applications.add_event(app_, "matched_voter", actor, metadata={"voter_id": voter.id})
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def approve(
        self, tenant_id: int, actor: User, application_id: int, verification_checklist: dict[str, bool]
    ) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        tenant = self.tenants.get(tenant_id)

        if app_.status != ApplicationStatus.unprocessed:
            raise ValidationError("Only unprocessed applications can be approved")
        if not app_.voter_id:
            raise ValidationError("Match this application to a voter before approving")

        missing = missing_verification_checks(tenant.verification_methods, verification_checklist)
        if missing:
            raise ValidationError(
                f"Confirm all required verification checks before approving: {', '.join(sorted(missing))}"
            )

        self.applications.add_event(
            app_, "approved", actor, metadata={"verification_checklist": verification_checklist}
        )
        app_.status = ApplicationStatus.approved
        app_.processed_by_user_id = actor.id
        app_.processed_at = _now()
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def mark_abs_sent(self, tenant_id: int, actor: User, application_id: int) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        if app_.status != ApplicationStatus.approved:
            raise ValidationError("Only approved applications can be marked as ABS Sent")

        app_.status = ApplicationStatus.abs_sent
        self.applications.add_event(app_, "abs_sent", actor, metadata={"note": "ballot packet mailed"})
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def reject(self, tenant_id: int, actor: User, application_id: int, reason: str) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        if app_.status != ApplicationStatus.unprocessed:
            raise ValidationError("Only unprocessed applications can be rejected")
        tenant = self.tenants.get(tenant_id)
        validate_reason(tenant.application_rejection_reasons, reason)

        app_.status = ApplicationStatus.rejected
        app_.rejection_reason = reason
        app_.processed_by_user_id = actor.id
        app_.processed_at = _now()
        self.applications.add_event(app_, "rejected", actor, reason=reason)
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def cure(
        self,
        tenant_id: int,
        actor: User,
        application_id: int,
        reason: str,
        notify_via: CureNotificationMethod,
    ) -> AbsenteeApplication:
        app_ = self.get_application(tenant_id, application_id)
        if app_.status != ApplicationStatus.unprocessed:
            raise ValidationError("Only unprocessed applications can be moved to cure")
        tenant = self.tenants.get(tenant_id)
        validate_reason(tenant.application_cure_reasons, reason)

        voter_name = app_.voter.full_name if app_.voter else app_.submitted_full_name
        delivery = self.notifications.send_cure_notice(voter_name=voter_name, method=notify_via.value, reason=reason)

        app_.status = ApplicationStatus.cure
        app_.cure_reason = reason
        app_.cure_notified_via = notify_via.value
        app_.processed_by_user_id = actor.id
        app_.processed_at = _now()
        self.applications.add_event(
            app_, "cure_initiated", actor, reason=reason, metadata={"notify_via": notify_via.value, "delivery": delivery}
        )
        self.applications.commit()
        return self.get_application(tenant_id, app_.id)

    def reapply(self, tenant_id: int, actor: User, application_id: int, payload) -> AbsenteeApplication:
        parent = self.get_application(tenant_id, application_id)
        if parent.status != ApplicationStatus.cure:
            raise ValidationError("Only applications in Cure status can be resubmitted")

        child = self.applications.add(
            AbsenteeApplication(
                tenant_id=tenant_id,
                application_number=generate_code("APP"),
                parent_application_id=parent.id,
                is_reapproval=True,
                voter_id=payload.voter_id or parent.voter_id,
                submitted_full_name=payload.submitted_full_name,
                submitted_address=payload.submitted_address,
                submitted_dl_number=payload.submitted_dl_number,
                mailing_address=payload.mailing_address,
                received_via=payload.received_via,
                status=ApplicationStatus.unprocessed,
            )
        )

        parent.status = ApplicationStatus.reapproved
        self.applications.add_event(parent, "reapproval_submitted", actor, metadata={"child_application_id": child.id})
        self.applications.add_event(
            child, "created", actor, metadata={"source": "cure_reapproval", "parent_application_id": parent.id}
        )

        self.applications.commit()
        return self.get_application(tenant_id, child.id)
