import importlib.util

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, UserRole
from apps.assessments.models import Assessment, AssessmentReport, AssessmentStatus, RecommendedUniversity
from apps.assessments.reporting import build_default_content, get_module_definitions, resolve_report_blueprint
from apps.catalog.models import Country, ServiceCategory
from apps.consultants.models import ConsultantService


class AssessmentReportFlowTests(APITestCase):
    def setUp(self):
        self.country = Country.objects.create(name="Australia", slug="australia")
        self.assessment_category = ServiceCategory.objects.create(name="Assessment")
        self.file_processing_category = ServiceCategory.objects.create(name="File Processing")
        self.visa_processing_category = ServiceCategory.objects.create(name="Visa Processing")
        self.university_selection_category = ServiceCategory.objects.create(name="University Selection")
        self.interview_preparation_category = ServiceCategory.objects.create(name="Interview Preparation")

        self.student = User.objects.create_user(
            email="student@example.com",
            password="password123",
            role=UserRole.STUDENT,
            first_name="Student",
        )
        self.consultant = User.objects.create_user(
            email="consultant@example.com",
            password="password123",
            role=UserRole.CONSULTANT,
            first_name="Consultant",
        )
        self.admin = User.objects.create_superuser(
            email="admin@example.com",
            password="password123",
        )

        self.service = ConsultantService.objects.create(
            consultant=self.consultant,
            country=self.country,
            title="Australia Full Support",
            description="Assessment plus document and visa help",
            price=800,
            duration="5 Days",
            status="active",
        )
        self.service.service_categories.set(
            [self.assessment_category, self.file_processing_category, self.visa_processing_category]
        )
        self.interview_service = ConsultantService.objects.create(
            consultant=self.consultant,
            country=self.country,
            title="Interview Prep",
            description="Interview coaching only",
            price=300,
            duration="2 Days",
            status="active",
        )
        self.interview_service.service_categories.set([self.interview_preparation_category])
        self.selection_service = ConsultantService.objects.create(
            consultant=self.consultant,
            country=self.country,
            title="University Selection",
            description="University shortlisting",
            price=400,
            duration="3 Days",
            status="active",
        )
        self.selection_service.service_categories.set([self.university_selection_category])

    def create_assessment(self, *, status=AssessmentStatus.PENDING, service=None):
        service = service or self.service
        blueprint = resolve_report_blueprint([item.name for item in service.service_categories.all()])
        return Assessment.objects.create(
            student=self.student,
            consultant=self.consultant,
            consultant_service=service,
            assessment_country=self.country,
            assessment_charge=service.price,
            assessment_duration=service.duration,
            assessment_title=service.title,
            assessment_description="Need a study abroad report",
            status=status,
            requested_service_categories=blueprint["requested_service_categories"],
            report_template_key=blueprint["report_template_key"],
            report_module_keys=blueprint["report_module_keys"],
        )

    def valid_v2_content(self, module_keys):
        content = build_default_content(module_keys, schema_version=2)
        for module in get_module_definitions(module_keys, schema_version=2):
            for section in module["sections"]:
                for field in section["fields"]:
                    if not field.get("required"):
                        continue
                    if field["kind"] == "checklist":
                        content[module["key"]][field["key"]] = [field["options"][0]["value"]]
                    elif field["kind"] == "repeater":
                        rows = []
                        for _ in range(field.get("min_rows", 1)):
                            row = {}
                            for item in field["columns"]:
                                row[item["key"]] = (
                                    "https://example.edu/official"
                                    if item["kind"] == "url"
                                    else "2026-10-01"
                                    if item["kind"] == "date"
                                    else "4"
                                    if item["kind"] == "score"
                                    else "ready"
                                    if item["kind"] == "select"
                                    else "Complete evidence"
                                )
                            rows.append(row)
                        content[module["key"]][field["key"]] = rows
                    else:
                        content[module["key"]][field["key"]] = (
                            "This is a complete professional executive summary with sufficient evidence and clear recommendations."
                            if field["key"] == "executive_summary"
                            else "ready"
                            if field["kind"] == "select"
                            else "Complete professional assessment detail."
                        )
        content["professional_summary"]["sources"] = [
            {
                "title": "Official source",
                "url": "https://example.edu/official",
                "verified_on": "2026-07-06",
            }
        ]
        return content

    def test_request_creation_snapshots_service_categories_and_modules(self):
        self.client.force_authenticate(self.student)

        response = self.client.post(
            "/api/assessments/",
            {
                "consultant_service_id": self.service.id,
                "preferred_institute": "University of Melbourne",
                "preferred_subject": "Computer Science",
                "preferred_session": "2026 Fall",
                "student_budget": "200000",
            },
            format="json",
        )

        self.assertEqual(status.HTTP_201_CREATED, response.status_code)
        assessment = Assessment.objects.get(pk=response.data["id"])
        self.assertEqual(
            ["Assessment", "File Processing", "Visa Processing"],
            assessment.requested_service_categories,
        )
        self.assertEqual("professional_assessment_v2", assessment.report_template_key)
        self.assertEqual(
            ["assessment_core", "file_processing", "visa_processing"],
            assessment.report_module_keys,
        )

    def test_consultant_accept_sets_deadline(self):
        assessment = self.create_assessment()
        self.client.force_authenticate(self.consultant)

        response = self.client.post(f"/api/assessments/{assessment.id}/accept/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        assessment.refresh_from_db()
        self.assertEqual(AssessmentStatus.ACCEPTED, assessment.status)
        self.assertIsNotNone(assessment.accepted_at)
        self.assertIsNotNone(assessment.deadline_at)
        self.assertGreater(assessment.deadline_at, assessment.accepted_at)

    def test_report_create_stays_draft_until_submit(self):
        assessment = self.create_assessment(status=AssessmentStatus.ACCEPTED)
        assessment.accepted_at = timezone.now()
        assessment.deadline_at = timezone.now()
        assessment.save(update_fields=["accepted_at", "deadline_at", "updated_at"])

        self.client.force_authenticate(self.consultant)
        create_response = self.client.post(
            "/api/assessments/reports/",
            {
                "assessment_id": assessment.id,
                "template_key": assessment.report_template_key,
                "module_keys": assessment.report_module_keys,
                "content": {
                    "assessment_core": {
                        "ielts_score": "6.5",
                        "additional_comments": "Draft report",
                    }
                },
            },
            format="json",
        )

        self.assertEqual(status.HTTP_201_CREATED, create_response.status_code)
        report = AssessmentReport.objects.get(pk=create_response.data["id"])
        self.assertEqual("draft", report.submission_status)
        assessment.refresh_from_db()
        self.assertEqual(AssessmentStatus.ACCEPTED, assessment.status)

        incomplete_response = self.client.post(f"/api/assessments/reports/{report.id}/submit/")
        self.assertEqual(status.HTTP_400_BAD_REQUEST, incomplete_response.status_code)

        self.client.patch(
            f"/api/assessments/reports/{report.id}/",
            {"content": self.valid_v2_content(assessment.report_module_keys)},
            format="json",
        )
        submit_response = self.client.post(f"/api/assessments/reports/{report.id}/submit/")
        self.assertEqual(status.HTTP_200_OK, submit_response.status_code)
        report.refresh_from_db()
        assessment.refresh_from_db()
        self.assertEqual("submitted", report.submission_status)
        self.assertEqual(AssessmentStatus.SUBMITTED, assessment.status)
        self.assertEqual(1, report.snapshots.count())

    def test_v2_report_is_hidden_until_admin_qa_approval(self):
        assessment = self.create_assessment(status=AssessmentStatus.ACCEPTED)
        self.client.force_authenticate(self.consultant)
        create_response = self.client.post(
            "/api/assessments/reports/",
            {
                "assessment_id": assessment.id,
                "module_keys": assessment.report_module_keys,
                "content": self.valid_v2_content(assessment.report_module_keys),
            },
            format="json",
        )
        self.assertEqual(status.HTTP_201_CREATED, create_response.status_code)
        report_id = create_response.data["id"]
        submit_response = self.client.post(f"/api/assessments/reports/{report_id}/submit/")
        self.assertEqual(status.HTTP_200_OK, submit_response.status_code)

        self.client.force_authenticate(self.student)
        hidden_workspace = self.client.get(f"/api/assessments/{assessment.id}/report-workspace/")
        self.assertFalse(hidden_workspace.data["can_view_report"])
        self.assertEqual({}, hidden_workspace.data["content"])
        self.assertEqual("", hidden_workspace.data["report"]["content_preview"])
        hidden_report_list = self.client.get("/api/assessments/reports/")
        self.assertEqual({}, hidden_report_list.data[0]["content"])

        self.client.force_authenticate(self.admin)
        rejected_approval = self.client.post(f"/api/admin/assessment-reports/{report_id}/approve/", {}, format="json")
        self.assertEqual(status.HTTP_400_BAD_REQUEST, rejected_approval.status_code)
        qa_checks = {
            "identity_verified": True,
            "required_sections_complete": True,
            "evidence_current": True,
            "recommendations_actionable": True,
            "limitations_declared": True,
        }
        approved = self.client.post(
            f"/api/admin/assessment-reports/{report_id}/approve/",
            {"qa_checks": qa_checks},
            format="json",
        )
        self.assertEqual(status.HTTP_200_OK, approved.status_code)

        self.client.force_authenticate(self.student)
        visible_workspace = self.client.get(f"/api/assessments/{assessment.id}/report-workspace/")
        self.assertTrue(visible_workspace.data["can_view_report"])
        self.assertEqual(
            "ready",
            visible_workspace.data["content"]["professional_summary"]["overall_outcome"],
        )
        if importlib.util.find_spec("weasyprint"):
            pdf_response = self.client.get(f"/api/assessments/{assessment.id}/report-pdf/")
            self.assertEqual(status.HTTP_200_OK, pdf_response.status_code)
            self.assertEqual("application/pdf", pdf_response["Content-Type"])
            self.assertTrue(pdf_response.content.startswith(b"%PDF-"))

    def test_admin_reject_reopens_report_and_student_accept_requires_approval(self):
        assessment = self.create_assessment(status=AssessmentStatus.ACCEPTED)
        report = AssessmentReport.objects.create(
            assessment=assessment,
            student=self.student,
            consultant=self.consultant,
            template_key=assessment.report_template_key,
            module_keys=assessment.report_module_keys,
            content={"assessment_core": {"ielts_score": "6.5"}},
            submission_status="submitted",
        )
        assessment.status = AssessmentStatus.SUBMITTED
        assessment.submitted_at = timezone.now()
        assessment.save(update_fields=["status", "submitted_at", "updated_at"])

        self.client.force_authenticate(self.student)
        before_approval = self.client.post(f"/api/assessments/{assessment.id}/accept-report/")
        self.assertEqual(status.HTTP_400_BAD_REQUEST, before_approval.status_code)

        self.client.force_authenticate(self.admin)
        reject_response = self.client.post(
            f"/api/admin/assessment-reports/{report.id}/reject/",
            {"rejection_reason": "Need more detail"},
            format="json",
        )
        self.assertEqual(status.HTTP_200_OK, reject_response.status_code)
        report.refresh_from_db()
        assessment.refresh_from_db()
        self.assertEqual("revision_requested", report.submission_status)
        self.assertEqual(AssessmentStatus.REVISION_REQUESTED, assessment.status)

        approve_response = self.client.post(f"/api/admin/assessment-reports/{report.id}/approve/")
        self.assertEqual(status.HTTP_200_OK, approve_response.status_code)
        report.refresh_from_db()
        assessment.refresh_from_db()
        self.assertEqual("approved", report.admin_approval_status)
        self.assertEqual(AssessmentStatus.APPROVED, assessment.status)

        self.client.force_authenticate(self.student)
        after_approval = self.client.post(f"/api/assessments/{assessment.id}/accept-report/")
        self.assertEqual(status.HTTP_200_OK, after_approval.status_code)
        assessment.refresh_from_db()
        self.assertEqual(AssessmentStatus.COMPLETED, assessment.status)

    def test_report_workspace_and_export_follow_service_type(self):
        academic_assessment = self.create_assessment(
            status=AssessmentStatus.ACCEPTED,
            service=self.selection_service,
        )
        academic_assessment.accepted_at = timezone.now()
        academic_assessment.deadline_at = timezone.now()
        academic_assessment.save(update_fields=["accepted_at", "deadline_at", "updated_at"])
        academic_report = AssessmentReport.objects.create(
            assessment=academic_assessment,
            student=self.student,
            consultant=self.consultant,
            template_key=academic_assessment.report_template_key,
            module_keys=academic_assessment.report_module_keys,
            content={"university_selection": {"shortlist_rationale": "Strong options"}},
            submission_status="submitted",
            admin_approval_status="approved",
        )
        RecommendedUniversity.objects.create(
            assessment=academic_assessment,
            student=self.student,
            consultant=self.consultant,
            university_name="University of Melbourne",
            course_name="Computer Science",
        )

        interview_assessment = self.create_assessment(
            status=AssessmentStatus.ACCEPTED,
            service=self.interview_service,
        )
        interview_assessment.accepted_at = timezone.now()
        interview_assessment.deadline_at = timezone.now()
        interview_assessment.save(update_fields=["accepted_at", "deadline_at", "updated_at"])
        AssessmentReport.objects.create(
            assessment=interview_assessment,
            student=self.student,
            consultant=self.consultant,
            template_key=interview_assessment.report_template_key,
            module_keys=interview_assessment.report_module_keys,
            content={"interview_preparation": {"interview_format": "Panel interview"}},
            submission_status="submitted",
            admin_approval_status="approved",
        )
        RecommendedUniversity.objects.create(
            assessment=interview_assessment,
            student=self.student,
            consultant=self.consultant,
            university_name="Unused Entry",
            course_name="Unused Course",
        )

        self.client.force_authenticate(self.consultant)
        academic_workspace = self.client.get(f"/api/assessments/{academic_assessment.id}/report-workspace/")
        interview_workspace = self.client.get(f"/api/assessments/{interview_assessment.id}/report-workspace/")

        self.assertEqual(status.HTTP_200_OK, academic_workspace.status_code)
        self.assertEqual(status.HTTP_200_OK, interview_workspace.status_code)
        self.assertEqual(
            ["university_selection"],
            [module["key"] for module in academic_workspace.data["module_definitions"]],
        )
        self.assertTrue(academic_workspace.data["show_recommended_universities"])
        self.assertEqual(
            ["interview_preparation"],
            [module["key"] for module in interview_workspace.data["module_definitions"]],
        )
        self.assertFalse(interview_workspace.data["show_recommended_universities"])

        academic_export = self.client.get(f"/api/assessments/{academic_assessment.id}/report-export/")
        interview_export = self.client.get(f"/api/assessments/{interview_assessment.id}/report-export/")

        self.assertEqual(status.HTTP_200_OK, academic_export.status_code)
        self.assertIn("Recommended Universities", academic_export.data["html"])
        self.assertEqual(status.HTTP_200_OK, interview_export.status_code)
        self.assertNotIn("Recommended Universities", interview_export.data["html"])

    def test_admin_report_detail_includes_structured_content(self):
        assessment = self.create_assessment(status=AssessmentStatus.ACCEPTED, service=self.selection_service)
        report = AssessmentReport.objects.create(
            assessment=assessment,
            student=self.student,
            consultant=self.consultant,
            template_key=assessment.report_template_key,
            module_keys=assessment.report_module_keys,
            content={"university_selection": {"shortlist_rationale": "Structured content"}},
            submission_status="submitted",
            admin_approval_status="pending",
        )

        self.client.force_authenticate(self.admin)
        response = self.client.get(f"/api/admin/assessment-reports/{report.id}/")

        self.assertEqual(status.HTTP_200_OK, response.status_code)
        self.assertEqual(["university_selection"], response.data["module_keys"])
        self.assertEqual("Structured content", response.data["content"]["university_selection"]["shortlist_rationale"])
        self.assertEqual(["university_selection"], [module["key"] for module in response.data["module_definitions"]])
        self.assertTrue(response.data["show_recommended_universities"])
