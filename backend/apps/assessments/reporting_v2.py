from __future__ import annotations

from copy import deepcopy
from datetime import date
from typing import Any
from urllib.parse import urlparse


SCHEMA_VERSION = 2
TEMPLATE_KEY = "professional_assessment_v2"
FACT_BASED_MODULES = {
    "assessment_core",
    "visa_processing",
    "scholarships_search",
    "university_selection",
    "scholarship_guidance",
    "admission",
}


def field(
    key: str,
    label: str,
    kind: str = "long_text",
    *,
    required: bool = False,
    placeholder: str = "",
    helper: str = "",
    options: list[dict[str, str]] | None = None,
    columns: list[dict[str, Any]] | None = None,
    min_rows: int = 0,
) -> dict[str, Any]:
    definition: dict[str, Any] = {
        "key": key,
        "label": label,
        "kind": kind,
        "required": required,
    }
    if placeholder:
        definition["placeholder"] = placeholder
    if helper:
        definition["helper"] = helper
    if options:
        definition["options"] = options
    if columns:
        definition["columns"] = columns
    if min_rows:
        definition["min_rows"] = min_rows
    return definition


def option(value: str, label: str) -> dict[str, str]:
    return {"value": value, "label": label}


def column(key: str, label: str, kind: str = "short_text", *, required: bool = False) -> dict[str, Any]:
    return {"key": key, "label": label, "kind": kind, "required": required}


OUTCOME_OPTIONS = [
    option("ready", "Ready"),
    option("conditionally_ready", "Conditionally Ready"),
    option("not_ready", "Not Ready"),
]
PRIORITY_OPTIONS = [
    option("high", "High"),
    option("medium", "Medium"),
    option("low", "Low"),
]


COMMON_MODULE = {
    "key": "professional_summary",
    "title": "Professional Summary",
    "description": "Decision summary, evidence, risks, actions, sources, and consultant declaration.",
    "sections": [
        {
            "key": "executive_summary",
            "title": "Executive Summary",
            "description": "Give the student a concise, evidence-based overview of the case and recommendation.",
            "fields": [
                field(
                    "executive_summary",
                    "Executive Summary",
                    required=True,
                    placeholder="Summarize the student's objective, current position, major findings, and recommendation.",
                ),
                field(
                    "overall_outcome",
                    "Overall Outcome",
                    "select",
                    required=True,
                    options=OUTCOME_OPTIONS,
                ),
                field(
                    "student_objectives",
                    "Student Objectives",
                    required=True,
                    placeholder="Record the intended destination, program, intake, career objective, and constraints.",
                ),
            ],
        },
        {
            "key": "findings",
            "title": "Key Findings and Risk Position",
            "fields": [
                field(
                    "key_findings",
                    "Key Findings",
                    "repeater",
                    required=True,
                    min_rows=2,
                    columns=[
                        column("finding", "Finding", required=True),
                        column("evidence", "Evidence / Basis", required=True),
                    ],
                ),
                field(
                    "risk_summary",
                    "Risk Summary",
                    required=True,
                    placeholder="Describe material risks and mitigations, or explain why no material risk was identified.",
                ),
            ],
        },
        {
            "key": "actions",
            "title": "Prioritized Action Plan",
            "fields": [
                field(
                    "action_plan",
                    "Action Plan",
                    "repeater",
                    required=True,
                    min_rows=1,
                    columns=[
                        column("action", "Action", required=True),
                        column("owner", "Owner", "select", required=True),
                        column("due_date", "Target Date", "date", required=True),
                        column("priority", "Priority", "select", required=True),
                        column("status", "Status", "select", required=True),
                    ],
                )
            ],
        },
        {
            "key": "evidence",
            "title": "Sources, Assumptions and Declaration",
            "fields": [
                field(
                    "sources",
                    "Official Sources",
                    "repeater",
                    columns=[
                        column("title", "Source", required=True),
                        column("url", "Official URL", "url", required=True),
                        column("verified_on", "Verified On", "date", required=True),
                    ],
                ),
                field(
                    "assumptions_limitations",
                    "Assumptions and Limitations",
                    required=True,
                    placeholder="State information gaps, assumptions, time-sensitive facts, and the limits of this guidance.",
                ),
                field(
                    "consultant_declaration",
                    "Consultant Declaration",
                    "checklist",
                    required=True,
                    options=[
                        option(
                            "confirmed",
                            "I confirm that this report is accurate to the best of my knowledge, evidence-based, and prepared in the student's best interests.",
                        )
                    ],
                ),
            ],
        },
    ],
}


