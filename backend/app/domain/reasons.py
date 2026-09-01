"""Tenant-configurable reason/option list validation.

Cure/reject reasons and "received via" options used to be fixed Python
enums; they're now free-text values a tenant defines for itself (mirrors
the legacy system's Configuration -> Settings lookup lists). This is the
one place that enforces a submitted value is actually one of the tenant's
configured options, framework-free like verification.py.
"""

from app.core.exceptions import ValidationError


def validate_reason(allowed: list[str] | None, value: str) -> None:
    if value not in (allowed or []):
        raise ValidationError(f"'{value}' is not a configured option for this tenant")
