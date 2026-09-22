from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("assessments", "0003_assessment_dynamic_report_flow"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="assessmentreport",
            name="schema_version",
            field=models.PositiveSmallIntegerField(default=1),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="application_deadline",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="country",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="currency",
            field=models.CharField(blank=True, max_length=3),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="duration",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="entry_requirements",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="fit_category",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="fit_score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="intake",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="key_risks",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="key_strengths",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="official_program_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="recommendeduniversity",
            name="program_level",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.CreateModel(
            name="AssessmentReportSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("version", models.PositiveIntegerField()),
                ("schema_version", models.PositiveSmallIntegerField(default=2)),
                ("template_key", models.CharField(max_length=100)),
                ("module_keys", models.JSONField(default=list)),
                ("content", models.JSONField(default=dict)),
                ("recommended_universities", models.JSONField(default=list)),
                ("submitted_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "admin_approval_status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("qa_checks", models.JSONField(blank=True, default=dict)),
                ("review_notes", models.JSONField(blank=True, default=dict)),
                (
                    "report",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="snapshots",
                        to="assessments.assessmentreport",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_report_snapshots",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "submitted_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="submitted_report_snapshots",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("-version",)},
        ),
        migrations.AddConstraint(
            model_name="assessmentreportsnapshot",
            constraint=models.UniqueConstraint(
                fields=("report", "version"),
                name="assessment_report_snapshot_unique_version",
            ),
        ),
    ]
