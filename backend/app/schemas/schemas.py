from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.models import (
    ApplicationStatus,
    CureNotificationMethod,
    ProcessingMode,
    ReturnedBallotStatus,
    UserRole,
    VerificationMethod,
)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_slug: str | None = Field(default=None, description="Omit for superadmin login")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    tenant_slug: str | None = None
    email: EmailStr


class TenantCreate(BaseModel):
    name: str
    slug: str
    admin_email: EmailStr
    admin_password: str
    requests_per_minute: int = 120
    processing_mode: ProcessingMode = ProcessingMode.manual
    jurisdiction_state: str | None = Field(default=None, max_length=2)
    cure_notification_method: CureNotificationMethod = CureNotificationMethod.email
    verification_methods: list[VerificationMethod] | None = Field(
        default=None, description="Omit to use the state-based default (GA vs. other)"
    )


class TenantOut(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    created_at: datetime
    requests_per_minute: int | None = None
    processing_mode: ProcessingMode
    jurisdiction_state: str | None
    cure_notification_method: CureNotificationMethod
    verification_methods: list[str]

    class Config:
        from_attributes = True


class TenantConfigUpdate(BaseModel):
    processing_mode: ProcessingMode | None = None
    jurisdiction_state: str | None = Field(default=None, max_length=2)
    cure_notification_method: CureNotificationMethod | None = None
    verification_methods: list[VerificationMethod] | None = None


class ReasonListsUpdate(BaseModel):
    application_rejection_reasons: list[str] | None = None
    application_cure_reasons: list[str] | None = None
    ballot_rejection_reasons: list[str] | None = None
    received_via_options: list[str] | None = None


class BrandingUpdate(BaseModel):
    display_name: str | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)


class TenantUserOut(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TenantUserCreate(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.tenant_user


class RateLimitUpdate(BaseModel):
    requests_per_minute: int = Field(gt=0, le=100000)


class UsageLogOut(BaseModel):
    id: int
    tenant_id: int | None
    user_id: int | None
    method: str
    path: str
    status_code: int
    duration_ms: int
    was_rate_limited: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UsageLogPage(BaseModel):
    items: list[UsageLogOut]
    total: int
    offset: int
    limit: int


class UsageSummary(BaseModel):
    tenant_id: int | None
    tenant_name: str | None
    total_requests: int
    rate_limited_requests: int
    avg_duration_ms: float
    requests_per_minute_limit: int | None


class VoterSearchResult(BaseModel):
    id: int
    full_name: str
    registered_address: str
    dl_number: str | None

    class Config:
        from_attributes = True


class VoterOut(BaseModel):
    id: int
    external_voter_id: str | None
    full_name: str
    registered_address: str
    date_of_birth: date | None
    dl_number: str | None
    veteran_id: str | None
    passport_id: str | None
    has_signature: bool

    class Config:
        from_attributes = True


class VoterCreate(BaseModel):
    full_name: str
    registered_address: str
    external_voter_id: str | None = None
    date_of_birth: date | None = None
    dl_number: str | None = None
    veteran_id: str | None = None
    passport_id: str | None = None


class VoterUpdate(BaseModel):
    full_name: str | None = None
    registered_address: str | None = None
    external_voter_id: str | None = None
    date_of_birth: date | None = None
    dl_number: str | None = None
    veteran_id: str | None = None
    passport_id: str | None = None


class VoterListItem(BaseModel):
    id: int
    external_voter_id: str | None
    full_name: str
    registered_address: str
    dl_number: str | None
    has_signature: bool

    class Config:
        from_attributes = True


class VoterListPage(BaseModel):
    items: list[VoterListItem]
    total: int
    offset: int
    limit: int


class VoterImportRowError(BaseModel):
    row: int
    error: str


class VoterImportSummary(BaseModel):
    created: int
    updated: int
    skipped: int
    errors: list[VoterImportRowError]
    warnings: list[VoterImportRowError] = Field(default_factory=list)


class ApplicationCreate(BaseModel):
    submitted_full_name: str
    submitted_address: str
    submitted_dl_number: str | None = None
    mailing_address: str | None = None
    received_via: str | None = None
    voter_id: int | None = None


class ApplicationEventOut(BaseModel):
    id: int
    action: str
    actor_user_id: int | None
    actor_email: str | None = None
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationListItem(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_full_name: str
    voter_id: int | None
    voter_matched_name: str | None = None
    is_reapproval: bool
    parent_application_id: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationOut(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_full_name: str
    submitted_address: str
    submitted_dl_number: str | None
    mailing_address: str | None
    received_via: str | None
    voter_id: int | None
    voter: VoterOut | None = None
    parent_application_id: int | None
    is_reapproval: bool
    has_scan_image: bool
    has_signature: bool
    rejection_reason: str | None
    cure_reason: str | None
    cure_notified_via: str | None
    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    events: list[ApplicationEventOut] = []

    class Config:
        from_attributes = True


class ApplicationUpdate(BaseModel):
    submitted_full_name: str | None = None
    submitted_address: str | None = None
    submitted_dl_number: str | None = None
    mailing_address: str | None = None
    received_via: str | None = None


class MatchVoterRequest(BaseModel):
    voter_id: int


class RejectRequest(BaseModel):
    reason: str


class CureRequest(BaseModel):
    reason: str
    notify_via: CureNotificationMethod = CureNotificationMethod.email


class ApproveRequest(BaseModel):
    verification_checklist: dict[str, bool] = Field(default_factory=dict)


class VerifyBallotRequest(BaseModel):
    verification_checklist: dict[str, bool] = Field(default_factory=dict)


class DashboardSummary(BaseModel):
    daily_incoming_requests: int
    completed_ballots_received: int
    current_queued_items: int
    items_in_cure_process: int


class OriginalApplicationSummary(BaseModel):
    id: int
    application_number: str
    status: ApplicationStatus
    submitted_full_name: str
    submitted_address: str
    submitted_dl_number: str | None
    has_signature: bool
    processed_at: datetime | None

    class Config:
        from_attributes = True


class ReturnedBallotCreate(BaseModel):
    submitted_full_name: str
    submitted_address: str
    voter_id: int | None = None


class ReturnedBallotEventOut(BaseModel):
    id: int
    action: str
    actor_user_id: int | None
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class ReturnedBallotListItem(BaseModel):
    id: int
    tracking_number: str
    status: ReturnedBallotStatus
    submitted_full_name: str
    voter_id: int | None
    voter_matched_name: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReturnedBallotOut(BaseModel):
    id: int
    tracking_number: str
    status: ReturnedBallotStatus
    submitted_full_name: str
    submitted_address: str
    voter_id: int | None
    voter: VoterOut | None = None
    absentee_application_id: int | None
    original_application: OriginalApplicationSummary | None = None
    has_envelope_scan: bool
    rejection_reason: str | None
    processed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    events: list[ReturnedBallotEventOut] = []

    class Config:
        from_attributes = True


class ReturnedBallotRejectRequest(BaseModel):
    reason: str


class MyTenantSummary(BaseModel):
    id: int
    name: str
    slug: str
    display_name: str | None
    has_logo: bool
    currency: str
    requests_per_minute: int | None
    processing_mode: str
    jurisdiction_state: str | None
    verification_methods: list[str]
    application_rejection_reasons: list[str]
    application_cure_reasons: list[str]
    ballot_rejection_reasons: list[str]
    received_via_options: list[str]


class MeResponse(BaseModel):
    email: EmailStr
    role: UserRole
    tenant: MyTenantSummary | None
