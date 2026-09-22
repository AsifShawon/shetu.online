from __future__ import annotations

from copy import deepcopy
from datetime import timedelta
from html import escape
import re
from typing import Any

from django.utils import timezone

from apps.assessments.reporting_v2 import (
    SCHEMA_VERSION,
    TEMPLATE_KEY,
    build_default_content_v2,
    get_module_definitions_v2,
    normalize_content_v2,
)

LEGACY_TEMPLATE_KEY = "dynamic_service_report"
DEFAULT_TEMPLATE_KEY = TEMPLATE_KEY
DEFAULT_DEADLINE_DAYS = 7

SERVICE_CATEGORY_MODULE_MAP = {
    "assessment": "assessment_core",
    "file processing": "file_processing",
    "visa processing": "visa_processing",
    "feature processing": "feature_processing",
    "sop writing": "sop_writing",
    "scholarships search": "scholarships_search",
    "university selection": "university_selection",
    "scholarship guidance": "scholarship_guidance",
    "application review": "application_review",
    "sop support": "sop_support",
    "interview preparation": "interview_preparation",
    "admission": "admission",
}

RECOMMENDATION_ENABLED_MODULES = {
    "assessment_core",
    "university_selection",
    "scholarships_search",
    "scholarship_guidance",
    "admission",
}

