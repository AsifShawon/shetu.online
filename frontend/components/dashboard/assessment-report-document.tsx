import { CalendarDays, CheckCircle2, FileText, ShieldCheck, UserRound } from "lucide-react";

import { AssessmentReportSections } from "@/components/dashboard/assessment-report-sections";
import type {
  AssessmentReport,
  RecommendedUniversity,
  ReportContent,
  ReportModuleDefinition,
} from "@/lib/api/assessments";

interface AssessmentReportDocumentProps {
  assessment: {
    id: number;
    assessment_title?: string;
    student_name?: string;
    consultant_name?: string;
    requested_service_categories?: string[];
  };
  report: AssessmentReport;
  modules: ReportModuleDefinition[];
  content: ReportContent;
  universities?: RecommendedUniversity[];
  watermark?: string;
}

function outcomeLabel(content: ReportContent) {
  const value = content.professional_summary?.overall_outcome;
  return String(value || "Professional report").replaceAll("_", " ");
}

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function AssessmentReportDocument({
  assessment,
  report,
  modules,
  content,
  universities = [],
  watermark,
}: AssessmentReportDocumentProps) {
  const outcome = outcomeLabel(content);

  return (
    <article className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      {watermark ? (
        <div className="pointer-events-none absolute right-[-80px] top-24 z-10 rotate-12 border-y-4 border-rose-200 bg-rose-50/90 px-24 py-2 text-3xl font-black tracking-[0.22em] text-rose-300">
          {watermark}
        </div>
      ) : null}

      <header className="bg-gradient-to-br from-[#071a3f] via-[#102f68] to-[#075985] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Shetu Professional Assessment</p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{assessment.assessment_title || "Assessment Report"}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
              Evidence-based educational guidance prepared to support informed student decisions.
            </p>
            <span className="mt-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-black capitalize text-cyan-100">
              {outcome}
            </span>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Report reference</p>
            <p className="mt-2 text-lg font-black">{report.report_number || `EWA-${report.id}`}</p>
            <p className="mt-1 text-sm text-blue-100">Version {report.current_version || 1}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <UserRound size={18} className="text-cyan-300" />
            <p className="mt-3 text-xs uppercase tracking-wider text-blue-200">Student</p>
            <p className="mt-1 font-bold">{report.student_name || assessment.student_name}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <ShieldCheck size={18} className="text-cyan-300" />
            <p className="mt-3 text-xs uppercase tracking-wider text-blue-200">Consultant</p>
            <p className="mt-1 font-bold">{report.consultant_name || assessment.consultant_name}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <CalendarDays size={18} className="text-cyan-300" />
            <p className="mt-3 text-xs uppercase tracking-wider text-blue-200">Issued</p>
            <p className="mt-1 font-bold">{formatDate(report.approved_at || report.updated_at)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <CheckCircle2 size={18} className="text-cyan-300" />
            <p className="mt-3 text-xs uppercase tracking-wider text-blue-200">Status</p>
            <p className="mt-1 font-bold capitalize">{String(report.admin_approval_status || report.submission_status).replaceAll("_", " ")}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(assessment.requested_service_categories || []).map((category) => (
            <span key={category} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">{category}</span>
          ))}
        </div>
      </header>

      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:p-10">
        <aside className="self-start rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 text-slate-900">
            <FileText size={18} />
            <h2 className="text-sm font-black">Report contents</h2>
          </div>
          <nav className="mt-4 space-y-1">
            {modules.map((module, index) => (
              <a
                key={module.key}
                href={`#report-module-${module.key}`}
                className="block rounded-xl px-3 py-2 text-xs font-bold leading-5 text-slate-600 hover:bg-white hover:text-blue-700"
              >
                {index + 1}. {module.title}
              </a>
            ))}
            {universities.length ? (
              <a href="#university-matrix" className="block rounded-xl px-3 py-2 text-xs font-bold leading-5 text-slate-600 hover:bg-white hover:text-blue-700">
                University matrix
              </a>
            ) : null}
          </nav>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Confidential. Facts may change after their recorded verification date.
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <AssessmentReportSections modules={modules} content={content} readOnly />

          {universities.length ? (
            <section id="university-matrix" className="space-y-4">
              <div className="border-b-2 border-slate-900 pb-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Decision matrix</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">University Recommendations</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-4 py-3">University and program</th>
                      <th className="px-4 py-3">Fit</th>
                      <th className="px-4 py-3">Intake</th>
                      <th className="px-4 py-3">Estimated budget</th>
                      <th className="px-4 py-3">Key consideration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {universities.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-900">{item.university_name}</p>
                          <p className="mt-1 text-slate-600">{item.course_name}</p>
                          {item.official_program_url ? <a className="mt-2 block text-xs font-bold text-blue-700 underline" href={item.official_program_url} target="_blank" rel="noreferrer">Official program</a> : null}
                        </td>
                        <td className="px-4 py-4 capitalize text-slate-700">{item.fit_category || "—"}{item.fit_score ? ` (${item.fit_score}/5)` : ""}</td>
                        <td className="px-4 py-4 text-slate-700">{item.intake || "—"}</td>
                        <td className="px-4 py-4 text-slate-700">{item.currency} {item.total_estimated_budget || item.tuition_fees || "—"}</td>
                        <td className="max-w-sm px-4 py-4 text-slate-700">{item.key_risks || item.key_strengths || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <footer className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-sm leading-7 text-slate-300">
            <p className="font-black text-white">Professional guidance and limitation notice</p>
            <p className="mt-2">
              This report supports educational decision-making. It does not guarantee admission, scholarship, visa approval, or any decision controlled by an institution or government authority.
            </p>
          </footer>
        </div>
      </div>
    </article>
  );
}
