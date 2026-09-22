import re

from apps.admin_portal.models import ModerationIncident


PHONE_PATTERN = re.compile(r"(\+?\d[\d\-\s]{7,}\d)")
EMAIL_PATTERN = re.compile(r"\b[\w\.-]+@[\w\.-]+\.\w+\b")


class ModerationService:
    KEYWORDS = (
        "whatsapp",
        "telegram",
        "imo",
        "facebook",
        "messenger",
        "call me",
        "email me",
        "contact me",
    )

    @classmethod
    def detect_contact_sharing(cls, text: str) -> list[str]:
        haystack = (text or "").lower()
        matches = [keyword for keyword in cls.KEYWORDS if keyword in haystack]
        if PHONE_PATTERN.search(text or ""):
            matches.append("phone")
        if EMAIL_PATTERN.search(text or ""):
            matches.append("email")
        return sorted(set(matches))

    @classmethod
    def flag_and_raise(cls, *, user, source_type: str, source_id=None, text: str):
        matches = cls.detect_contact_sharing(text)
        if not matches:
            return
        ModerationIncident.objects.create(
            reported_user=user,
            source_type=source_type,
            source_id=source_id,
            matched_terms=matches,
            content_excerpt=(text or "")[:500],
        )
        raise ValueError("Contact sharing is not allowed.")
