from __future__ import annotations

from html import escape
from typing import Any

from django.utils import timezone

from apps.assessments.reporting import get_module_definitions
from apps.assessments.reporting_v2 import report_number


def _text(value: Any) -> str:
    return escape(str(value or "")).replace("\n", "<br />")


def _option_label(field: dict[str, Any], value: Any) -> str:
    for item in field.get("options", []):
        if item.get("value") == value:
            return item.get("label", str(value))
    return str(value or "").replace("_", " ").title()


def _render_field(field: dict[str, Any], value: Any) -> str:
    if value in ("", None, []):
        return ""
    label = escape(field["label"])
    kind = field.get("kind", "long_text")

    if kind == "repeater" and isinstance(value, list):
        columns = field.get("columns", [])
        headings = "".join(f"<th>{escape(item['label'])}</th>" for item in columns)
        rows = []
        for row in value:
            if not isinstance(row, dict):
                continue
            cells = []
            for item in columns:
                cell = row.get(item["key"], "")
                if item.get("kind") == "select":
                    cell = str(cell).replace("_", " ").title()
                if item.get("kind") == "url" and cell:
                    safe_url = escape(str(cell), quote=True)
                    cells.append(f"<td><a href='{safe_url}'>{safe_url}</a></td>")
                else:
                    cells.append(f"<td>{_text(cell)}</td>")
            rows.append(f"<tr>{''.join(cells)}</tr>")
        if not rows:
            return ""
        return (
            f"<div class='field-block'><h4>{label}</h4>"
            f"<div class='table-wrap'><table><thead><tr>{headings}</tr></thead>"
            f"<tbody>{''.join(rows)}</tbody></table></div></div>"
        )

    if kind == "checklist" and isinstance(value, list):
        values = []
        for selected in value:
            values.append(f"<li>{escape(_option_label(field, selected))}</li>")
        return f"<div class='field-block'><h4>{label}</h4><ul>{''.join(values)}</ul></div>"

    rendered = _option_label(field, value) if kind == "select" else str(value)
    if kind == "url":
        safe_url = escape(rendered, quote=True)
        body = f"<a href='{safe_url}'>{safe_url}</a>"
    else:
        body = _text(rendered)
    return f"<div class='field-block'><h4>{label}</h4><p>{body}</p></div>"


def serialize_university(university: Any) -> dict[str, Any]:
    if isinstance(university, dict):
        return university
    return {
        "university_name": university.university_name,
        "course_name": university.course_name,
        "country": university.country,
        "program_level": university.program_level,
        "intake": university.intake,
        "duration": university.duration,
        "application_deadline": university.application_deadline.isoformat()
        if university.application_deadline
        else "",
        "currency": university.currency,
        "fit_category": university.fit_category,
        "fit_score": university.fit_score,
        "official_program_url": university.official_program_url,
        "entry_requirements": university.entry_requirements,
        "key_strengths": university.key_strengths,
        "key_risks": university.key_risks,
        "tuition_fees": str(university.tuition_fees or ""),
        "living_expenses": str(university.living_expenses or ""),
        "total_estimated_budget": str(university.total_estimated_budget or ""),
        "ielts": university.ielts,
        "scholarships": university.scholarships,
    }


