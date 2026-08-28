"""Framework-agnostic domain errors.

Services raise these instead of FastAPI's HTTPException, so the business
layer has no dependency on the web framework (Dependency Inversion). A
single exception handler (registered in main.py) translates them to HTTP
responses at the boundary.
"""


class DomainError(Exception):
    status_code = 400

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class ValidationError(DomainError):
    status_code = 400


class ForbiddenError(DomainError):
    status_code = 403
