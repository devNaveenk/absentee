import enum
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import AuditEventMixin


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    tenant_admin = "tenant_admin"
    tenant_user = "tenant_user"


class ProcessingMode(str, enum.Enum):
    scan = "scan"
    manual = "manual"


class CureNotificationMethod(str, enum.Enum):
    email = "email"
    mail = "mail"
    both = "both"


class VerificationMethod(str, enum.Enum):
    """Configurable per-tenant verification checklist, per PRD section 2.

    Georgia tenants default to full_name + address + dl_number. Other
    jurisdictions may configure additional/alternate methods: signature
    comparison, veteran ID, passport ID, or other jurisdiction-approved IDs.
    """

    full_name = "full_name"
    address = "address"
    dl_number = "dl_number"
    signature = "signature"
    veteran_id = "veteran_id"
    passport_id = "passport_id"


DEFAULT_VERIFICATION_METHODS_GA = [
    VerificationMethod.full_name.value,
    VerificationMethod.address.value,
    VerificationMethod.dl_number.value,
]
DEFAULT_VERIFICATION_METHODS_OTHER = [
    VerificationMethod.full_name.value,
    VerificationMethod.address.value,
    VerificationMethod.signature.value,
]


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    processing_mode: Mapped[ProcessingMode] = mapped_column(Enum(ProcessingMode), default=ProcessingMode.manual)
    jurisdiction_state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    cure_notification_method: Mapped[CureNotificationMethod] = mapped_column(
        Enum(CureNotificationMethod), default=CureNotificationMethod.email
    )
    verification_methods: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    users: Mapped[list["User"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")
    rate_limit: Mapped["RateLimitConfig"] = relationship(
        back_populates="tenant", uselist=False, cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email", name="uq_tenant_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.tenant_user)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tenant: Mapped["Tenant | None"] = relationship(back_populates="users")


class RateLimitConfig(Base):
    __tablename__ = "rate_limit_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, nullable=False)
    requests_per_minute: Mapped[int] = mapped_column(Integer, default=120)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tenant: Mapped["Tenant"] = relationship(back_populates="rate_limit")


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tenant_id: Mapped[int | None] = mapped_column(ForeignKey("tenants.id"), nullable=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    method: Mapped[str] = mapped_column(String(10))
    path: Mapped[str] = mapped_column(String(500))
    status_code: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[int] = mapped_column(Integer)
    was_rate_limited: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class Voter(Base):
    __tablename__ = "voters"
    __table_args__ = (
        UniqueConstraint("tenant_id", "external_voter_id", name="uq_tenant_external_voter"),
        Index("ix_voters_tenant_dl", "tenant_id", "dl_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    external_voter_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    registered_address: Mapped[str] = mapped_column(String(500), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    dl_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    veteran_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    passport_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    signature_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    tenant: Mapped["Tenant"] = relationship()


class ApplicationStatus(str, enum.Enum):
    unprocessed = "unprocessed"
    rejected = "rejected"
    cure = "cure"
    reapproved = "reapproved"
    abs_sent = "abs_sent"


class RejectionReason(str, enum.Enum):
    out_of_district = "out_of_district"
    record_not_found = "record_not_found"


class CureReason(str, enum.Enum):
    name_mismatch = "name_mismatch"
    dl_mismatch = "dl_mismatch"
    other = "other"


class AbsenteeApplication(Base):
    __tablename__ = "absentee_applications"
    __table_args__ = (UniqueConstraint("tenant_id", "application_number", name="uq_tenant_application_number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    application_number: Mapped[str] = mapped_column(String(50), nullable=False)

    voter_id: Mapped[int | None] = mapped_column(ForeignKey("voters.id"), nullable=True, index=True)
    parent_application_id: Mapped[int | None] = mapped_column(
        ForeignKey("absentee_applications.id"), nullable=True, index=True
    )
    is_reapproval: Mapped[bool] = mapped_column(Boolean, default=False)

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.unprocessed, index=True
    )

    submitted_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    submitted_address: Mapped[str] = mapped_column(String(500), nullable=False)
    submitted_dl_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    scan_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ocr_raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    rejection_reason: Mapped[RejectionReason | None] = mapped_column(Enum(RejectionReason), nullable=True)
    cure_reason: Mapped[CureReason | None] = mapped_column(Enum(CureReason), nullable=True)
    cure_notified_via: Mapped[str | None] = mapped_column(String(20), nullable=True)

    processed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tenant: Mapped["Tenant"] = relationship()
    voter: Mapped["Voter | None"] = relationship()
    parent: Mapped["AbsenteeApplication | None"] = relationship(remote_side=[id])
    events: Mapped[list["ApplicationEvent"]] = relationship(
        back_populates="application", cascade="all, delete-orphan", order_by="ApplicationEvent.created_at"
    )


class ApplicationEvent(AuditEventMixin, Base):
    __tablename__ = "application_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("absentee_applications.id"), nullable=False, index=True
    )

    application: Mapped["AbsenteeApplication"] = relationship(back_populates="events")


class ReturnedBallotStatus(str, enum.Enum):
    received = "received"
    verified = "verified"
    rejected = "rejected"


class ReturnedBallotRejectionReason(str, enum.Enum):
    already_voted_in_person = "already_voted_in_person"
    moved_outside_jurisdiction = "moved_outside_jurisdiction"
    deceased = "deceased"
    credential_mismatch = "credential_mismatch"
    signature_mismatch = "signature_mismatch"


class ReturnedBallot(Base):
    """Phase 2: receipt and verification of a completed absentee ballot.

    Dual-envelope model -- only the outer envelope / flap is scanned and
    verified here to confirm voter identity; the inner ballot is never
    inspected by this system, preserving voter anonymity.
    """

    __tablename__ = "returned_ballots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    tracking_number: Mapped[str] = mapped_column(String(50), nullable=False)

    voter_id: Mapped[int | None] = mapped_column(ForeignKey("voters.id"), nullable=True, index=True)
    absentee_application_id: Mapped[int | None] = mapped_column(
        ForeignKey("absentee_applications.id"), nullable=True, index=True
    )

    status: Mapped[ReturnedBallotStatus] = mapped_column(
        Enum(ReturnedBallotStatus), default=ReturnedBallotStatus.received, index=True
    )

    submitted_full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    submitted_address: Mapped[str] = mapped_column(String(500), nullable=False)

    envelope_scan_image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ocr_raw_response: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    rejection_reason: Mapped[ReturnedBallotRejectionReason | None] = mapped_column(
        Enum(ReturnedBallotRejectionReason), nullable=True
    )

    processed_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tenant: Mapped["Tenant"] = relationship()
    voter: Mapped["Voter | None"] = relationship()
    absentee_application: Mapped["AbsenteeApplication | None"] = relationship()
    events: Mapped[list["ReturnedBallotEvent"]] = relationship(
        back_populates="returned_ballot", cascade="all, delete-orphan", order_by="ReturnedBallotEvent.created_at"
    )


class ReturnedBallotEvent(AuditEventMixin, Base):
    __tablename__ = "returned_ballot_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    returned_ballot_id: Mapped[int] = mapped_column(ForeignKey("returned_ballots.id"), nullable=False, index=True)

    returned_ballot: Mapped["ReturnedBallot"] = relationship(back_populates="events")
