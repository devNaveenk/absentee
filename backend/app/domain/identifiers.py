"""Human-readable record identifier generation.

Shared by absentee applications (APP-...) and returned ballots (RB-...)
instead of each router rolling its own uuid formatting.
"""

import uuid


def generate_code(prefix: str, length: int = 10) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:length].upper()}"
