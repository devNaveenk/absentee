"""Create the initial superadmin user.

Usage:
    python scripts/seed_superadmin.py admin@ballotda.com yourpassword
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.models import User, UserRole


def main(email: str, password: str) -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email, User.role == UserRole.superadmin).first():
            print(f"Superadmin {email} already exists.")
            return
        db.add(User(email=email, hashed_password=hash_password(password), role=UserRole.superadmin))
        db.commit()
        print(f"Created superadmin: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
