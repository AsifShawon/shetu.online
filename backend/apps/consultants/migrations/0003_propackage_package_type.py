from django.db import migrations, models


def populate_package_type(apps, schema_editor):
    ProPackage = apps.get_model("consultants", "ProPackage")

    for package in ProPackage.objects.all():
        text = " ".join(
            filter(
                None,
                [
                    package.name,
                    package.level,
                    package.description,
                ],
            )
        ).lower()
        package.package_type = (
            "annual"
            if package.duration_days >= 365 or any(token in text for token in ("annual", "annually", "year", "yearly"))
            else "monthly"
        )
        package.save(update_fields=["package_type"])


class Migration(migrations.Migration):

    dependencies = [
        ("consultants", "0002_experience_co_curricular_activities_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="propackage",
            name="package_type",
            field=models.CharField(
                choices=[("monthly", "Monthly"), ("annual", "Annual")],
                default="monthly",
                max_length=20,
            ),
        ),
        migrations.RunPython(populate_package_type, migrations.RunPython.noop),
    ]
