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