MODULE_LIBRARY: dict[str, dict[str, Any]] = {
    "assessment_core": {
        "key": "assessment_core",
        "title": "Assessment Report",
        "description": "Legacy study abroad assessment guidance adapted from the Laravel report flow.",
        "sections": [
            {
                "key": "language",
                "title": "Language Proficiency & Requirements",
                "fields": [
                    {
                        "key": "ielts_score",
                        "label": "IELTS Score Required",
                        "kind": "text",
                        "placeholder": "e.g. 6.5 overall with no less than 6.0 in each component",
                    },
                    {
                        "key": "other_tests",
                        "label": "Other Accepted Tests",
                        "kind": "text",
                        "placeholder": "e.g. TOEFL, PTE, Duolingo",
                    },
                    {
                        "key": "english_preparation",
                        "label": "English Language Preparation",
                        "kind": "textarea",
                        "placeholder": "Preparation advice, recommended timeline, and readiness notes.",
                    },
                ],
            },
            {
                "key": "health",
                "title": "Health Insurance & Safety",
                "fields": [
                    {
                        "key": "health_insurance",
                        "label": "Health Insurance Required",
                        "kind": "text",
                        "placeholder": "e.g. Mandatory for all international students",
                    },
                    {
                        "key": "insurance_options",
                        "label": "Insurance Options",
                        "kind": "textarea",
                        "placeholder": "University-provided options, private coverage, and cost notes.",
                    },
                    {
                        "key": "additional_health",
                        "label": "Additional Health Requirements",
                        "kind": "textarea",
                        "placeholder": "Vaccination, medical screening, or safety requirements.",
                    },
                ],
            },
            {
                "key": "visa",
                "title": "Visa & Immigration Process",
                "fields": [
                    {
                        "key": "visa_type",
                        "label": "Visa Type",
                        "kind": "text",
                        "placeholder": "e.g. Student visa subclass / route",
                    },
                    {
                        "key": "visa_requirements",
                        "label": "Visa Requirements",
                        "kind": "textarea",
                        "placeholder": "Document checklist, financial proof, and other requirements.",
                    },
                    {
                        "key": "visa_processing",
                        "label": "Visa Processing Time",
                        "kind": "text",
                        "placeholder": "e.g. 3 weeks standard processing",
                    },
                    {
                        "key": "visa_interview",
                        "label": "Visa Interview Preparation",
                        "kind": "textarea",
                        "placeholder": "Interview expectations, questions, and preparation guidance.",
                    },
                ],
            },
            {
                "key": "processing",
                "title": "Application & File Processing",
                "fields": [
                    {
                        "key": "university_processing",
                        "label": "University Application Processing Time",
                        "kind": "text",
                        "placeholder": "e.g. 4-6 weeks after submission",
                    },
                    {
                        "key": "admission_notification",
                        "label": "Admission Notification Time",
                        "kind": "text",
                        "placeholder": "e.g. Typically within 8 weeks",
                    },
                    {
                        "key": "visa_application",
                        "label": "Visa Application Processing",
                        "kind": "text",
                        "placeholder": "e.g. 15 working days for standard",
                    },
                    {
                        "key": "final_confirmation",
                        "label": "Final Confirmation & Travel Readiness",
                        "kind": "textarea",
                        "placeholder": "Final milestones before the student can move forward.",
                    },
                ],
            },
            {
                "key": "checklist",
                "title": "Next Steps / Checklist",
                "fields": [
                    {
                        "key": "step_ielts",
                        "label": "Step 1: IELTS / English Tests",
                        "kind": "textarea",
                        "placeholder": "Preparation tasks and timing for English test readiness.",
                    },
                    {
                        "key": "step_documents",
                        "label": "Step 2: Collect Required Documents",
                        "kind": "textarea",
                        "placeholder": "Transcripts, references, IDs, and supporting evidence.",
                    },
                    {
                        "key": "step_apply",
                        "label": "Step 3: Apply to Universities",
                        "kind": "textarea",
                        "placeholder": "Submission timeline and application sequence.",
                    },
                    {
                        "key": "step_scholarships",
                        "label": "Step 4: Scholarships",
                        "kind": "textarea",
                        "placeholder": "Funding options, deadlines, and eligibility notes.",
                    },
                    {
                        "key": "step_visa",
                        "label": "Step 5: Submit Visa Application",
                        "kind": "textarea",
                        "placeholder": "Visa filing order and dependency on offer letters.",
                    },
                    {
                        "key": "step_interview",
                        "label": "Step 6: Interview Preparation",
                        "kind": "textarea",
                        "placeholder": "Interview readiness and final pre-departure tasks.",
                    },
                ],
            },
            {
                "key": "comments",
                "title": "Additional Comments / Recommendations",
                "fields": [
                    {
                        "key": "additional_comments",
                        "label": "Additional Comments",
                        "kind": "textarea",
                        "placeholder": "Any other guidance, risks, or consultant recommendations.",
                    }
                ],
            },
        ],
    },
    "file_processing": {
        "key": "file_processing",
        "title": "File Processing",
        "description": "Operational review of application documents and filing readiness.",
        "sections": [
            {
                "key": "file_processing",
                "title": "File Processing Review",
                "fields": [
                    {
                        "key": "document_audit",
                        "label": "Document Audit Summary",
                        "kind": "textarea",
                        "placeholder": "Quality and completeness of the submitted file set.",
                    },
                    {
                        "key": "missing_documents",
                        "label": "Missing or Weak Documents",
                        "kind": "textarea",
                        "placeholder": "Items the student still needs to prepare or improve.",
                    },
                    {
                        "key": "filing_strategy",
                        "label": "Filing Strategy",
                        "kind": "textarea",
                        "placeholder": "Recommended sequencing and packaging for applications.",
                    },
                    {
                        "key": "processing_risks",
                        "label": "Processing Risks",
                        "kind": "textarea",
                        "placeholder": "Potential blockers, delays, or quality concerns.",
                    },
                ],
            }
        ],
    },
    "visa_processing": {
        "key": "visa_processing",
        "title": "Visa Processing",
        "description": "Visa-specific delivery tasks and readiness guidance.",
        "sections": [
            {
                "key": "visa_processing_module",
                "title": "Visa Processing Review",
                "fields": [
                    {
                        "key": "visa_case_summary",
                        "label": "Visa Case Summary",
                        "kind": "textarea",
                        "placeholder": "Current visa context and route suitability.",
                    },
                    {
                        "key": "visa_document_checklist",
                        "label": "Visa Document Checklist",
                        "kind": "textarea",
                        "placeholder": "Required evidence and document packaging notes.",
                    },
                    {
                        "key": "submission_strategy",
                        "label": "Submission Strategy",
                        "kind": "textarea",
                        "placeholder": "Recommended filing order, timing, and dependencies.",
                    },
                    {
                        "key": "immigration_risks",
                        "label": "Immigration Risks",
                        "kind": "textarea",
                        "placeholder": "Risk areas, interview concerns, and mitigation steps.",
                    },
                ],
            }
        ],
    },
    "feature_processing": {
        "key": "feature_processing",
        "title": "Feature Processing",
        "description": "Legacy feature-processing service notes preserved for compatibility.",
        "sections": [
            {
                "key": "feature_processing_module",
                "title": "Feature Processing Delivery",
                "fields": [
                    {
                        "key": "service_scope",
                        "label": "Service Scope",
                        "kind": "textarea",
                        "placeholder": "Define the exact feature-processing scope delivered in this request.",
                    },
                    {
                        "key": "deliverables",
                        "label": "Deliverables",
                        "kind": "textarea",
                        "placeholder": "Concrete outputs or milestones completed for the student.",
                    },
                    {
                        "key": "milestone_plan",
                        "label": "Milestone Plan",
                        "kind": "textarea",
                        "placeholder": "Upcoming work, dependencies, and expected completion plan.",
                    },
                    {
                        "key": "consultant_notes",
                        "label": "Consultant Notes",
                        "kind": "textarea",
                        "placeholder": "Additional consultant notes specific to this service type.",
                    },
                ],
            }
        ],
    },
    "sop_writing": {
        "key": "sop_writing",
        "title": "SOP Writing",
        "description": "Drafting guidance for a statement of purpose aligned to the student's goals.",
        "sections": [
            {
                "key": "sop_writing_module",
                "title": "SOP Writing Plan",
                "fields": [
                    {
                        "key": "sop_goal",
                        "label": "Application Goal",
                        "kind": "textarea",
                        "placeholder": "Summarize the target course, country, and admissions objective this SOP must support.",
                    },
                    {
                        "key": "essay_brief",
                        "label": "Essay Brief",
                        "kind": "textarea",
                        "placeholder": "Define the expected tone, word-count range, themes, and university-specific requirements.",
                    },
                    {
                        "key": "structure_guidance",
                        "label": "Structure Guidance",
                        "kind": "textarea",
                        "placeholder": "Recommend the opening, body flow, evidence points, and closing structure.",
                    },
                    {
                        "key": "content_gaps",
                        "label": "Content Gaps",
                        "kind": "textarea",
                        "placeholder": "Identify missing examples, weak narratives, or evidence the student still needs.",
                    },
                    {
                        "key": "revision_direction",
                        "label": "Revision Direction",
                        "kind": "textarea",
                        "placeholder": "Explain what the next SOP revision should improve before submission.",
                    },
                ],
            }
        ],
    },
    "scholarships_search": {
        "key": "scholarships_search",
        "title": "Scholarships Search",
        "description": "Scholarship discovery and shortlist planning for the student's target study path.",
        "sections": [
            {
                "key": "scholarships_search_module",
                "title": "Scholarship Search Review",
                "fields": [
                    {
                        "key": "scholarship_shortlist",
                        "label": "Scholarship Shortlist",
                        "kind": "textarea",
                        "placeholder": "List the strongest scholarships, their scope, and why they fit the student.",
                    },
                    {
                        "key": "eligibility_notes",
                        "label": "Eligibility Notes",
                        "kind": "textarea",
                        "placeholder": "Document academic, financial, nationality, or course-level criteria the student must satisfy.",
                    },
                    {
                        "key": "scholarship_deadlines",
                        "label": "Deadlines and Timing",
                        "kind": "textarea",
                        "placeholder": "Capture the application windows, decision dates, and prep lead time.",
                    },
                    {
                        "key": "scholarship_application_strategy",
                        "label": "Application Strategy",
                        "kind": "textarea",
                        "placeholder": "Recommend how the student should prioritize and sequence applications.",
                    },
                ],
            }
        ],
    },
    "university_selection": {
        "key": "university_selection",
        "title": "University Selection",
        "description": "Shortlisting guidance to match study goals, budget, and academic profile.",
        "sections": [
            {
                "key": "university_selection_module",
                "title": "University Selection Review",
                "fields": [
                    {
                        "key": "shortlist_rationale",
                        "label": "Shortlist Rationale",
                        "kind": "textarea",
                        "placeholder": "Explain the recommended shortlist and the logic behind each choice.",
                    },
                    {
                        "key": "fit_analysis",
                        "label": "Academic and Career Fit Analysis",
                        "kind": "textarea",
                        "placeholder": "Assess how each option supports the student's profile and long-term outcomes.",
                    },
                    {
                        "key": "budget_alignment",
                        "label": "Budget Alignment",
                        "kind": "textarea",
                        "placeholder": "Compare cost, affordability, and financial tradeoffs across the shortlist.",
                    },
                    {
                        "key": "country_program_comparison",
                        "label": "Country / Program Comparison",
                        "kind": "textarea",
                        "placeholder": "Compare location, program structure, post-study value, and strategic fit.",
                    },
                ],
            }
        ],
    },
    "scholarship_guidance": {
        "key": "scholarship_guidance",
        "title": "Scholarship Guidance",
        "description": "Guidance for strengthening funding readiness and scholarship positioning.",
        "sections": [
            {
                "key": "scholarship_guidance_module",
                "title": "Scholarship Guidance Review",
                "fields": [
                    {
                        "key": "funding_readiness",
                        "label": "Funding Readiness",
                        "kind": "textarea",
                        "placeholder": "Assess how prepared the student is to pursue scholarships right now.",
                    },
                    {
                        "key": "scholarship_positioning",
                        "label": "Scholarship Positioning",
                        "kind": "textarea",
                        "placeholder": "Explain which achievements and themes should be emphasized in scholarship applications.",
                    },
                    {
                        "key": "scholarship_documents",
                        "label": "Essay and Document Needs",
                        "kind": "textarea",
                        "placeholder": "List the documents, essays, references, and evidence still required.",
                    },
                    {
                        "key": "scholarship_deadline_plan",
                        "label": "Deadline Plan",
                        "kind": "textarea",
                        "placeholder": "Provide a time-based plan for preparation, submission, and follow-up.",
                    },
                ],
            }
        ],
    },
    "application_review": {
        "key": "application_review",
        "title": "Application Review",
        "description": "Quality review of the application package before submission.",
        "sections": [
            {
                "key": "application_review_module",
                "title": "Application Review Summary",
                "fields": [
                    {
                        "key": "application_completeness",
                        "label": "Application Completeness",
                        "kind": "textarea",
                        "placeholder": "Describe whether the full application is complete and consistent.",
                    },
                    {
                        "key": "weak_areas",
                        "label": "Weak Areas",
                        "kind": "textarea",
                        "placeholder": "Call out weak claims, unclear responses, or missing supporting evidence.",
                    },
                    {
                        "key": "correction_list",
                        "label": "Correction List",
                        "kind": "textarea",
                        "placeholder": "List specific corrections the student must make before submission.",
                    },
                    {
                        "key": "submission_readiness",
                        "label": "Submission Readiness",
                        "kind": "textarea",
                        "placeholder": "State whether the application is ready to submit and what remains outstanding.",
                    },
                ],
            }
        ],
    },
    "sop_support": {
        "key": "sop_support",
        "title": "SOP Support",
        "description": "Review and support guidance for an existing SOP draft.",
        "sections": [
            {
                "key": "sop_support_module",
                "title": "SOP Support Review",
                "fields": [
                    {
                        "key": "existing_sop_review",
                        "label": "Existing SOP Review",
                        "kind": "textarea",
                        "placeholder": "Assess the current SOP draft and its strongest elements.",
                    },
                    {
                        "key": "issue_log",
                        "label": "Issue Log",
                        "kind": "textarea",
                        "placeholder": "List weak areas, structural issues, repetition, or messaging problems.",
                    },
                    {
                        "key": "improvement_priorities",
                        "label": "Improvement Priorities",
                        "kind": "textarea",
                        "placeholder": "Rank the highest-impact fixes the student should address first.",
                    },
                    {
                        "key": "sop_next_revision_steps",
                        "label": "Next Revision Steps",
                        "kind": "textarea",
                        "placeholder": "Give explicit next steps for the next SOP revision cycle.",
                    },
                ],
            }
        ],
    },
    "interview_preparation": {
        "key": "interview_preparation",
        "title": "Interview Preparation",
        "description": "Structured coaching notes for admissions or visa interview readiness.",
        "sections": [
            {
                "key": "interview_preparation_module",
                "title": "Interview Preparation Review",
                "fields": [
                    {
                        "key": "interview_format",
                        "label": "Interview Format",
                        "kind": "textarea",
                        "placeholder": "Explain the likely format, evaluation style, and expectations.",
                    },
                    {
                        "key": "probable_questions",
                        "label": "Probable Questions",
                        "kind": "textarea",
                        "placeholder": "List the most likely questions the student should prepare for.",
                    },
                    {
                        "key": "answer_strategy",
                        "label": "Answer Strategy",
                        "kind": "textarea",
                        "placeholder": "Guide the student on how to frame clear, convincing responses.",
                    },
                    {
                        "key": "rehearsal_checklist",
                        "label": "Rehearsal Checklist",
                        "kind": "textarea",
                        "placeholder": "Provide a practice checklist covering mock sessions, documents, and delivery.",
                    },
                ],
            }
        ],
    },
    "admission": {
        "key": "admission",
        "title": "Admission",
        "description": "Admission-stage review for offers, conditions, and enrollment readiness.",
        "sections": [
            {
                "key": "admission_module",
                "title": "Admission Review",
                "fields": [
                    {
                        "key": "admission_status_review",
                        "label": "Admission Status Review",
                        "kind": "textarea",
                        "placeholder": "Summarize the current admission status and any active offers or decisions.",
                    },
                    {
                        "key": "offer_conditions",
                        "label": "Offer Conditions",
                        "kind": "textarea",
                        "placeholder": "Document conditions, missing requirements, or dependency items tied to the offer.",
                    },
                    {
                        "key": "acceptance_steps",
                        "label": "Acceptance Steps",
                        "kind": "textarea",
                        "placeholder": "Explain what the student must do to secure or confirm admission.",
                    },
                    {
                        "key": "enrollment_timeline",
                        "label": "Enrollment Timeline",
                        "kind": "textarea",
                        "placeholder": "Outline the deadlines and milestones through deposit, CAS/I-20, and enrollment.",
                    },
                ],
            }
        ],
    },
    "generic_consulting": {
        "key": "generic_consulting",
        "title": "General Consulting",
        "description": "Fallback report module for service categories without a dedicated template yet.",
        "sections": [
            {
                "key": "generic_consulting_module",
                "title": "Consulting Summary",
                "fields": [
                    {
                        "key": "executive_summary",
                        "label": "Executive Summary",
                        "kind": "textarea",
                        "placeholder": "Summarize the consultant's findings and guidance.",
                    },
                    {
                        "key": "recommendations",
                        "label": "Recommendations",
                        "kind": "textarea",
                        "placeholder": "Recommended actions, options, and priorities for the student.",
                    },
                    {
                        "key": "next_actions",
                        "label": "Next Actions",
                        "kind": "textarea",
                        "placeholder": "Immediate next steps for the student after this report.",
                    },
                ],
            }
        ],
    },
}