MODULE_LIBRARY_V2: dict[str, dict[str, Any]] = {
    "assessment_core": {
        "key": "assessment_core",
        "title": "Study Readiness Assessment",
        "description": "Academic, language, financial, timeline, destination, and program-fit evaluation.",
        "sections": [
            {
                "key": "readiness",
                "title": "Readiness Scorecard",
                "fields": [
                    field(
                        "readiness_scores",
                        "Readiness Scores",
                        "repeater",
                        required=True,
                        min_rows=4,
                        columns=[
                            column("dimension", "Dimension", required=True),
                            column("score", "Score / 5", "score", required=True),
                            column("evidence", "Evidence", required=True),
                            column("recommendation", "Recommendation", required=True),
                        ],
                    ),
                    field("destination_program_fit", "Destination and Program Fit", required=True),
                    field("eligibility_gaps", "Eligibility Gaps and Mitigation", required=True),
                ],
            }
        ],
    },
    "file_processing": {
        "key": "file_processing",
        "title": "Application File Audit",
        "description": "Document completeness, consistency, quality, and filing-readiness review.",
        "sections": [
            {
                "key": "audit",
                "title": "Document Register and Filing Plan",
                "fields": [
                    field(
                        "document_register",
                        "Document Register",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("document", "Document", required=True),
                            column("status", "Status", "select", required=True),
                            column("issue", "Issue / Observation"),
                            column("required_action", "Required Action", required=True),
                        ],
                    ),
                    field("consistency_authenticity", "Consistency and Authenticity Review", required=True),
                    field("filing_sequence", "Filing Sequence and Dependencies", required=True),
                    field("blockers", "Blockers and Escalations", required=True),
                ],
            }
        ],
    },
    "visa_processing": {
        "key": "visa_processing",
        "title": "Visa Readiness Review",
        "description": "Route suitability, evidence, risks, and submission strategy; not legal advice.",
        "sections": [
            {
                "key": "visa_case",
                "title": "Visa Route and Evidence",
                "fields": [
                    field("destination_and_route", "Destination and Visa Route", "short_text", required=True),
                    field(
                        "eligibility_matrix",
                        "Eligibility Matrix",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("requirement", "Requirement", required=True),
                            column("status", "Status", "select", required=True),
                            column("evidence", "Evidence", required=True),
                            column("gap_action", "Gap / Action"),
                        ],
                    ),
                    field("financial_evidence", "Financial Evidence Assessment", required=True),
                    field("immigration_history_risks", "Immigration History and Risk Assessment", required=True),
                    field("submission_strategy", "Submission Strategy and Timeline", required=True),
                ],
            }
        ],
    },
    "feature_processing": {
        "key": "feature_processing",
        "title": "Case Coordination Plan",
        "description": "End-to-end coordination of supporting application tasks and dependencies.",
        "sections": [
            {
                "key": "coordination",
                "title": "Scope, Deliverables and Milestones",
                "fields": [
                    field("service_scope", "Case Coordination Scope", required=True),
                    field(
                        "deliverables",
                        "Deliverables",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("deliverable", "Deliverable", required=True),
                            column("owner", "Owner", required=True),
                            column("due_date", "Due Date", "date", required=True),
                            column("acceptance_criteria", "Acceptance Criteria", required=True),
                        ],
                    ),
                    field("dependencies_blockers", "Dependencies and Blockers", required=True),
                    field("communication_escalation", "Communication and Escalation Plan", required=True),
                ],
            }
        ],
    },
    "sop_writing": {
        "key": "sop_writing",
        "title": "Statement of Purpose Writing Brief",
        "description": "Prompt-aligned narrative, evidence, outline, originality, and revision plan.",
        "sections": [
            {
                "key": "brief",
                "title": "Application Brief and Narrative Design",
                "fields": [
                    field("target_and_prompt", "Target Institution, Program and Prompt", required=True),
                    field("word_limit_tone", "Word Limit, Format and Tone", "short_text", required=True),
                    field(
                        "evidence_bank",
                        "Applicant Evidence Bank",
                        "repeater",
                        required=True,
                        min_rows=2,
                        columns=[
                            column("theme", "Theme", required=True),
                            column("evidence", "Specific Evidence", required=True),
                            column("relevance", "Program Relevance", required=True),
                        ],
                    ),
                    field("narrative_outline", "Narrative Outline", required=True),
                    field("content_gaps", "Content Gaps", required=True),
                    field("originality_revision_plan", "Originality and Revision Plan", required=True),
                ],
            }
        ],
    },
    "scholarships_search": {
        "key": "scholarships_search",
        "title": "Scholarship Opportunity Report",
        "description": "Verified opportunity shortlist, fit analysis, deadlines, and funding strategy.",
        "sections": [
            {
                "key": "opportunities",
                "title": "Opportunity Register",
                "fields": [
                    field(
                        "scholarship_opportunities",
                        "Scholarship Opportunities",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("provider", "Provider", required=True),
                            column("award", "Award / Coverage", required=True),
                            column("eligibility", "Eligibility", required=True),
                            column("match", "Match", "select", required=True),
                            column("deadline", "Deadline", "date", required=True),
                            column("official_url", "Official URL", "url", required=True),
                            column("status", "Status", "select", required=True),
                        ],
                    ),
                    field("funding_gap", "Funding Gap Analysis", required=True),
                    field("application_calendar", "Application Calendar and Priorities", required=True),
                ],
            }
        ],
    },
    "university_selection": {
        "key": "university_selection",
        "title": "University Selection and Comparison",
        "description": "Evidence-based shortlist using academic, cost, location, and outcome criteria.",
        "sections": [
            {
                "key": "selection",
                "title": "Selection Method and Recommendation",
                "fields": [
                    field("selection_methodology", "Selection Methodology and Weighting", required=True),
                    field("shortlist_rationale", "Shortlist Rationale", required=True),
                    field("entry_likelihood_analysis", "Reach / Target / Safe Analysis", required=True),
                    field("cost_career_tradeoffs", "Cost, Location and Career Trade-offs", required=True),
                ],
            }
        ],
    },
    "scholarship_guidance": {
        "key": "scholarship_guidance",
        "title": "Scholarship Competitiveness Review",
        "description": "Positioning, evidence strength, application material, and deadline readiness.",
        "sections": [
            {
                "key": "guidance",
                "title": "Competitiveness and Positioning",
                "fields": [
                    field("competitiveness_outcome", "Competitiveness Assessment", required=True),
                    field(
                        "strength_evidence",
                        "Positioning Evidence",
                        "repeater",
                        required=True,
                        min_rows=2,
                        columns=[
                            column("strength", "Strength / Theme", required=True),
                            column("evidence", "Evidence", required=True),
                            column("use", "How to Position It", required=True),
                        ],
                    ),
                    field("essay_reference_needs", "Essay, Reference and Document Needs", required=True),
                    field("deadline_plan", "Deadline and Preparation Plan", required=True),
                ],
            }
        ],
    },
    "application_review": {
        "key": "application_review",
        "title": "Application Quality Review",
        "description": "Requirement compliance, package consistency, defect severity, and readiness verdict.",
        "sections": [
            {
                "key": "review",
                "title": "Compliance Checklist and Defect Log",
                "fields": [
                    field(
                        "requirements_checklist",
                        "Requirements Checklist",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("requirement", "Requirement", required=True),
                            column("status", "Status", "select", required=True),
                            column("observation", "Observation"),
                            column("correction", "Correction / Action"),
                        ],
                    ),
                    field("package_consistency", "Package Consistency Review", required=True),
                    field("defect_summary", "Defects by Severity", required=True),
                    field("submission_readiness", "Submission Readiness Verdict", required=True),
                ],
            }
        ],
    },
    "sop_support": {
        "key": "sop_support",
        "title": "SOP Review and Improvement Report",
        "description": "Scored review of an existing statement with an actionable revision path.",
        "sections": [
            {
                "key": "sop_review",
                "title": "Quality Rubric and Revision Priorities",
                "fields": [
                    field(
                        "sop_rubric",
                        "SOP Quality Rubric",
                        "repeater",
                        required=True,
                        min_rows=6,
                        columns=[
                            column("criterion", "Criterion", required=True),
                            column("score", "Score / 5", "score", required=True),
                            column("feedback", "Evidence-based Feedback", required=True),
                        ],
                    ),
                    field(
                        "issue_log",
                        "Issue Log",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("severity", "Severity", "select", required=True),
                            column("issue", "Issue", required=True),
                            column("revision", "Required Revision", required=True),
                        ],
                    ),
                    field("revision_priorities", "Revision Priorities and Next Draft Plan", required=True),
                ],
            }
        ],
    },
    "interview_preparation": {
        "key": "interview_preparation",
        "title": "Interview Preparation Report",
        "description": "Question preparation, competency scoring, feedback, risks, and rehearsal plan.",
        "sections": [
            {
                "key": "interview",
                "title": "Interview Strategy and Practice",
                "fields": [
                    field("interview_format", "Interview Type, Format and Expectations", required=True),
                    field(
                        "question_bank",
                        "Question Bank and Answer Strategy",
                        "repeater",
                        required=True,
                        min_rows=3,
                        columns=[
                            column("question", "Question", required=True),
                            column("competency", "Competency Tested", required=True),
                            column("answer_strategy", "Answer Strategy", required=True),
                        ],
                    ),
                    field(
                        "practice_scores",
                        "Practice Competency Scores",
                        "repeater",
                        required=True,
                        min_rows=3,
                        columns=[
                            column("competency", "Competency", required=True),
                            column("score", "Score / 5", "score", required=True),
                            column("feedback", "Feedback", required=True),
                        ],
                    ),
                    field("risk_areas", "Risk Areas and Difficult Questions", required=True),
                    field("rehearsal_plan", "Rehearsal Plan", required=True),
                ],
            }
        ],
    },
    "admission": {
        "key": "admission",
        "title": "Admission and Offer Review",
        "description": "Offer conditions, deadlines, costs, enrollment evidence, and acceptance planning.",
        "sections": [
            {
                "key": "offer",
                "title": "Offer Review and Enrollment Plan",
                "fields": [
                    field("offer_status", "Offer Status and Authenticity Review", required=True),
                    field(
                        "conditions_deadlines",
                        "Conditions and Deadlines",
                        "repeater",
                        required=True,
                        min_rows=1,
                        columns=[
                            column("condition", "Condition / Requirement", required=True),
                            column("deadline", "Deadline", "date", required=True),
                            column("status", "Status", "select", required=True),
                            column("action", "Required Action", required=True),
                        ],
                    ),
                    field("offer_comparison", "Offer Comparison and Decision Factors", required=True),
                    field("financial_enrollment_readiness", "Financial and Enrollment Readiness", required=True),
                    field("acceptance_timeline", "Acceptance and Enrollment Timeline", required=True),
                ],
            }
        ],
    },
    "generic_consulting": {
        "key": "generic_consulting",
        "title": "Professional Consulting Report",
        "description": "Structured fallback for services without a dedicated category template.",
        "sections": [
            {
                "key": "consulting",
                "title": "Scope, Findings and Recommendations",
                "fields": [
                    field("scope", "Scope of Review", required=True),
                    field("evidence_reviewed", "Evidence Reviewed", required=True),
                    field("findings", "Findings", required=True),
                    field("recommendations", "Recommendations", required=True),
                ],
            }
        ],
    },
}

