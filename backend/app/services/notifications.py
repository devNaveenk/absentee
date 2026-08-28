"""Voter notification delivery (Cure notices, etc).

Same shape as OCRProvider/FileStorage: an abstract interface with a stub
implementation. Swap in a real email/mail provider (e.g. SendGrid, SES,
a print-and-mail vendor) later without touching the services that call it.
"""

from abc import ABC, abstractmethod


class NotificationProvider(ABC):
    @abstractmethod
    def send_cure_notice(self, *, voter_name: str, method: str, reason: str) -> dict:
        """Send a cure notice to the voter. Returns a delivery receipt/log entry."""


class StubNotificationProvider(NotificationProvider):
    def send_cure_notice(self, *, voter_name: str, method: str, reason: str) -> dict:
        return {
            "provider": "stub",
            "delivered": False,
            "note": "Notification provider not yet configured; recorded for audit only.",
            "voter_name": voter_name,
            "method": method,
            "reason": reason,
        }


def get_notification_provider() -> NotificationProvider:
    return StubNotificationProvider()
