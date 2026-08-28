"""Jurisdiction-configurable verification checklist rules (PRD section 2).

Pure, framework-free logic so it's independently testable and shared by
both the absentee-application and returned-ballot workflows instead of
being duplicated across their routers/services.
"""


def missing_verification_checks(required_methods: list[str] | None, checklist: dict[str, bool]) -> set[str]:
    """Return which of the tenant's required verification methods were not confirmed."""
    required = set(required_methods or [])
    checked = {method for method, confirmed in checklist.items() if confirmed}
    return required - checked