PRESEEDED_ROWS: dict[tuple[str, str], list[dict[str, Any]]] = {
    ("assessment_core", "readiness_scores"): [
        {"dimension": "Academic readiness", "score": "", "evidence": "", "recommendation": ""},
        {"dimension": "Language readiness", "score": "", "evidence": "", "recommendation": ""},
        {"dimension": "Financial readiness", "score": "", "evidence": "", "recommendation": ""},
        {"dimension": "Timeline readiness", "score": "", "evidence": "", "recommendation": ""},
    ],
    ("sop_support", "sop_rubric"): [
        {"criterion": "Prompt relevance", "score": "", "feedback": ""},
        {"criterion": "Narrative coherence", "score": "", "feedback": ""},
        {"criterion": "Evidence and specificity", "score": "", "feedback": ""},
        {"criterion": "Structure and flow", "score": "", "feedback": ""},
        {"criterion": "Language and clarity", "score": "", "feedback": ""},
        {"criterion": "Institution/program alignment", "score": "", "feedback": ""},
    ],
    ("interview_preparation", "practice_scores"): [
        {"competency": "Clarity and structure", "score": "", "feedback": ""},
        {"competency": "Evidence and credibility", "score": "", "feedback": ""},
        {"competency": "Confidence and delivery", "score": "", "feedback": ""},
    ],
}


