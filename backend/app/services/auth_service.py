from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, ValidationError
from app.core.security import create_access_token, verify_password
from app.models.models import User
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository


class AuthService:
    """Login/authentication business rules, independent of the HTTP layer."""

    def __init__(self, db: Session, users: UserRepository | None = None, tenants: TenantRepository | None = None):
        self.db = db
        self.users = users or UserRepository(db)
        self.tenants = tenants or TenantRepository(db)

    def login(self, email: str, password: str, tenant_slug: str | None) -> tuple[User, str, str | None]:
        """Returns (user, access_token, tenant_slug) or raises a ValidationError."""
        tenant = None
        if tenant_slug:
            tenant = self.tenants.get_by_slug(tenant_slug, active_only=True)
            if not tenant:
                raise ValidationError("Invalid tenant or credentials")

        user = self.users.find_for_login(email, tenant.id if tenant else None)
        if not user or not verify_password(password, user.hashed_password):
            raise ValidationError("Invalid credentials")
        if not user.is_active:
            raise ForbiddenError("Account disabled")

        token = create_access_token({"sub": str(user.id), "role": user.role.value, "tenant_id": user.tenant_id})

        resolved_slug = tenant.slug if tenant else None
        if not resolved_slug and user.tenant_id:
            user_tenant = self.tenants.get(user.tenant_id)
            resolved_slug = user_tenant.slug if user_tenant else None

        return user, token, resolved_slug
