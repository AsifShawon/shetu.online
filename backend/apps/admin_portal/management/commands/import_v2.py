from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from common.services.import_v2 import ImportOptions, V2Importer


class Command(BaseCommand):
    help = "Import EduWise V2 data from the provided SQL dump into the V3 schema."

    def add_arguments(self, parser):
        parser.add_argument("--sql-dump", required=True, help="Path to the legacy SQL dump file.")
        parser.add_argument("--media-root", required=True, help="Path to the legacy public/media root.")
        parser.add_argument("--report", help="Optional path to write the JSON import report.")
        parser.add_argument("--dry-run", action="store_true", help="Validate the import without committing database rows.")
        parser.add_argument("--skip-media", action="store_true", help="Skip importing file and image attachments.")
        parser.add_argument("--strict", action="store_true", help="Fail on unresolved required relations instead of warning.")
        parser.add_argument(
            "--only-pass",
            help="Comma-separated list of import passes to execute. 'preflight' is always executed.",
        )

    def handle(self, *args, **options):
        sql_dump = Path(options["sql_dump"]).expanduser().resolve()
        media_root = Path(options["media_root"]).expanduser().resolve()
        report = Path(options["report"]).expanduser().resolve() if options.get("report") else None
        only_passes = None
        if options.get("only_pass"):
            only_passes = [item.strip() for item in options["only_pass"].split(",") if item.strip()]
            if not only_passes:
                raise CommandError("--only-pass was provided but no pass names were parsed.")

        importer = V2Importer(
            ImportOptions(
                sql_dump=sql_dump,
                media_root=media_root,
                report_path=report,
                dry_run=options["dry_run"],
                skip_media=options["skip_media"],
                strict=options["strict"],
                only_passes=only_passes,
            )
        )
        report_data = importer.run()
        summary = report_data.get("summary", {})
        report_path = report or "not written"
        self.stdout.write(
            self.style.SUCCESS(
                f"Import finished with status '{report_data['status']}'. "
                f"Created rows: {summary.get('created_rows', 0)}. "
                f"Warnings: {summary.get('warnings', 0)}. "
                f"Report: {report_path}"
            )
        )