LEGACY_FIELD_KEYS = (
    "ielts_score",
    "other_tests",
    "english_preparation",
    "health_insurance",
    "insurance_options",
    "additional_health",
    "visa_type",
    "visa_requirements",
    "visa_processing",
    "visa_interview",
    "university_processing",
    "admission_notification",
    "visa_application",
    "final_confirmation",
    "step_ielts",
    "step_documents",
    "step_apply",
    "step_scholarships",
    "step_visa",
    "step_interview",
    "additional_comments",
)


def canonicalize_service_category_name(name: str) -> str:
    return " ".join((name or "").strip().lower().split())


def resolve_module_key(service_category_name: str) -> str:
    return SERVICE_CATEGORY_MODULE_MAP.get(
        canonicalize_service_category_name(service_category_name),
        "generic_consulting",
    )


def resolve_report_blueprint(service_category_names: list[str] | tuple[str, ...] | None) -> dict[str, Any]:
    category_names = [name for name in (service_category_names or []) if name]
    module_keys: list[str] = []
    for name in category_names:
        key = resolve_module_key(name)
        if key not in module_keys:
            module_keys.append(key)

    if not module_keys:
        module_keys = ["generic_consulting"]

    if "assessment_core" in module_keys:
        module_keys = ["assessment_core", *[key for key in module_keys if key != "assessment_core"]]

    return {
        "requested_service_categories": category_names,
        "report_template_key": DEFAULT_TEMPLATE_KEY,
        "report_module_keys": module_keys,
    }