def get_module_definitions_v2(module_keys: list[str] | tuple[str, ...] | None) -> list[dict[str, Any]]:
    keys = list(module_keys or ["generic_consulting"])
    return [
        deepcopy(COMMON_MODULE),
        *[deepcopy(MODULE_LIBRARY_V2.get(key, MODULE_LIBRARY_V2["generic_consulting"])) for key in keys],
    ]


def default_value_for_kind(kind: str) -> Any:
    if kind in {"repeater", "checklist"}:
        return []
    return ""


def build_default_content_v2(module_keys: list[str] | tuple[str, ...] | None) -> dict[str, dict[str, Any]]:
    content: dict[str, dict[str, Any]] = {}
    for module in get_module_definitions_v2(module_keys):
        values: dict[str, Any] = {}
        for section in module["sections"]:
            for item in section["fields"]:
                values[item["key"]] = deepcopy(
                    PRESEEDED_ROWS.get(
                        (module["key"], item["key"]),
                        default_value_for_kind(item["kind"]),
                    )
                )
        content[module["key"]] = values
    return content


def normalize_content_v2(
    stored_content: dict[str, Any] | None,
    module_keys: list[str] | tuple[str, ...] | None,
) -> dict[str, dict[str, Any]]:
    normalized = build_default_content_v2(module_keys)
    if not isinstance(stored_content, dict):
        return normalized

    for module_key, values in stored_content.items():
        if not isinstance(values, dict) or module_key not in normalized:
            continue
        for key, value in values.items():
            if key in normalized[module_key] and (
                isinstance(value, (str, int, float, bool, list, dict)) or value is None
            ):
                normalized[module_key][key] = value if value is not None else ""
    return normalized


