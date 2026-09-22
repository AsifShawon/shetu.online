import bcrypt

from django.contrib.auth.hashers import BasePasswordHasher, mask_hash


class LaravelBcryptPasswordHasher(BasePasswordHasher):
    algorithm = "laravel_bcrypt"

    def salt(self):
        return ""

    def encode(self, password, salt):
        raise NotImplementedError("Laravel bcrypt hashes are imported, not generated directly.")

    def encode_legacy_hash(self, legacy_hash: str) -> str:
        return f"{self.algorithm}${legacy_hash}"

    def decode(self, encoded):
        algorithm, _, legacy_hash = encoded.partition("$")
        if algorithm != self.algorithm or not legacy_hash:
            raise ValueError("Invalid encoded Laravel bcrypt hash.")
        return {
            "algorithm": algorithm,
            "legacy_hash": legacy_hash,
        }

    def verify(self, password, encoded):
        legacy_hash = self.decode(encoded)["legacy_hash"]
        normalized_hash = self._normalize_hash(legacy_hash)
        return bcrypt.checkpw(password.encode("utf-8"), normalized_hash.encode("utf-8"))

    def must_update(self, encoded):
        return True

    def safe_summary(self, encoded):
        legacy_hash = self.decode(encoded)["legacy_hash"]
        return {
            "algorithm": self.algorithm,
            "hash": mask_hash(legacy_hash),
        }

    def _normalize_hash(self, legacy_hash: str) -> str:
        if legacy_hash.startswith("$2y$"):
            return "$2b$" + legacy_hash[4:]
        return legacy_hash
