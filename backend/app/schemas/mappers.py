"""ORM -> response-schema mappers shared across routers.

Kept separate from the services (which return ORM entities) and from the
routers (thin HTTP glue) so this mapping logic has exactly one home instead
of being copy-pasted in every router that touches a Voter or an event.
"""

from app.models.models import AbsenteeApplication, ApplicationEvent, ReturnedBallot, ReturnedBallotEvent, Tenant, Voter
from app.schemas.schemas import (
    ApplicationEventOut,
    ApplicationListItem,
    ApplicationOut,
    MyTenantSummary,
    OriginalApplicationSummary,
    ReturnedBallotEventOut,
    ReturnedBallotListItem,
    ReturnedBallotOut,
    TenantOut,
    VoterListItem,
    VoterOut,
)


def tenant_to_out(tenant: Tenant) -> TenantOut:
    return TenantOut(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        is_active=tenant.is_active,
        created_at=tenant.created_at,
        requests_per_minute=tenant.rate_limit.requests_per_minute if tenant.rate_limit else None,
        processing_mode=tenant.processing_mode,
        jurisdiction_state=tenant.jurisdiction_state,
        cure_notification_method=tenant.cure_notification_method,
        verification_methods=tenant.verification_methods or [],
    )


def tenant_to_my_summary(tenant: Tenant) -> MyTenantSummary:
    return MyTenantSummary(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        requests_per_minute=tenant.rate_limit.requests_per_minute if tenant.rate_limit else None,
        processing_mode=tenant.processing_mode.value,
        jurisdiction_state=tenant.jurisdiction_state,
        verification_methods=tenant.verification_methods or [],
    )


def voter_to_out(voter: Voter) -> VoterOut:
    return VoterOut(
        id=voter.id,
        external_voter_id=voter.external_voter_id,
        full_name=voter.full_name,
        registered_address=voter.registered_address,
        date_of_birth=voter.date_of_birth,
        dl_number=voter.dl_number,
        veteran_id=voter.veteran_id,
        passport_id=voter.passport_id,
        has_signature=bool(voter.signature_image_path),
    )


def voter_to_list_item(voter: Voter) -> VoterListItem:
    return VoterListItem(
        id=voter.id,
        external_voter_id=voter.external_voter_id,
        full_name=voter.full_name,
        registered_address=voter.registered_address,
        dl_number=voter.dl_number,
        has_signature=bool(voter.signature_image_path),
    )


def application_event_to_out(event: ApplicationEvent) -> ApplicationEventOut:
    return ApplicationEventOut(
        id=event.id,
        action=event.action,
        actor_user_id=event.actor_user_id,
        reason=event.reason,
        created_at=event.created_at,
    )


def returned_ballot_event_to_out(event: ReturnedBallotEvent) -> ReturnedBallotEventOut:
    return ReturnedBallotEventOut(
        id=event.id,
        action=event.action,
        actor_user_id=event.actor_user_id,
        reason=event.reason,
        created_at=event.created_at,
    )


def application_to_list_item(app_: AbsenteeApplication) -> ApplicationListItem:
    return ApplicationListItem(
        id=app_.id,
        application_number=app_.application_number,
        status=app_.status,
        submitted_full_name=app_.submitted_full_name,
        voter_id=app_.voter_id,
        voter_matched_name=app_.voter.full_name if app_.voter else None,
        is_reapproval=app_.is_reapproval,
        parent_application_id=app_.parent_application_id,
        created_at=app_.created_at,
        updated_at=app_.updated_at,
    )


def application_to_out(app_: AbsenteeApplication) -> ApplicationOut:
    return ApplicationOut(
        id=app_.id,
        application_number=app_.application_number,
        status=app_.status,
        submitted_full_name=app_.submitted_full_name,
        submitted_address=app_.submitted_address,
        submitted_dl_number=app_.submitted_dl_number,
        voter_id=app_.voter_id,
        voter=voter_to_out(app_.voter) if app_.voter else None,
        parent_application_id=app_.parent_application_id,
        is_reapproval=app_.is_reapproval,
        has_scan_image=bool(app_.scan_image_path),
        rejection_reason=app_.rejection_reason,
        cure_reason=app_.cure_reason,
        cure_notified_via=app_.cure_notified_via,
        processed_at=app_.processed_at,
        created_at=app_.created_at,
        updated_at=app_.updated_at,
        events=[application_event_to_out(e) for e in app_.events],
    )


def returned_ballot_to_list_item(ballot: ReturnedBallot) -> ReturnedBallotListItem:
    return ReturnedBallotListItem(
        id=ballot.id,
        tracking_number=ballot.tracking_number,
        status=ballot.status,
        submitted_full_name=ballot.submitted_full_name,
        voter_id=ballot.voter_id,
        voter_matched_name=ballot.voter.full_name if ballot.voter else None,
        created_at=ballot.created_at,
        updated_at=ballot.updated_at,
    )


def returned_ballot_to_out(ballot: ReturnedBallot) -> ReturnedBallotOut:
    original_out = None
    if ballot.absentee_application:
        a = ballot.absentee_application
        original_out = OriginalApplicationSummary(
            id=a.id,
            application_number=a.application_number,
            status=a.status,
            submitted_full_name=a.submitted_full_name,
            submitted_address=a.submitted_address,
            submitted_dl_number=a.submitted_dl_number,
            processed_at=a.processed_at,
        )
    return ReturnedBallotOut(
        id=ballot.id,
        tracking_number=ballot.tracking_number,
        status=ballot.status,
        submitted_full_name=ballot.submitted_full_name,
        submitted_address=ballot.submitted_address,
        voter_id=ballot.voter_id,
        voter=voter_to_out(ballot.voter) if ballot.voter else None,
        absentee_application_id=ballot.absentee_application_id,
        original_application=original_out,
        has_envelope_scan=bool(ballot.envelope_scan_image_path),
        rejection_reason=ballot.rejection_reason,
        processed_at=ballot.processed_at,
        created_at=ballot.created_at,
        updated_at=ballot.updated_at,
        events=[returned_ballot_event_to_out(e) for e in ballot.events],
    )