def get_module_definitions(
    module_keys: list[str] | tuple[str, ...] | None,
    schema_version: int = SCHEMA_VERSION,
) -> list[dict[str, Any]]:
    if schema_version >= SCHEMA_VERSION:
        return get_module_definitions_v2(module_keys)
    keys = list(module_keys or [])
    if not keys:
        keys = ["generic_consulting"]
    return [deepcopy(MODULE_LIBRARY.get(key, MODULE_LIBRARY["generic_consulting"])) for key in keys]


def should_show_recommended_universities(module_keys: list[str] | tuple[str, ...] | None) -> bool:
    return any(module_key in RECOMMENDATION_ENABLED_MODULES for module_key in (module_keys or []))


def build_default_content(
    module_keys: list[str] | tuple[str, ...] | None,
    schema_version: int = SCHEMA_VERSION,
) -> dict[str, dict[str, Any]]:
    if schema_version >= SCHEMA_VERSION:
        return build_default_content_v2(module_keys)
    content: dict[str, dict[str, str]] = {}
    for module in get_module_definitions(module_keys, schema_version=1):
        content[module["key"]] = {}
        for section in module["sections"]:
            for field in section["fields"]:
                content[module["key"]][field["key"]] = ""
    return content


def legacy_content_from_report(report: Any) -> dict[str, dict[str, str]]:
    values = {key: getattr(report, key, "") or "" for key in LEGACY_FIELD_KEYS}
    if not any(values.values()):
        return {}
    return {"assessment_core": values}


