from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase

from common.services.import_v2 import LegacySqlDumpParser


class LegacySqlDumpParserTests(SimpleTestCase):
    def test_parses_multi_row_insert_and_escaped_strings(self):
        sql = """
CREATE TABLE `users` (
  `id` bigint NOT NULL
);
INSERT INTO `users` (`id`, `name`, `email`) VALUES
(1, 'Jane O\\'Neil', 'jane@example.com'),
(2, 'John Doe', NULL);
"""
        with TemporaryDirectory() as tmpdir:
            dump_path = Path(tmpdir) / "sample.sql"
            dump_path.write_text(sql, encoding="utf-8")
            dump = LegacySqlDumpParser().parse(dump_path)

        self.assertIn("users", dump.discovered_tables)
        self.assertEqual(2, len(dump.rows("users")))
        self.assertEqual("Jane O'Neil", dump.rows("users")[0]["name"])
        self.assertIsNone(dump.rows("users")[1]["email"])

