from pathlib import Path

from .settings import *  # noqa: F403,F401


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",  # noqa: F405
    }
}

MEDIA_ROOT = BASE_DIR / "test-media"  # noqa: F405
PASSWORD_HASHERS = PASSWORD_HASHERS  # noqa: F405
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

