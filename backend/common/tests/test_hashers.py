import bcrypt

from django.contrib.auth.hashers import check_password
from django.test import SimpleTestCase

from common.hashers import LaravelBcryptPasswordHasher


class LaravelBcryptPasswordHasherTests(SimpleTestCase):
    def test_imported_laravel_hash_verifies(self):
        password = "Secret123!"
        raw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        legacy_hash = "$2y$" + raw_hash[4:]
        encoded = LaravelBcryptPasswordHasher().encode_legacy_hash(legacy_hash)

        self.assertTrue(check_password(password, encoded))
        self.assertFalse(check_password("WrongPass1!", encoded))

