from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_default_admin(apps, schema_editor):
    User = apps.get_model("accounts", "User")

    admin, created = User.objects.get_or_create(
        email="admin@gmail.com",
        defaults={
            "first_name": "Admin",
            "last_name": "",
            "role": "admin",
            "account_type": "personal",
            "is_staff": True,
            "is_superuser": False,
            "is_active": True,
            "password": make_password("admin111"),
        },
    )

    updated = False
    if admin.role != "admin":
        admin.role = "admin"
        updated = True
    if not admin.is_staff:
        admin.is_staff = True
        updated = True
    if not admin.is_active:
        admin.is_active = True
        updated = True
    if created:
        updated = False

    if updated:
        admin.save(update_fields=["role", "is_staff", "is_active"])


def noop(apps, schema_editor):
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_alter_user_managers"),
    ]

    operations = [
        migrations.RunPython(seed_default_admin, noop),
    ]