def render_professional_report_html(
    *,
    report: Any,
    assessment: Any,
    module_keys: list[str],
    content: dict[str, Any],
    recommended_universities: list[Any],
    version: int,
    watermark: str = "",
) -> str:
    modules = get_module_definitions(module_keys, schema_version=2)
    title = assessment.assessment_title or "Professional Assessment Report"
    student_name = assessment.student.get_full_name() or assessment.student.email
    consultant_name = assessment.consultant.get_full_name() or assessment.consultant.email
    number = report_number(report.id, report.created_at)
    categories = assessment.requested_service_categories or [
        module["title"] for module in modules if module["key"] != "professional_summary"
    ]

    toc_items = []
    sections = []
    for index, module in enumerate(modules, start=1):
        module_content = content.get(module["key"], {})
        section_html = []
        for section in module["sections"]:
            fields = [
                _render_field(item, module_content.get(item["key"]))
                for item in section["fields"]
            ]
            rendered_fields = "".join(item for item in fields if item)
            if rendered_fields:
                section_html.append(
                    f"<section class='report-section'><h3>{escape(section['title'])}</h3>{rendered_fields}</section>"
                )
        if section_html:
            anchor = f"module-{index}"
            toc_items.append(f"<li><a href='#{anchor}'>{escape(module['title'])}</a></li>")
            sections.append(
                f"<article class='module' id='{anchor}'><h2>{index}. {escape(module['title'])}</h2>"
                f"<p class='module-description'>{escape(module.get('description', ''))}</p>"
                f"{''.join(section_html)}</article>"
            )

    university_html = ""
    university_rows = [serialize_university(item) for item in recommended_universities]
    if university_rows:
        rows = []
        for item in university_rows:
            url = item.get("official_program_url", "")
            university = escape(str(item.get("university_name", "")))
            if url:
                university = f"<a href='{escape(str(url), quote=True)}'>{university}</a>"
            rows.append(
                "<tr>"
                f"<td>{university}</td>"
                f"<td>{_text(item.get('course_name'))}</td>"
                f"<td>{_text(item.get('fit_category')).title()}</td>"
                f"<td>{_text(item.get('intake'))}</td>"
                f"<td>{_text(item.get('currency'))} {_text(item.get('total_estimated_budget') or item.get('tuition_fees'))}</td>"
                "</tr>"
            )
        university_html = (
            "<article class='module' id='university-recommendations'>"
            "<h2>University Recommendation Matrix</h2>"
            "<div class='table-wrap'><table><thead><tr>"
            "<th>University</th><th>Program</th><th>Fit</th><th>Intake</th><th>Estimated Budget</th>"
            f"</tr></thead><tbody>{''.join(rows)}</tbody></table></div></article>"
        )
        toc_items.append("<li><a href='#university-recommendations'>University Recommendation Matrix</a></li>")

    outcome = content.get("professional_summary", {}).get("overall_outcome", "")
    outcome_label = str(outcome).replace("_", " ").title() or "Draft"
    generated = timezone.now().strftime("%d %B %Y, %H:%M %Z")
    watermark_html = f"<div class='watermark'>{escape(watermark.upper())}</div>" if watermark else ""

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{escape(title)} — {number}</title>
  <style>
    @page {{
      size: A4;
      margin: 22mm 16mm 20mm;
      @top-left {{ content: "EDUWISE • CONFIDENTIAL"; color: #64748b; font-size: 8pt; letter-spacing: 1px; }}
      @top-right {{ content: "{number} • v{version}"; color: #64748b; font-size: 8pt; }}
      @bottom-left {{ content: "Professional educational guidance — no admission, scholarship, or visa guarantee"; color: #64748b; font-size: 7pt; }}
      @bottom-right {{ content: "Page " counter(page) " of " counter(pages); color: #64748b; font-size: 8pt; }}
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; color: #172033; font: 10pt/1.55 "Noto Sans", Arial, sans-serif; }}
    a {{ color: #1d4ed8; overflow-wrap: anywhere; }}
    .cover {{ min-height: 230mm; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }}
    .brand {{ color: #1e3a8a; font-size: 15pt; font-weight: 800; letter-spacing: 1px; }}
    .eyebrow {{ margin-top: 35mm; color: #0f7490; font-size: 9pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }}
    h1 {{ margin: 6mm 0 4mm; color: #102a56; font-size: 27pt; line-height: 1.15; }}
    .subtitle {{ color: #64748b; font-size: 12pt; }}
    .outcome {{ display: inline-block; margin-top: 8mm; border-radius: 20px; background: #e0f2fe; color: #075985; padding: 3mm 6mm; font-weight: 800; }}
    .cover-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-top: 16mm; }}
    .meta-card {{ border: 1px solid #dbe5f0; border-radius: 10px; padding: 5mm; }}
    .meta-label {{ color: #64748b; font-size: 8pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }}
    .meta-value {{ margin-top: 1mm; color: #0f172a; font-size: 11pt; font-weight: 700; }}
    .category-list {{ margin-top: 5mm; color: #475569; }}
    .notice {{ border-left: 4px solid #0f7490; background: #f0f9ff; padding: 4mm; color: #334155; }}
    .toc {{ page-break-after: always; }}
    h2 {{ margin: 0 0 2mm; color: #102a56; font-size: 18pt; page-break-after: avoid; }}
    h3 {{ margin: 6mm 0 3mm; color: #1e3a5f; font-size: 12pt; page-break-after: avoid; }}
    h4 {{ margin: 0 0 1.5mm; color: #475569; font-size: 8pt; letter-spacing: .5px; text-transform: uppercase; }}
    p {{ margin: 0; }}
    .toc ol {{ padding-left: 6mm; }}
    .toc li {{ margin: 3mm 0; }}
    .module {{ page-break-before: always; }}
    .module-description {{ margin-bottom: 6mm; color: #64748b; }}
    .report-section {{ margin: 5mm 0; border-top: 1px solid #dbe5f0; padding-top: 3mm; }}
    .field-block {{ margin: 4mm 0; page-break-inside: avoid; }}
    .field-block p, .field-block ul {{ margin: 0; border-radius: 7px; background: #f8fafc; padding: 4mm; }}
    .field-block ul {{ padding-left: 9mm; }}
    .table-wrap {{ overflow: hidden; border: 1px solid #cbd5e1; border-radius: 7px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 8pt; }}
    thead {{ display: table-header-group; }}
    tr {{ page-break-inside: avoid; }}
    th {{ background: #eaf1f8; color: #1e3a5f; text-align: left; }}
    th, td {{ border-bottom: 1px solid #dbe5f0; padding: 2.5mm; vertical-align: top; }}
    .watermark {{ position: fixed; top: 42%; left: 18%; transform: rotate(-32deg); color: rgba(185,28,28,.12); font-size: 72pt; font-weight: 900; z-index: -1; }}
  </style>
</head>
<body>
  {watermark_html}
  <section class="cover">
    <div>
      <div class="brand">EDUWISE</div>
      <div class="eyebrow">Professional Assessment Report</div>
      <h1>{escape(title)}</h1>
      <p class="subtitle">Evidence-based guidance prepared for informed student decision-making.</p>
      <span class="outcome">{escape(outcome_label)}</span>
      <div class="cover-grid">
        <div class="meta-card"><div class="meta-label">Student</div><div class="meta-value">{escape(student_name)}</div></div>
        <div class="meta-card"><div class="meta-label">Consultant</div><div class="meta-value">{escape(consultant_name)}</div></div>
        <div class="meta-card"><div class="meta-label">Report</div><div class="meta-value">{number} • Version {version}</div></div>
        <div class="meta-card"><div class="meta-label">Generated</div><div class="meta-value">{escape(generated)}</div></div>
      </div>
      <p class="category-list"><strong>Assessment categories:</strong> {escape(", ".join(categories))}</p>
    </div>
    <div class="notice"><strong>Confidentiality and limitations.</strong> This document is confidential and intended for the named student. Information may change after the recorded verification date. Final decisions remain with education providers, scholarship bodies, and immigration authorities.</div>
  </section>
  <section class="toc">
    <h2>Contents</h2>
    <ol>{''.join(toc_items)}</ol>
  </section>
  {''.join(sections)}
  {university_html}
</body>
</html>"""


def render_pdf_bytes(html: str) -> bytes:
    try:
        from weasyprint import HTML
    except ImportError as exc:
        raise RuntimeError("PDF generation is unavailable because WeasyPrint is not installed.") from exc
    return HTML(string=html, base_url=None).write_pdf()