def normalize_report_content(
    report: Any,
    module_keys: list[str] | tuple[str, ...] | None = None,
    schema_version: int | None = None,
) -> dict[str, dict[str, Any]]:
    resolved_schema_version = schema_version or getattr(report, "schema_version", 1)
    stored_content = deepcopy(getattr(report, "content", None) or {})
    if resolved_schema_version >= SCHEMA_VERSION:
        return normalize_content_v2(stored_content, module_keys)

    normalized = build_default_content(module_keys, schema_version=1)
    legacy_content = legacy_content_from_report(report)

    for source in (legacy_content, stored_content):
        for module_key, module_values in source.items():
            if module_key not in normalized:
                normalized[module_key] = {}
            if isinstance(module_values, dict):
                for field_key, value in module_values.items():
                    normalized[module_key][field_key] = "" if value is None else str(value)

    return normalized


def sync_legacy_fields_from_content(content: dict[str, Any] | None) -> dict[str, str]:
    assessment_core = {}
    if isinstance(content, dict):
        raw_module = content.get("assessment_core", {})
        if isinstance(raw_module, dict):
            assessment_core = raw_module
    return {field_key: str(assessment_core.get(field_key, "") or "") for field_key in LEGACY_FIELD_KEYS}


def parse_deadline_delta(duration_text: str | None) -> timedelta:
    text = (duration_text or "").strip().lower()
    match = re.search(r"(\d+)\s*([a-z]+)", text)
    if not match:
        return timedelta(days=DEFAULT_DEADLINE_DAYS)

    value = max(int(match.group(1)), 1)
    unit = match.group(2)

    if unit.startswith("hour"):
        return timedelta(hours=value)
    if unit.startswith("week"):
        return timedelta(days=value * 7)
    if unit.startswith("month"):
        return timedelta(days=value * 30)
    return timedelta(days=value)


