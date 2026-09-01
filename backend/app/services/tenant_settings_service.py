from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.models.models import Tenant, User, UserRole
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.services.storage import FileStorage, get_file_storage


class TenantSettingsService:
    """Tenant self-service configuration: reason lists, branding, team management.

    Distinct from TenantService (superadmin-facing provisioning) because the
    caller here is always scoped to their own tenant_id -- never cross-tenant,
    and it exposes only the subset of config a tenant_admin should control
    (not rate limits, processing_mode, jurisdiction_state, or activation).
    """

    def __init__(
        self,
        db: Session,
        tenants: TenantRepository | None = None,
        users: UserRepository | None = None,
        storage: FileStorage | None = None,
    ):
        self.db = db
        self.tenants = tenants or TenantRepository(db)
        self.users = users or UserRepository(db)
        self.storage = storage or get_file_storage()

    def _get_or_404(self, tenant_id: int) -> Tenant:
        tenant = self.tenants.get(tenant_id)
        if not tenant:
            raise NotFoundError("Tenant not found")
        return tenant

    def update_reason_lists(self, tenant_id: int, payload) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        if payload.application_rejection_reasons is not None:
            tenant.application_rejection_reasons = payload.application_rejection_reasons
        if payload.application_cure_reasons is not None:
            tenant.application_cure_reasons = payload.application_cure_reasons
        if payload.ballot_rejection_reasons is not None:
            tenant.ballot_rejection_reasons = payload.ballot_rejection_reasons
        if payload.received_via_options is not None:
            tenant.received_via_options = payload.received_via_options
        self.tenants.commit()
        self.tenants.refresh(tenant)
        return tenant

    def update_branding(self, tenant_id: int, payload) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        if payload.display_name is not None:
            tenant.display_name = payload.display_name or None
        if payload.currency is not None:
            tenant.currency = payload.currency.upper()
        self.tenants.commit()
        self.tenants.refresh(tenant)
        return tenant

    def upload_logo(self, tenant_id: int, filename: str, content: bytes) -> Tenant:
        tenant = self._get_or_404(tenant_id)
        tenant.logo_image_path = self.storage.save(tenant_id, "branding", filename, content)
        self.tenants.commit()
        self.tenants.refresh(tenant)
        return tenant

    def get_logo_path(self, tenant_id: int):
        tenant = self._get_or_404(tenant_id)
        if not tenant.logo_image_path:
            raise NotFoundError("No logo uploaded for this tenant")
        path = self.storage.resolve(tenant.logo_image_path)
        if not path.exists():
            raise NotFoundError("Logo file missing")
        return path

    def list_users(self, tenant_id: int) -> list[User]:
        return self.users.list_by_tenant(tenant_id)

    def create_user(self, tenant_id: int, payload) -> User:
        if payload.role == UserRole.superadmin:
            raise ConflictError("Cannot create a superadmin account from tenant settings")
        if self.users.get_by_email_in_tenant(tenant_id, payload.email):
            raise ConflictError("A user with this email already exists in this tenant")
        user = self.users.add(
            User(
                tenant_id=tenant_id,
                email=payload.email,
                hashed_password=hash_password(payload.password),
                role=payload.role,
            )
        )
        self.users.commit()
        self.users.refresh(user)
        return user

    def set_user_status(self, tenant_id: int, user_id: int, is_active: bool) -> User:
        user = self.users.get_in_tenant(tenant_id, user_id)
        if not user:
            raise NotFoundError("User not found")
        user.is_active = is_active
        self.users.commit()
        self.users.refresh(user)
        return user
