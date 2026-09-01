from sqlalchemy.orm import Session

from app.models.models import User, UserRole


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_for_login(self, email: str, tenant_id: int | None) -> User | None:
        q = self.db.query(User).filter(User.email == email)
        if tenant_id is not None:
            q = q.filter(User.tenant_id == tenant_id)
        else:
            q = q.filter(User.role == UserRole.superadmin)
        return q.first()

    def add(self, user: User) -> User:
        self.db.add(user)
        return user

    def list_by_tenant(self, tenant_id: int) -> list[User]:
        return self.db.query(User).filter(User.tenant_id == tenant_id).order_by(User.created_at).all()

    def get_in_tenant(self, tenant_id: int, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id, User.tenant_id == tenant_id).first()

    def get_by_email_in_tenant(self, tenant_id: int, email: str) -> User | None:
        return self.db.query(User).filter(User.tenant_id == tenant_id, User.email == email).first()

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, user: User) -> None:
        self.db.refresh(user)
