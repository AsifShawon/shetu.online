"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { AssessmentReportDocument } from "@/components/dashboard/assessment-report-document";
import { useToast } from "@/components/layout/toast-provider";
import {
  getAdminResourceDetail,
  postAdminAction,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";
import { getAssessmentReportPdf, type AssessmentReport } from "@/lib/api/assessments";

const RESOURCE_PATH = "/api/admin/assessment-reports/";

function formatStatus(value?: string | null) {
  return String(value || "-").replaceAll("_", " ");
}

export default function AdminAssessmentReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [qaChecks, setQaChecks] = useState<Record<string, boolean>>({
    identity_verified: false,
    required_sections_complete: false,
    evidence_current: false,
    recommendations_actionable: false,
    limitations_declared: false,
  });

  const reportId = useMemo(() => {
    const value = Number(params.id);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [params.id]);

  const load = async () => {
    if (!reportId) {
      setReport(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setReport(await getAdminResourceDetail<AssessmentReport>(RESOURCE_PATH, reportId));
    } catch (error) {
      setReport(null);
      showToast({
        variant: "error",
        title: "Report load failed",
        message: getApiErrorMessage(error, "Unable to load this report."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [reportId]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!reportId) return;
    setBusy(true);
    try {
      const payload =
        action === "reject"
          ? { rejection_reason: rejectionReason, qa_checks: qaChecks }
          : { qa_checks: qaChecks };
      await postAdminAction(RESOURCE_PATH, reportId, action, payload);
      showToast({
        variant: "success",
        title: action === "approve" ? "Report approved" : "Report rejected",
        message: "The report status was updated.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Report update failed",
        message: getApiErrorMessage(error, "Unable to update report approval."),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    try {
      const exported = await getAssessmentReportPdf(report.assessment_id);
      const url = URL.createObjectURL(exported.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.filename || `${report.report_number || "assessment-report"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        variant: "error",
        title: "PDF preview failed",
        message: getApiErrorMessage(error, "Unable to generate the report PDF."),
      });
    }
  };

  return (
    <AdminShell
      section="verification"
      resourceKey="assessment-reports"
      title="Assessment Report Review"
      description="Review the full consultant report, recommendations, and approval metadata before taking action."
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href={"/admin/assessment-reports" as Route} className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Back to report queue
            </Link>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Structured Report Review</h2>
          </div>
          {report ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                disabled={busy}
                onClick={() => void handleDownload()}
              >
                Preview PDF
              </button>
              <button
                type="button"
                className="rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600"
                disabled={busy || (report.schema_version === 2 && !Object.values(qaChecks).every(Boolean))}
                onClick={() => void handleAction("approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-md border border-rose-500 px-4 py-2 text-sm font-semibold text-rose-600"
                disabled={busy || (report.schema_version === 2 && rejectionReason.trim().length < 20)}
                onClick={() => void handleAction("reject")}
              >
                Reject
              </button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <section className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
            Loading report...
          </section>
        ) : !report ? (
          <section className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
            Report not found.
          </section>
        ) : (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Assessment</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{report.assessment_title || `Assessment #${report.assessment_id}`}</p>
                  <p className="mt-1 text-sm text-slate-500">#{String(report.assessment_id)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{report.student_name || report.student_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Consultant</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{report.consultant_name || report.consultant_id}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deadline</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{report.deadline_at || "-"}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Submission</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatStatus(report.submission_status)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Approval</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{formatStatus(report.admin_approval_status)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modules</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {(report.module_keys || []).length > 0
                      ? (report.module_keys || []).map((item) => item.replaceAll("_", " ")).join(", ")
                      : "-"}
                  </p>
                </div>
              </div>
            </section>

            {report.schema_version === 2 ? (
              <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Mandatory quality assurance</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">Admin approval checklist</h3>
                    <p className="mt-1 text-sm text-slate-600">All checks are required before approval. Rejection requires a clear written reason.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700">
                    {Object.values(qaChecks).filter(Boolean).length}/{Object.keys(qaChecks).length} complete
                  </span>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    ["identity_verified", "Student, consultant, report category and version are correct."],
                    ["required_sections_complete", "Required sections and structured tables are complete."],
                    ["evidence_current", "Claims use current, official and traceable evidence."],
                    ["recommendations_actionable", "Recommendations, risks and next actions are specific and actionable."],
                    ["limitations_declared", "Assumptions, limitations and non-guarantee wording are present."],
                  ].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={qaChecks[key]}
                        onChange={(event) => setQaChecks((current) => ({ ...current, [key]: event.target.checked }))}
                      />
                      <span className="text-sm font-semibold leading-6 text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-5 block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Rejection reason</span>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Explain the specific corrections required (minimum 20 characters)."
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                  />
                  <span className="mt-1 block text-xs text-slate-500">{rejectionReason.trim().length}/20 minimum</span>
                </label>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-xl font-semibold text-slate-900">Report Content</h3>
                <p className="mt-1 text-sm text-slate-500">This mirrors the structured report shown to consultants and students.</p>
              </div>
              <AssessmentReportDocument
                assessment={{
                  id: report.assessment_id,
                  assessment_title: report.assessment_title,
                  student_name: report.student_name,
                  consultant_name: report.consultant_name,
                }}
                report={report}
                modules={report.module_definitions || []}
                content={report.content || {}}
                universities={report.recommended_universities || []}
                watermark={String(report.admin_approval_status || "pending").toUpperCase()}
              />
            </section>

            {report.show_recommended_universities ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-xl font-semibold text-slate-900">University Recommendations</h3>
                  <p className="mt-1 text-sm text-slate-500">Shown only for academically relevant service combinations.</p>
                </div>
                {(report.recommended_universities || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No university recommendations were added.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                        <tr>
                          <th className="px-4 py-3 font-semibold">University</th>
                          <th className="px-4 py-3 font-semibold">Course</th>
                          <th className="px-4 py-3 font-semibold">Budget</th>
                          <th className="px-4 py-3 font-semibold">IELTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.recommended_universities || []).map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-4 py-3 text-slate-700">{item.university_name}</td>
                            <td className="px-4 py-3 text-slate-700">{item.course_name}</td>
                            <td className="px-4 py-3 text-slate-700">{item.total_estimated_budget || item.tuition_fees || "-"}</td>
                            <td className="px-4 py-3 text-slate-700">{item.ielts || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}

            {report.snapshots?.length ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-900">Submission history</h3>
                <p className="mt-1 text-sm text-slate-500">Immutable consultant submissions and admin decisions.</p>
                <div className="mt-5 space-y-3">
                  {report.snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-black text-slate-900">Version {snapshot.version}</p>
                        <p className="mt-1 text-xs text-slate-500">Submitted by {snapshot.submitted_by_name} · {new Date(snapshot.submitted_at).toLocaleString()}</p>
                      </div>
                      <span className={`self-start rounded-full px-3 py-1 text-xs font-black capitalize ${
                        snapshot.admin_approval_status === "approved" ? "bg-emerald-100 text-emerald-700" :
                        snapshot.admin_approval_status === "rejected" ? "bg-rose-100 text-rose-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {snapshot.admin_approval_status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Rejection Reason History</h3>
              {report.rejection_reason ? (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {report.rejection_reason}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No rejection reason has been recorded for this report.</p>
              )}
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}
