import json
from pathlib import Path
from tempfile import TemporaryDirectory

import bcrypt
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

from apps.accounts.models import User, UserRole
from apps.admin_portal.models import LegacyImportRun
from apps.assessments.models import Assessment, AssessmentStatus
from apps.catalog.models import Country, ServiceCategory
from apps.consultants.models import ConsultantService
from apps.payments.models import TransactionType, WalletTransaction
from apps.students.models import StudentProfile


class ImportV2CommandTests(TestCase):
    def _legacy_hash(self, password: str) -> str:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        return "$2y$" + hashed[4:]

    @override_settings(MEDIA_ROOT=Path(__file__).resolve().parents[4] / "test-media")
    def test_import_command_loads_minimal_dump(self):
        User.objects.all().delete()

        consultant_password = self._legacy_hash("Consultant123!")
        student_password = self._legacy_hash("Student123!")
        admin_password = self._legacy_hash("Admin123!")

        sql = f"""
CREATE TABLE `admins` (`id` bigint NOT NULL);
CREATE TABLE `users` (`id` bigint NOT NULL);
CREATE TABLE `country` (`id` bigint NOT NULL);
CREATE TABLE `services` (`id` bigint NOT NULL);
CREATE TABLE `student_infos` (`id` bigint NOT NULL);
CREATE TABLE `consultancy_services` (`id` bigint NOT NULL);
CREATE TABLE `assessments` (`id` bigint NOT NULL);
CREATE TABLE `transactions` (`id` bigint NOT NULL);
INSERT INTO `admins` (`id`, `name`, `email`, `phone`, `image`, `role`, `email_verified_at`, `password`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin User', 'admin@example.com', NULL, NULL, 'Admin', NULL, '{admin_password}', NULL, NULL, '2025-07-03 23:51:25', '2025-07-03 23:51:25');
INSERT INTO `users` (`id`, `name`, `phone`, `email`, `email_verified_at`, `password`, `image`, `proffered_education`, `proffered_country`, `user_type`, `gender`, `present_address`, `present_city`, `present_country`, `date_of_birth`, `nationality`, `passport_or_nid`, `passport_issue_date`, `passport_expiry_date`, `experience`, `is_verified`, `is_pro_user`, `completion_percentage`, `assessment_price`, `assessment_duration`, `balance`, `remember_token`, `created_at`, `updated_at`) VALUES
(2, 'Consultant Example', '01710000000', 'consultant@example.com', NULL, '{consultant_password}', NULL, NULL, NULL, 'Consultant', 'male', 'Dhaka', 'Dhaka', 'Bangladesh', '1990-01-01', 'Bangladeshi', 'P123', '2020-01-01', '2030-01-01', '8 years', 'Verified', '1', 90, '399', '3 days', '1500', NULL, '2025-07-09 07:16:41', '2025-07-09 07:16:41'),
(3, 'Student Example', '01710000001', 'student@example.com', NULL, '{student_password}', NULL, NULL, NULL, 'Student', 'female', 'Dhaka', 'Dhaka', 'Bangladesh', '2000-02-02', 'Bangladeshi', 'S123', '2022-01-01', '2032-01-01', NULL, 'Non-verified', NULL, 31, NULL, NULL, '500', NULL, '2025-07-25 11:30:17', '2025-07-26 05:50:04');
INSERT INTO `country` (`id`, `name`, `image`, `slug`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Canada', NULL, 'canada', 'active', '2025-07-01 00:00:00', '2025-07-01 00:00:00');
INSERT INTO `services` (`id`, `name`, `description`, `image_path`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Assessment', 'Assessment service', NULL, 'active', '2025-07-01 00:00:00', '2025-07-01 00:00:00');
INSERT INTO `student_infos` (`id`, `user_id`, `academic_type`, `a_lavel_result`, `o_lavel_result`, `o_lavel_certificate`, `a_lavel_certificate`, `hsc_result`, `hsc_certificate`, `ssc_result`, `ssc_certificate`, `dakhil_result`, `dakhil_certificate`, `alim_result`, `alim_certificate`, `ielts_score`, `ielts_certificate`, `last_edu_title`, `last_edu_department`, `last_edu_result`, `last_edu_certificate`, `last_edu_startDate`, `last_edu_endDate`, `last_edu_Duration`, `country`, `created_at`, `updated_at`) VALUES
(1, '3', 'bangla', NULL, NULL, NULL, NULL, '5.00', NULL, '5.00', NULL, NULL, NULL, NULL, NULL, '7.0', NULL, 'BSc', 'CSE', '3.80', NULL, '2020-01-01', '2024-01-01', '4 years', 'Canada', '2025-07-25 11:30:59', '2025-07-25 11:30:59');
INSERT INTO `consultancy_services` (`id`, `user_id`, `service_id`, `country`, `subject`, `price`, `title`, `description`, `duration`, `status`, `created_at`, `updated_at`) VALUES
(1, '2', '1', 'Canada', 'Computer Science', '399', 'Study Abroad Guidance', 'Personalized support', '3 days', 'active', '2025-07-05 09:45:31', '2025-07-09 07:13:16');
INSERT INTO `assessments` (`id`, `student_id`, `consultant_id`, `consultancy_service_id`, `service_name`, `assessment_country`, `assessment_subject`, `assessment_charge`, `assessment_duration`, `assessment_title`, `assessment_description`, `preferred_country`, `preferred_institute`, `preferred_subject`, `preferred_session`, `student_budget`, `status`, `attachment`, `submit_date`, `created_at`, `updated_at`) VALUES
(1, 3, 2, 1, 'Assessment', 'Canada', 'Computer Science', '399', '3 days', 'Get Guidance', 'Need help choosing a program', 'Canada', 'Test Institute', 'Computer Science', '2026-01', '50000', 'Pending', NULL, NULL, '2025-07-26 06:28:57', '2025-07-26 06:28:57');
INSERT INTO `transactions` (`id`, `user_id`, `amount`, `type`, `bank_trx_id`, `invoice_no`, `payment_method`, `created_at`, `updated_at`) VALUES
(1, 3, 1500.00, 'cash-in', '68846c8b', 'WCN68846c85b3f8e', 'Nagad', '2025-07-26 05:50:04', '2025-07-26 05:50:04');
"""

        with TemporaryDirectory() as tmpdir:
            base = Path(tmpdir)
            dump_path = base / "legacy.sql"
            dump_path.write_text(sql, encoding="utf-8")
            media_root = base / "public"
            media_root.mkdir()
            report_path = base / "report.json"

            call_command(
                "import_v2",
                sql_dump=str(dump_path),
                media_root=str(media_root),
                report=str(report_path),
            )

            report = json.loads(report_path.read_text(encoding="utf-8"))

        self.assertEqual(3, User.objects.count())
        self.assertTrue(User.objects.get(email="student@example.com").check_password("Student123!"))
        self.assertEqual(UserRole.ADMIN, User.objects.get(email="admin@example.com").role)
        self.assertEqual(1, Country.objects.count())
        self.assertEqual(1, ServiceCategory.objects.count())
        self.assertEqual(1, StudentProfile.objects.count())
        self.assertEqual(1, ConsultantService.objects.count())
        self.assertEqual(1, Assessment.objects.count())
        self.assertEqual(AssessmentStatus.PENDING, Assessment.objects.get().status)
        self.assertEqual(TransactionType.CASH_IN, WalletTransaction.objects.get().transaction_type)
        self.assertEqual("completed", report["status"])
        self.assertEqual("completed", LegacyImportRun.objects.get().status)

    def test_import_aborts_when_database_is_not_empty(self):
        User.objects.create_user(
            email="existing@example.com",
            password="Existing123!",
            role=UserRole.STUDENT,
        )

        with TemporaryDirectory() as tmpdir:
            dump_path = Path(tmpdir) / "legacy.sql"
            dump_path.write_text("CREATE TABLE `users` (`id` bigint NOT NULL);", encoding="utf-8")
            media_root = Path(tmpdir) / "public"
            media_root.mkdir()

            with self.assertRaises(CommandError):
                call_command(
                    "import_v2",
                    sql_dump=str(dump_path),
                    media_root=str(media_root),
                )
