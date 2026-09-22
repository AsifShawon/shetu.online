"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AssessmentReportDocument } from "@/components/dashboard/assessment-report-document";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { useToast } from "@/components/layout/toast-provider";
import {
  acceptAssessmentReport,
  createAssessmentReviewRequest,
  createReview,
  getAssessmentReportPdf,
  getAssessmentReportWorkspace,
  getReviews,
  type Assessment,
  type AssessmentReportWorkspace,
  type Review,
} from "@/lib/api/assessments";
import { getApiErrorMessage } from "@/lib/api/client";

const FLOW = ["pending", "accepted", "submitted", "approved", "completed"] as const;

const STATUS_COPY: Record<string, string> = {
  pending: "Your request has been sent and is waiting for consultant action.",
  accepted: "The consultant accepted the request and is preparing the report.",
  submitted: "The report was submitted and is waiting for admin approval.",
  approved: "The report is approved and ready for your final decision.",
  completed: "You accepted the report and the request is complete.",
  revision_requested: "A revision was requested and the report is back with the consultant.",
  rejected: "The consultant rejected the request.",
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "BDT 0";
  return `BDT ${amount.toLocaleString("en-BD")}`;
}

function getStatusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StudentAssessmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const { showToast } = useToast();
  const assessmentId = Number(params.id);

  const [workspace, setWorkspace] = useState<AssessmentReportWorkspace | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const assessment = workspace?.assessment ?? null;

  const load = async () => {
    if (!assessmentId) return;
    setLoading(true);
    try {
      const [workspaceData, reviewData] = await Promise.all([
        getAssessmentReportWorkspace(assessmentId),
        getReviews(),
      ]);
      setWorkspace(workspaceData);
      setReviews(reviewData);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Assessment load failed",
        message: getApiErrorMessage(error, "Unable to load this assessment."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [assessmentId]);

  const existingReview = useMemo(
    () => reviews.find((item) => item.assessment_id === assessmentId) ?? null,
    [assessmentId, reviews],
  );

  const runAction = async (task: () => Promise<void>, successTitle: string, successMessage: string) => {
    setSubmitting(true);
    try {
      await task();
      showToast({ variant: "success", title: successTitle, message: successMessage });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Action failed",
        message: getApiErrorMessage(error, "The requested action could not be completed."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!assessment) return;
    try {
      const exported = await getAssessmentReportPdf(assessment.id);
      const url = URL.createObjectURL(exported.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.filename || `assessment-report-${assessment.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Export failed",
        message: getApiErrorMessage(error, "Unable to download the report right now."),
      });
    }
  };

  if (loading) {
    return (
      <DashboardShell role="student" section="assessments">
        <p className="sd-loading">Loading assessment details...</p>
      </DashboardShell>
    );
  }

  if (!assessment || !workspace) {
    return (
      <DashboardShell role="student" section="assessments">
        <div className="rounded-[28px] bg-white p-4 text-sm text-slate-600 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          Assessment not found.
        </div>
      </DashboardShell>
    );
  }

  const currentIndex =
    assessment.status === "revision_requested"
      ? FLOW.indexOf("approved")
      : FLOW.indexOf(assessment.status as (typeof FLOW)[number]);

  return (
    <DashboardShell role="student" section="assessments">
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Assessment Workflow</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{assessment.assessment_title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {assessment.assessment_description || "Track consultant delivery, report approval, and revision requests from this page."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                <span>Consultant: {assessment.consultant_name || "Assigned consultant"}</span>
                <span>Services: {assessment.requested_service_categories?.join(", ") || "General consulting"}</span>
                <span>Deadline: {formatDate(assessment.deadline_at)}</span>
              </div>
            </div>

            <div className="rounded-[24px] bg-slate-950 p-5 text-white lg:max-w-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current Status</p>
              <h3 className="mt-3 text-2xl font-black">{getStatusLabel(assessment.status)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{STATUS_COPY[assessment.status] ?? "Track the latest assessment event here."}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{assessment.service_title || "Assessment"}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Charge</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{formatMoney(assessment.assessment_charge)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Requested At</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(assessment.created_at)}</p>
            </div>
            <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Accepted At</p>
              <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(assessment.accepted_at)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Workflow progress</h3>
            <p className="mt-1 text-sm text-slate-500">The active V3 flow now moves directly from request acceptance into consultant delivery and report approval.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-5">
            {FLOW.map((step, index) => {
              const isDone = currentIndex >= index;
              const isCurrent = assessment.status === step;
              return (
                <article
                  key={step}
                  className={`rounded-[24px] border p-4 ${
                    isCurrent
                      ? "border-sky-200 bg-sky-50"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                        isCurrent ? "bg-sky-600 text-white" : isDone ? "bg-emerald-600 text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{getStatusLabel(step)}</h4>
                      <p className="mt-1 text-xs leading-6 text-slate-500">{STATUS_COPY[step]}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {assessment.status === "revision_requested" ? (
            <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Revision requested: the consultant is currently reworking the report.
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Consultant report</h3>
              <p className="mt-1 text-sm text-slate-500">The professional report becomes available after Shetu quality approval.</p>
            </div>
            {workspace.report && workspace.can_view_report ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                onClick={() => void handleDownload()}
              >
                Download report
              </button>
            ) : null}
          </div>

          {!workspace.report ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 sm:px-6 sm:py-10">
              {assessment.status === "accepted"
                ? "The consultant accepted your request. The report workspace is open and delivery is in progress."
                : assessment.status === "rejected"
                  ? "This request was rejected, so no report will be produced."
                  : "No report draft is available yet."}
            </div>
          ) : !workspace.can_view_report ? (
            <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h4 className="mt-4 text-lg font-black text-slate-900">Quality review in progress</h4>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                The consultant report is being reviewed. You can read and download the approved version here once quality review is complete.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[20px] border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  Submission: <strong className="text-slate-900">{getStatusLabel(workspace.report.submission_status)}</strong>
                </p>
                <p className="mt-1">
                  Admin approval: <strong className="text-slate-900">{getStatusLabel(workspace.report.admin_approval_status || "pending")}</strong>
                </p>
                {workspace.report.rejection_reason ? (
                  <p className="mt-2 text-rose-600">Admin rejection reason: {workspace.report.rejection_reason}</p>
                ) : null}
              </div>

              {workspace.show_recommended_universities && workspace.recommended_universities.length > 0 ? (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <h4 className="text-lg font-black text-slate-900">Recommended Universities</h4>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-white text-slate-700">
                          <th className="px-4 py-3 font-semibold">University</th>
                          <th className="px-4 py-3 font-semibold">Course</th>
                          <th className="px-4 py-3 font-semibold">Budget</th>
                          <th className="px-4 py-3 font-semibold">IELTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspace.recommended_universities.map((item) => (
                          <tr key={item.id} className="border-t border-slate-200 bg-white">
                            <td className="px-4 py-3">{item.university_name}</td>
                            <td className="px-4 py-3">{item.course_name}</td>
                            <td className="px-4 py-3">{item.total_estimated_budget || item.tuition_fees || "—"}</td>
                            <td className="px-4 py-3">{item.ielts || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              <AssessmentReportDocument
                assessment={workspace.assessment}
                report={workspace.report}
                modules={workspace.module_definitions}
                content={workspace.content}
              />
            </div>
          )}

          {assessment.status === "approved" ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <button
                type="button"
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                disabled={submitting}
                onClick={() =>
                  runAction(
                    () => acceptAssessmentReport(assessment.id).then(() => undefined),
                    "Report accepted",
                    "The report was accepted and the assessment is now complete.",
                  )
                }
              >
                Accept report
              </button>

              <form
                className="rounded-[22px] border border-slate-100 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAction(
                    () => createAssessmentReviewRequest(assessment.id, reviewReason).then(() => undefined),
                    "Revision requested",
                    "The consultant was asked to revise the report.",
                  );
                }}
              >
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revision request</label>
                <textarea
                  className="min-h-[120px] w-full rounded-[20px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                  placeholder="Explain what needs to change before you can accept the report."
                  value={reviewReason}
                  onChange={(event) => setReviewReason(event.target.value)}
                  required
                />
                <button type="submit" className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" disabled={submitting}>
                  Ask for revision
                </button>
              </form>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5">
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Revision requests and feedback</h3>
            <p className="mt-1 text-sm text-slate-500">Track your revision loop and leave a final review after the report is complete.</p>
          </div>

          <div className="space-y-3">
            {assessment.review_requests?.length ? (
              assessment.review_requests.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-slate-900">{item.reason}</p>
                      {item.admin_notes ? <p className="mt-2 text-sm text-slate-600">Admin: {item.admin_notes}</p> : null}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 sm:px-6 sm:py-10">
                No review request has been opened for this assessment.
              </div>
            )}
          </div>

          {assessment.status === "completed" && !existingReview ? (
            <form
              className="mt-4 rounded-[22px] border border-slate-100 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                runAction(
                  () =>
                    createReview({
                      assessment_id: assessment.id,
                      review_message: reviewMessage,
                      review_rating: Number(reviewRating),
                    }).then(() => undefined),
                  "Review submitted",
                  "Your final consultant feedback was saved.",
                );
              }}
            >
              <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rating</label>
                  <select
                    className="h-12 w-full rounded-[18px] border border-slate-200 px-3 text-sm text-slate-700 outline-none"
                    value={reviewRating}
                    onChange={(event) => setReviewRating(event.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Feedback</label>
                  <textarea
                    className="min-h-[120px] w-full rounded-[20px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Describe the quality of the consultant delivery."
                    value={reviewMessage}
                    onChange={(event) => setReviewMessage(event.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white" disabled={submitting}>
                Submit final review
              </button>
            </form>
          ) : existingReview ? (
            <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-900">Your rating: {existingReview.review_rating}/5</p>
              <p className="mt-2 text-sm leading-7 text-emerald-800">{existingReview.review_message}</p>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardShell>
  );
}
