from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("admin_portal", "0003_admininvitation_moderationincident"),
    ]

    operations = [
        migrations.CreateModel(
            name="LegacyImportRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("sql_dump_path", models.CharField(max_length=500)),
                ("media_root", models.CharField(blank=True, max_length=500)),
                ("dry_run", models.BooleanField(default=False)),
                ("strict", models.BooleanField(default=False)),
                ("selected_passes", models.JSONField(blank=True, default=list)),
                ("status", models.CharField(choices=[("running", "Running"), ("completed", "Completed"), ("failed", "Failed"), ("dry_run", "Dry Run")], default="running", max_length=20)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("summary", models.JSONField(blank=True, default=dict)),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="LegacyImportMap",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("source_table", models.CharField(max_length=100)),
                ("source_pk", models.CharField(max_length=255)),
                ("target_app_label", models.CharField(max_length=100)),
                ("target_model", models.CharField(max_length=100)),
                ("target_pk", models.PositiveBigIntegerField()),
                ("run", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mappings", to="admin_portal.legacyimportrun")),
            ],
            options={"abstract": False},
        ),
        migrations.AddConstraint(
            model_name="legacyimportmap",
            constraint=models.UniqueConstraint(fields=("run", "source_table", "source_pk"), name="unique_legacy_import_source_mapping"),
        ),
    ]
