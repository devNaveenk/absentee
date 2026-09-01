"""Voter notification delivery (Cure notices, etc).

Same shape as OCRProvider/FileStorage: an abstract interface with a stub
implementation, plus real Postmark (email) and Twilio (SMS) providers that
activate the moment their env vars are set -- see app/core/config.py. Until
then, get_notification_provider() falls back to the audit-only stub, so
nothing needs to change in the calling code (application_service.cure())
when real credentials eventually arrive.
"""

from abc import ABC, abstractmethod

import httpx

from app.core.config import settings


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


class PostmarkEmailProvider(NotificationProvider):
    """Sends via Postmark's plain REST API. Requires POSTMARK_API_KEY/POSTMARK_FROM_EMAIL."""

    def __init__(self, api_key: str, from_email: str, to_email: str | None = None):
        self.api_key = api_key
        self.from_email = from_email
        self.to_email = to_email

    def send_cure_notice(self, *, voter_name: str, method: str, reason: str) -> dict:
        if not self.to_email:
            return {
                "provider": "postmark",
                "delivered": False,
                "note": "No email address on file for this voter/tenant contact.",
                "voter_name": voter_name,
                "method": method,
                "reason": reason,
            }
        try:
            response = httpx.post(
                "https://api.postmarkapp.com/email",
                headers={"X-Postmark-Server-Token": self.api_key, "Accept": "application/json"},
                json={
                    "From": self.from_email,
                    "To": self.to_email,
                    "Subject": "Action needed on your absentee ballot application",
                    "TextBody": f"Hi {voter_name}, your application needs correction: {reason}.",
                },
                timeout=10,
            )
            response.raise_for_status()
            return {"provider": "postmark", "delivered": True, "voter_name": voter_name, "method": method, "reason": reason}
        except httpx.HTTPError as exc:
            return {"provider": "postmark", "delivered": False, "error": str(exc), "voter_name": voter_name, "method": method, "reason": reason}


class TwilioSmsProvider(NotificationProvider):
    """Sends via Twilio's REST API. Requires TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER."""

    def __init__(self, account_sid: str, auth_token: str, from_number: str, to_number: str | None = None):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self.to_number = to_number

    def send_cure_notice(self, *, voter_name: str, method: str, reason: str) -> dict:
        if not self.to_number:
            return {
                "provider": "twilio",
                "delivered": False,
                "note": "No phone number on file for this voter/tenant contact.",
                "voter_name": voter_name,
                "method": method,
                "reason": reason,
            }
        try:
            response = httpx.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json",
                auth=(self.account_sid, self.auth_token),
                data={
                    "From": self.from_number,
                    "To": self.to_number,
                    "Body": f"BallotDA: Hi {voter_name}, your absentee application needs correction: {reason}.",
                },
                timeout=10,
            )
            response.raise_for_status()
            return {"provider": "twilio", "delivered": True, "voter_name": voter_name, "method": method, "reason": reason}
        except httpx.HTTPError as exc:
            return {"provider": "twilio", "delivered": False, "error": str(exc), "voter_name": voter_name, "method": method, "reason": reason}


class CompositeNotificationProvider(NotificationProvider):
    """Dispatches to Postmark/Twilio/stub depending on the requested method."""

    def __init__(self):
        self._email = (
            PostmarkEmailProvider(settings.postmark_api_key, settings.postmark_from_email)
            if settings.postmark_api_key and settings.postmark_from_email
            else StubNotificationProvider()
        )
        self._sms = (
            TwilioSmsProvider(settings.twilio_account_sid, settings.twilio_auth_token, settings.twilio_from_number)
            if settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number
            else StubNotificationProvider()
        )
        self._mail = StubNotificationProvider()  # physical mail isn't automatable

    def send_cure_notice(self, *, voter_name: str, method: str, reason: str) -> dict:
        if method == "email":
            return self._email.send_cure_notice(voter_name=voter_name, method=method, reason=reason)
        if method == "sms":
            return self._sms.send_cure_notice(voter_name=voter_name, method=method, reason=reason)
        if method == "mail":
            return self._mail.send_cure_notice(voter_name=voter_name, method=method, reason=reason)
        if method == "both":
            email_receipt = self._email.send_cure_notice(voter_name=voter_name, method="email", reason=reason)
            sms_receipt = self._sms.send_cure_notice(voter_name=voter_name, method="sms", reason=reason)
            return {"provider": "composite", "email": email_receipt, "sms": sms_receipt}
        return self._mail.send_cure_notice(voter_name=voter_name, method=method, reason=reason)


def get_notification_provider() -> NotificationProvider:
    return CompositeNotificationProvider()