def build_deadline(duration_text: str | None, accepted_at=None):
    accepted_at = accepted_at or timezone.now()
    return accepted_at + parse_deadline_delta(duration_text)


def build_report_preview(content: dict[str, Any] | None) -> str:
    if not isinstance(content, dict):
        return ""

    preview_parts: list[str] = []
    for module_values in content.values():
        if not isinstance(module_values, dict):
            continue
        for value in module_values.values():
            if isinstance(value, str) and value.strip():
                preview_parts.append(value.strip())
            if len(preview_parts) >= 3:
                break
        if len(preview_parts) >= 3:
            break

    return " ".join(preview_parts)[:280]


def render_report_html(
    *,
    report: Any,
    assessment: Any,
    recommended_universities: list[Any],
    module_keys: list[str] | tuple[str, ...] | None,
    content: dict[str, dict[str, str]],
) -> str:
    module_definitions = get_module_definitions(
        module_keys,
        schema_version=getattr(report, "schema_version", 1),
    )
    show_recommended_universities = should_show_recommended_universities(module_keys)
    title = escape(assessment.assessment_title or "Assessment Report")
    student_name = escape(f"{assessment.student.first_name} {assessment.student.last_name}".strip() or assessment.student.email)
    consultant_name = escape(
        f"{assessment.consultant.first_name} {assessment.consultant.last_name}".strip() or assessment.consultant.email
    )

    sections_html: list[str] = []
    for module in module_definitions:
        module_items: list[str] = []
        module_content = content.get(module["key"], {})
        for section in module["sections"]:
            field_items: list[str] = []
            for field in section["fields"]:
                value = escape(str(module_content.get(field["key"], "") or "")).replace("\n", "<br />")
                if not value:
                    continue
                field_items.append(
                    f"<div class='field'><dt>{escape(field['label'])}</dt><dd>{value}</dd></div>"
                )
            if field_items:
                module_items.append(
                    f"<section class='report-block'><h3>{escape(section['title'])}</h3><dl>{''.join(field_items)}</dl></section>"
                )
        if module_items:
            sections_html.append(
                f"<section class='module'><h2>{escape(module['title'])}</h2>{''.join(module_items)}</section>"
            )

    universities_html = ""
    if show_recommended_universities and recommended_universities:
        rows = []
        for index, university in enumerate(recommended_universities, start=1):
            rows.append(
                "<tr>"
                f"<td>{index}</td>"
                f"<td>{escape(university.university_name)}</td>"
                f"<td>{escape(university.course_name)}</td>"
                f"<td>{escape(str(university.tuition_fees or ''))}</td>"
                f"<td>{escape(str(university.total_estimated_budget or ''))}</td>"
                f"<td>{escape(university.ielts or '')}</td>"
                "</tr>"
            )
        universities_html = (
            "<section class='module'><h2>Recommended Universities</h2>"
            "<table><thead><tr><th>#</th><th>University</th><th>Course</th><th>Tuition</th><th>Total Budget</th><th>IELTS</th></tr></thead>"
            f"<tbody>{''.join(rows)}</tbody></table></section>"
        )

    generated_at = escape(timezone.now().strftime("%d %b %Y %I:%M %p"))
    return f"""
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
    <style>
      body {{
        font-family: Arial, sans-serif;
        margin: 32px;
        color: #0f172a;
        background: #f8fafc;
      }}
      .sheet {{
        background: white;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 18px 60px rgba(15, 23, 42, 0.08);
      }}
      h1, h2, h3 {{ margin: 0 0 12px; }}
      h1 {{ font-size: 28px; }}
      h2 {{ font-size: 22px; margin-top: 28px; }}
      h3 {{ font-size: 18px; margin-top: 20px; }}
      p.meta {{
        margin: 4px 0;
        color: #475569;
      }}
      .module {{
        border-top: 1px solid #e2e8f0;
        padding-top: 20px;
        margin-top: 20px;
      }}
      .report-block {{
        margin-top: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
      }}
      dl {{
        display: grid;
        gap: 14px;
        margin: 0;
      }}
      dt {{
        font-weight: 700;
        margin-bottom: 6px;
      }}
      dd {{
        margin: 0;
        color: #334155;
        line-height: 1.6;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }}
      th, td {{
        border: 1px solid #cbd5e1;
        padding: 10px 12px;
        text-align: left;
      }}
      th {{
        background: #e2e8f0;
      }}
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1>{title}</h1>
      <p class="meta"><strong>Student:</strong> {student_name}</p>
      <p class="meta"><strong>Consultant:</strong> {consultant_name}</p>
      <p class="meta"><strong>Status:</strong> {escape(report.submission_status.replace('_', ' ').title())}</p>
      <p class="meta"><strong>Generated:</strong> {generated_at}</p>
      {universities_html}
      {''.join(sections_html)}
    </div>
  </body>
</html>
"""
