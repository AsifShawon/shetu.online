from pathlib import Path
import argparse
import os


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the EduWise V2 -> V3 importer.")
    parser.add_argument("--sql-dump", default=None)
    parser.add_argument("--media-root", default=None)
    parser.add_argument("--report", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-media", action="store_true")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--only-pass", default=None)
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    backend_root = root
    project_root = backend_root.parent.parent
    sql_dump = args.sql_dump or str(project_root / "old_sql_query" / "eduwise_com_old_dabase_backup.sql")
    media_root = args.media_root or str(project_root / "public")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    from django.core.management import call_command

    call_kwargs = {
        "sql_dump": sql_dump,
        "media_root": media_root,
        "dry_run": args.dry_run,
        "skip_media": args.skip_media,
        "strict": args.strict,
    }
    if args.report:
        call_kwargs["report"] = args.report
    if args.only_pass:
        call_kwargs["only_pass"] = args.only_pass

    call_command("import_v2", **call_kwargs)


if __name__ == "__main__":
    main()