def _is_http_url(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    parsed = urlparse(value.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _has_value(value: Any, kind: str) -> bool:
    if kind in {"repeater", "checklist"}:
        return isinstance(value, list) and len(value) > 0
    return value is not None and str(value).strip() != ""


def validate_content_v2(
    content: dict[str, Any] | None,
    module_keys: list[str] | tuple[str, ...] | None,
) -> dict[str, Any]:
    normalized = normalize_content_v2(content, module_keys)
    errors: dict[str, str] = {}
    required_count = 0
    required_paths: list[str] = []

    for module in get_module_definitions_v2(module_keys):
        values = normalized.get(module["key"], {})
        for section in module["sections"]:
            for item in section["fields"]:
                path = f"{module['key']}.{item['key']}"
                value = values.get(item["key"])
                if item.get("required"):
                    required_count += 1
                    required_paths.append(path)
                    if not _has_value(value, item["kind"]):
                        errors[path] = "This field is required."

                if item["kind"] == "repeater" and isinstance(value, list):
                    min_rows = item.get("min_rows", 0)
                    if len(value) < min_rows:
                        errors[path] = f"Add at least {min_rows} row{'s' if min_rows != 1 else ''}."
                    if len(value) > 50:
                        errors[path] = "A maximum of 50 rows is allowed."
                    for row_index, row in enumerate(value):
                        if not isinstance(row, dict):
                            errors[f"{path}.{row_index}"] = "Each row must be a structured object."
                            continue
                        for item_column in item.get("columns", []):
                            cell = row.get(item_column["key"])
                            cell_path = f"{path}.{row_index}.{item_column['key']}"
                            if item_column.get("required") and not _has_value(cell, item_column["kind"]):
                                errors[cell_path] = "This value is required."
                            if item_column["kind"] == "url" and cell and not _is_http_url(cell):
                                errors[cell_path] = "Enter a valid http or https URL."
                            if item_column["kind"] == "score" and cell not in {"", None}:
                                try:
                                    score = float(cell)
                                    if score < 1 or score > 5:
                                        raise ValueError
                                except (TypeError, ValueError):
                                    errors[cell_path] = "Score must be between 1 and 5."
                            if isinstance(cell, str) and len(cell) > 2000:
                                errors[cell_path] = "Maximum length is 2,000 characters."

                if item["kind"] == "url" and value and not _is_http_url(value):
                    errors[path] = "Enter a valid http or https URL."

                if isinstance(value, str) and len(value) > 5000:
                    errors[path] = "Maximum length is 5,000 characters."

    if any(key in FACT_BASED_MODULES for key in (module_keys or [])):
        sources = normalized.get("professional_summary", {}).get("sources", [])
        valid_sources = [
            row
            for row in sources
            if isinstance(row, dict)
            and row.get("title")
            and _is_http_url(row.get("url"))
            and row.get("verified_on")
        ]
        if not valid_sources:
            errors["professional_summary.sources"] = "Add at least one verified official source."

    summary = normalized.get("professional_summary", {}).get("executive_summary", "")
    if summary and len(str(summary).strip()) < 80:
        errors["professional_summary.executive_summary"] = "Provide at least 80 characters."

    completed_count = sum(
        1
        for path in required_paths
        if not any(error_path == path or error_path.startswith(f"{path}.") for error_path in errors)
    )
    percentage = round((completed_count / required_count) * 100) if required_count else 100
    return {
        "valid": not errors,
        "errors": errors,
        "required_fields": required_count,
        "completed_fields": completed_count,
        "completion_percentage": percentage,
        "normalized_content": normalized,
    }


def report_number(report_id: int, created_at: Any = None) -> str:
    year = getattr(created_at, "year", None) or date.today().year
    return f"EWA-{year}-{report_id:06d}"
