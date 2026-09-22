from django.test import SimpleTestCase

from apps.assessments.reporting import (
    build_default_content,
    get_module_definitions,
    resolve_report_blueprint,
    should_show_recommended_universities,
)
from apps.assessments.reporting_v2 import validate_content_v2


class ReportBlueprintTests(SimpleTestCase):
    def test_each_seeded_service_category_maps_to_a_dedicated_module(self):
        cases = {
            "Assessment": ["assessment_core"],
            "File Processing": ["file_processing"],
            "Visa Processing": ["visa_processing"],
            "Feature Processing": ["feature_processing"],
            "SOP Writing": ["sop_writing"],
            "Scholarships Search": ["scholarships_search"],
            "University Selection": ["university_selection"],
            "Scholarship Guidance": ["scholarship_guidance"],
            "Application Review": ["application_review"],
            "SOP Support": ["sop_support"],
            "Interview Preparation": ["interview_preparation"],
            "Admission": ["admission"],
        }

        for service_name, expected_module_keys in cases.items():
            with self.subTest(service_name=service_name):
                blueprint = resolve_report_blueprint([service_name])
                self.assertEqual(expected_module_keys, blueprint["report_module_keys"])

    def test_multi_category_blueprint_preserves_order_and_keeps_assessment_first(self):
        blueprint = resolve_report_blueprint(["Visa Processing", "Assessment", "File Processing"])
        self.assertEqual(
            ["assessment_core", "visa_processing", "file_processing"],
            blueprint["report_module_keys"],
        )

    def test_duplicate_and_unknown_categories_are_deduplicated_with_fallback(self):
        blueprint = resolve_report_blueprint(
            ["Assessment", "Assessment", "University Selection", "Unknown Service", "University Selection"]
        )
        self.assertEqual(
            ["assessment_core", "university_selection", "generic_consulting"],
            blueprint["report_module_keys"],
        )

    def test_recommendation_visibility_follows_module_relevance(self):
        self.assertTrue(should_show_recommended_universities(["assessment_core"]))
        self.assertTrue(should_show_recommended_universities(["visa_processing", "admission"]))
        self.assertFalse(should_show_recommended_universities(["visa_processing"]))
        self.assertFalse(should_show_recommended_universities(["interview_preparation", "sop_support"]))

    def test_every_category_has_a_typed_professional_v2_schema(self):
        module_keys = [
            "assessment_core",
            "file_processing",
            "visa_processing",
            "feature_processing",
            "sop_writing",
            "scholarships_search",
            "university_selection",
            "scholarship_guidance",
            "application_review",
            "sop_support",
            "interview_preparation",
            "admission",
            "generic_consulting",
        ]
        supported_kinds = {
            "short_text",
            "long_text",
            "select",
            "date",
            "url",
            "score",
            "checklist",
            "repeater",
        }
        for module_key in module_keys:
            with self.subTest(module_key=module_key):
                definitions = get_module_definitions([module_key], schema_version=2)
                self.assertEqual("professional_summary", definitions[0]["key"])
                category = definitions[1]
                self.assertEqual(module_key, category["key"])
                self.assertTrue(any(field.get("required") for section in category["sections"] for field in section["fields"]))
                self.assertTrue(
                    all(
                        field["kind"] in supported_kinds
                        for definition in definitions
                        for section in definition["sections"]
                        for field in section["fields"]
                    )
                )

    def test_v2_defaults_preserve_structured_values_and_report_missing_fields(self):
        content = build_default_content(["visa_processing"], schema_version=2)
        content["visa_processing"]["eligibility_matrix"] = [
            {
                "requirement": "Financial evidence",
                "status": "pending",
                "evidence": "Bank statement",
                "gap_action": "Update statement",
            }
        ]
        result = validate_content_v2(content, ["visa_processing"])
        self.assertFalse(result["valid"])
        self.assertIsInstance(result["normalized_content"]["visa_processing"]["eligibility_matrix"], list)
        self.assertIn("professional_summary.executive_summary", result["errors"])
