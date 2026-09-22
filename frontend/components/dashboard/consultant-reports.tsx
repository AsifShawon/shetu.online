"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AssessmentReportSections } from "@/components/dashboard/assessment-report-sections";
import { AssessmentReportDocument } from "@/components/dashboard/assessment-report-document";
import { useToast } from "@/components/layout/toast-provider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  createAssessmentReport,
  createRecommendedUniversity,
  deleteRecommendedUniversity,
  getAssessments,
  getAssessmentReportWorkspace,
  submitAssessmentReport,
  updateAssessmentReport,
  updateRecommendedUniversity,
  type Assessment,
  type ReportContent,
  type ReportValue,
  type AssessmentReportWorkspace,
  type RecommendedUniversity,
} from "@/lib/api/assessments";
import { ApiError, getApiErrorMessage } from "@/lib/api/client";

const WORKSPACE_STATUSES = new Set([
  "accepted",
  "revision_requested",
  "submitted",
  "approved",
  "completed",
]);

function defaultUniversityForm(): Partial<RecommendedUniversity> {
  return {
    university_name: "",
    course_name: "",
    country: "",
    program_level: "",
    intake: "",
    duration: "",
    application_deadline: null,
    currency: "",
    fit_category: "",
    fit_score: null,
    official_program_url: "",
    entry_requirements: "",
    key_strengths: "",
    key_risks: "",
    tuition_fees: "",
    living_expenses: "",
    total_estimated_budget: "",
    ielts: "",
    scholarships: "",
    visa_type: "",
    visa_processing_time: "",
    application_processing_time: "",
    admission_notification_time: "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "No deadline assigned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline assigned";
  return date.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionLabel(assessment: Assessment, workspace?: AssessmentReportWorkspace | null) {
  const report = workspace?.report;
  if (!report) return "Write Report";
  if (assessment.status === "submitted" || assessment.status === "approved" || assessment.status === "completed") {
    return "View Submitted";
  }
  if (report.submission_status === "revision_requested") return "Revise Report";
  return "Edit Draft";
}

export function ConsultantReports() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [workspace, setWorkspace] = useState<AssessmentReportWorkspace | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uniForm, setUniForm] = useState<Partial<RecommendedUniversity>>(defaultUniversityForm());
  const [editingUniversityId, setEditingUniversityId] = useState<number | null>(null);
  const [showUniForm, setShowUniForm] = useState(false);
  const [reportContent, setReportContent] = useState<ReportContent>({});
  const [activeModuleKey, setActiveModuleKey] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("idle");
  const [previewMode, setPreviewMode] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedAssessment = useMemo(
    () => assessments.find((assessment) => assessment.id === selectedId) ?? null,
    [assessments, selectedId],
  );

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const data = await getAssessments();
      const filtered = data.filter((assessment) => WORKSPACE_STATUSES.has(assessment.status));
      setAssessments(filtered);
      return filtered;
    } catch (error) {
      setAssessments([]);
      showToast({
        variant: "error",
        title: "Assessment load failed",
        message: getApiErrorMessage(error, "Unable to load consultant assessments."),
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspace = async (assessmentId: number) => {
    setWorkspaceLoading(true);
    try {
      const data = await getAssessmentReportWorkspace(assessmentId);
      setWorkspace(data);
      setReportContent(data.content ?? {});
      setActiveModuleKey((current) => current && data.module_definitions.some((module) => module.key === current) ? current : data.module_definitions[0]?.key || "");
      setFieldErrors(data.validation?.errors ?? {});
      setSaveState("idle");
      return data;
    } catch (error) {
      setWorkspace(null);
      setReportContent({});
      showToast({
        variant: "error",
        title: "Workspace load failed",
        message: getApiErrorMessage(error, "Unable to open the report workspace."),
      });
      return null;
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    const requestedId = Number(searchParams.get("assessment"));
    const initialId = Number.isFinite(requestedId) && requestedId > 0 ? requestedId : null;

    loadAssessments().then((loadedAssessments) => {
      if (initialId && loadedAssessments.some((assessment) => assessment.id === initialId)) {
        setSelectedId(initialId);
        void loadWorkspace(initialId);
      }
    });
  }, [searchParams, showToast]);

  const handleSelectAssessment = async (assessmentId: number) => {
    setSelectedId(assessmentId);
    router.replace(`/dashboard/consultant/reports?assessment=${assessmentId}`);
    setEditingUniversityId(null);
    setShowUniForm(false);
    setUniForm(defaultUniversityForm());
    await loadWorkspace(assessmentId);
  };

  const handleContentChange = (moduleKey: string, fieldKey: string, value: ReportValue) => {
    setReportContent((current) => ({
      ...current,
      [moduleKey]: {
        ...(current[moduleKey] ?? {}),
        [fieldKey]: value,
      },
    }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[`${moduleKey}.${fieldKey}`];
      return next;
    });
    setSaveState("unsaved");
  };

  const persistDraft = useCallback(async (content: ReportContent = reportContent) => {
    if (!workspace) return null;

    const payload = {
      assessment_id: workspace.assessment.id,
      template_key: workspace.assessment.report_template_key || workspace.report?.template_key,
      module_keys: workspace.assessment.report_module_keys || workspace.report?.module_keys || workspace.module_definitions.map((module) => module.key),
      content,
    };

    let saved;
    if (workspace.report) {
      saved = await updateAssessmentReport(workspace.report.id, payload);
    } else {
      saved = await createAssessmentReport(payload);
    }
    setWorkspace((current) => current ? {
      ...current,
      report: saved,
      validation: saved.validation ?? current.validation,
    } : current);
    setFieldErrors(saved.validation?.errors ?? {});
    return saved;
  }, [reportContent, workspace]);

  useEffect(() => {
    if (!workspace?.can_edit || saveState !== "unsaved") return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      setSaveState("saving");
      void persistDraft(reportContent)
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [persistDraft, reportContent, saveState, workspace?.can_edit]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState !== "unsaved" && saveState !== "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [saveState]);

  const runReportAction = async (action: "draft" | "submit") => {
    if (!workspace) return;
    if (action === "submit" && !window.confirm(
      "Submit this report for admin quality review? The submitted version will be locked and preserved as an audit snapshot.",
    )) return;
    setSubmitting(true);
    try {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      setSaveState("saving");
      const report = await persistDraft();
      if (action === "submit" && report) {
        await submitAssessmentReport(report.id);
      }
      await loadAssessments();
      await loadWorkspace(workspace.assessment.id);
      setSaveState("saved");
      showToast({
        variant: "success",
        title: action === "submit" ? "Report submitted" : "Draft saved",
        message:
          action === "submit"
            ? "The consultant report was submitted for admin approval."
            : "The report draft was saved successfully.",
      });
    } catch (error) {
      if (error instanceof ApiError && error.body && typeof error.body === "object") {
        const body = error.body as { field_errors?: Record<string, string> };
        if (body.field_errors) setFieldErrors(body.field_errors);
      }
      setSaveState("error");
      showToast({
        variant: "error",
        title: action === "submit" ? "Report submit failed" : "Draft save failed",
        message: getApiErrorMessage(error, "The report action could not be completed."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUniField = (field: keyof RecommendedUniversity) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setUniForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleUniversityEdit = (item: RecommendedUniversity) => {
    setEditingUniversityId(item.id);
    setUniForm(item);
    setShowUniForm(true);
  };

  const handleUniversityDelete = async (id: number) => {
    if (!workspace) return;
    setSubmitting(true);
    try {
      await deleteRecommendedUniversity(id);
      await loadWorkspace(workspace.assessment.id);
      showToast({
        variant: "success",
        title: "University removed",
        message: "The recommendation entry was deleted.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to remove this university entry."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUniversitySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspace) return;
    setSubmitting(true);
    try {
      const payload = {
        ...uniForm,
        assessment_id: workspace.assessment.id,
      };
      if (editingUniversityId) {
        await updateRecommendedUniversity(editingUniversityId, payload);
      } else {
        await createRecommendedUniversity(payload);
      }
      setEditingUniversityId(null);
      setUniForm(defaultUniversityForm());
      setShowUniForm(false);
      await loadWorkspace(workspace.assessment.id);
      showToast({
        variant: "success",
        title: editingUniversityId ? "University updated" : "University added",
        message: "The recommendation list was updated.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "University save failed",
        message: getApiErrorMessage(error, "Unable to update university recommendations."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Link href="/dashboard/consultant" className="hover:text-primary transition-colors">Dashboard</Link>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Reports Workspace</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">Assessment Workspace</h2>
      </div>

      {/* Select Assessment Section */}
      <section className="flex flex-col gap-4">
        <h3 className="px-2 text-lg font-black text-slate-900">Active Assessments</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-10 text-center text-sm font-bold text-slate-400">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="col-span-full rounded-[2.5rem] bg-white p-10 text-center shadow-sm border border-slate-100">
              <p className="text-sm font-bold text-slate-400">No report-ready assessments found.</p>
            </div>
          ) : (
            assessments.map((assessment) => {
              const isSelected = selectedId === assessment.id;
              return (
                <button
                  key={assessment.id}
                  onClick={() => void handleSelectAssessment(assessment.id)}
                  className={cn(
                    "flex flex-col gap-3 rounded-3xl p-5 text-left transition-all border shadow-sm",
                    isSelected 
                      ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "bg-white text-slate-600 border-slate-100 hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                      isSelected ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                    )}>
                      {assessment.status.replaceAll("_", " ")}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      isSelected ? "text-white/60" : "text-slate-400"
                    )}>
                      {formatDate(assessment.deadline_at).split(",")[0]}
                    </span>
                  </div>
                  <h4 className="line-clamp-1 text-sm font-black leading-tight">{assessment.assessment_title}</h4>
                  <p className={cn(
                    "text-[11px] font-bold",
                    isSelected ? "text-white/70" : "text-slate-400"
                  )}>
                    {assessment.student_name || "Unknown Student"}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </section>

      {selectedAssessment && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          {workspaceLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
              <p className="text-sm font-bold text-slate-500">Loading workspace...</p>
            </div>
          ) : workspace && (
            <>
              {/* Workspace Header */}
              <section className="overflow-hidden rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50 lg:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                        <img src="/legacy/no-profile-img.png" alt="" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">{workspace.assessment.assessment_title}</h3>
                        <p className="text-sm font-bold text-primary">{workspace.assessment.student_name}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-4 rounded-3xl bg-slate-50 p-4 sm:grid-cols-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status</span>
                        <span className="text-xs font-black text-slate-700 uppercase">{workspace.assessment.status.replaceAll("_", " ")}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Deadline</span>
                        <span className="text-xs font-black text-slate-700 truncate">{formatDate(workspace.assessment.deadline_at)}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">IELTS Score</span>
                        <span className="text-xs font-black text-slate-700">{workspace.student_profile?.ielts_score || "—"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Education</span>
                        <span className="text-xs font-black text-slate-700 truncate">{workspace.student_profile?.last_education_title || "—"}</span>
                      </div>
                    </div>

                    {workspace.report_locked && (
                      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-700 border border-amber-100">
                        <i className="fa-solid fa-lock" />
                        <p className="text-xs font-bold">This report is locked because it has already been submitted.</p>
                      </div>
                    )}

                    {workspace.report?.rejection_reason && (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700 border border-rose-100">
                        <i className="fa-solid fa-circle-exclamation" />
                        <p className="text-xs font-bold">Revision required: {workspace.report.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-10 flex flex-col gap-8">
                  <div className="border-t border-slate-100 pt-8">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Guided professional report</p>
                        <h4 className="mt-1 text-xl font-black text-slate-900">Report workspace</h4>
                        <p className="mt-1 text-sm text-slate-500">Complete each required section. Drafts save automatically after 1.5 seconds.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                          disabled={!workspace.report}
                          onClick={() => setPreviewMode((current) => !current)}
                        >
                          {previewMode ? "Back to editor" : "Professional preview"}
                        </button>
                        <span className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-black capitalize",
                          saveState === "error" ? "bg-rose-100 text-rose-700" :
                          saveState === "saving" || saveState === "unsaved" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700",
                        )}>
                          {saveState === "unsaved" ? "Unsaved changes" : saveState === "idle" ? "Ready" : saveState}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                          {workspace.report?.validation?.completion_percentage ?? workspace.validation?.completion_percentage ?? 0}% complete
                        </span>
                      </div>
                    </div>

                    {Object.keys(fieldErrors).length > 0 ? (
                      <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        <p className="font-black">This report still has {Object.keys(fieldErrors).length} required item{Object.keys(fieldErrors).length === 1 ? "" : "s"} to complete.</p>
                        <p className="mt-1">Open the highlighted sections below before submitting.</p>
                      </div>
                    ) : null}

                    <div className={previewMode ? "block" : "grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"}>
                      {!previewMode ? <aside className="self-start rounded-3xl border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-5">
                        <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Report sections</p>
                        <div className="space-y-1">
                          {workspace.module_definitions.map((module, index) => {
                            const moduleHasError = Object.keys(fieldErrors).some((path) => path.startsWith(`${module.key}.`));
                            return (
                              <button
                                key={module.key}
                                type="button"
                                className={cn(
                                  "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-xs font-black transition",
                                  activeModuleKey === module.key ? "bg-slate-950 text-white shadow-lg" : "text-slate-600 hover:bg-white",
                                )}
                                onClick={() => setActiveModuleKey(module.key)}
                              >
                                <span>{index + 1}. {module.title}</span>
                                <span className={cn("h-2.5 w-2.5 rounded-full", moduleHasError ? "bg-rose-500" : "bg-emerald-400")} />
                              </button>
                            );
                          })}
                        </div>
                      </aside> : null}
                      {previewMode && workspace.report ? (
                        <AssessmentReportDocument
                          assessment={workspace.assessment}
                          report={workspace.report}
                          modules={workspace.module_definitions}
                          content={reportContent}
                          universities={workspace.recommended_universities}
                          watermark={workspace.report.submission_status === "submitted" ? "Pending approval" : "Draft"}
                        />
                      ) : (
                      <AssessmentReportSections
                        modules={workspace.module_definitions}
                        content={reportContent}
                        readOnly={!workspace.can_edit}
                        errors={fieldErrors}
                        activeModuleKey={activeModuleKey}
                        onChange={handleContentChange}
                      />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-8 text-sm font-black text-slate-600 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                      disabled={!workspace.can_edit || submitting}
                      onClick={() => void runReportAction("draft")}
                    >
                      <i className="fa-regular fa-floppy-disk" />
                      {submitting ? "Saving..." : "Save Draft"}
                    </button>
                    <button
                      type="button"
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-sm font-black text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      disabled={!workspace.can_submit || submitting}
                      onClick={() => void runReportAction("submit")}
                    >
                      <i className="fa-solid fa-paper-plane" />
                      {submitting ? "Submitting..." : "Submit for Approval"}
                    </button>
                  </div>
                </div>
              </section>

              {/* University Recommendations */}
              {workspace.show_recommended_universities ? (
              <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/50 lg:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">University Recommendations</h3>
                    <p className="text-sm font-bold text-slate-400">Suggest the best institutions for this student</p>
                  </div>
                  {workspace.can_edit && (
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95",
                        showUniForm ? "bg-slate-100 text-slate-500" : "bg-primary text-white shadow-lg shadow-primary/20"
                      )}
                      onClick={() => {
                        setEditingUniversityId(null);
                        setUniForm(defaultUniversityForm());
                        setShowUniForm((value) => !value);
                      }}
                    >
                      <i className={cn("fa-solid", showUniForm ? "fa-xmark" : "fa-plus")} />
                    </button>
                  )}
                </div>

                {showUniForm && (
                  <form className="mb-10 grid gap-4 rounded-3xl bg-slate-50 p-6 animate-in fade-in zoom-in-95" onSubmit={handleUniversitySubmit}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["university_name", "University Name"],
                        ["course_name", "Course / Program"],
                        ["country", "Country"],
                        ["program_level", "Program Level"],
                        ["intake", "Intake"],
                        ["duration", "Duration"],
                        ["application_deadline", "Application Deadline"],
                        ["currency", "Currency (ISO)"],
                        ["fit_category", "Fit: Reach / Target / Safe"],
                        ["fit_score", "Fit Score / 5"],
                        ["official_program_url", "Official Program URL"],
                        ["tuition_fees", "Tuition Fees"],
                        ["living_expenses", "Living Expenses"],
                        ["total_estimated_budget", "Total Budget"],
                        ["ielts", "IELTS"],
                      ].map(([field, label]) => (
                        <div key={field} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
                          <input
                            className="h-11 rounded-xl border-slate-200 bg-white px-4 text-xs font-bold text-slate-700"
                            type={field === "application_deadline" ? "date" : field === "official_program_url" ? "url" : field === "fit_score" ? "number" : "text"}
                            min={field === "fit_score" ? 1 : undefined}
                            max={field === "fit_score" ? 5 : undefined}
                            value={String((uniForm as Record<string, unknown>)[field] ?? "")}
                            onChange={handleUniField(field as keyof RecommendedUniversity)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="submit" className="flex h-11 items-center gap-2 rounded-xl bg-primary px-8 text-xs font-black text-white shadow-lg shadow-primary/20" disabled={submitting}>
                        {submitting ? "Saving..." : editingUniversityId ? "Update Entry" : "Add to List"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {workspace.recommended_universities.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-sm font-bold text-slate-400 italic">No recommendations added yet.</div>
                  ) : (
                    workspace.recommended_universities.map((item) => (
                      <div key={item.id} className="flex flex-col gap-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 leading-tight truncate">{item.university_name}</h4>
                            <p className="text-[11px] font-bold text-primary truncate">{item.course_name}</p>
                          </div>
                          {workspace.can_edit && (
                            <div className="flex gap-2">
                              <button onClick={() => handleUniversityEdit(item)} className="text-blue-500 hover:text-blue-700"><i className="fa-solid fa-pen-to-square text-xs" /></button>
                              <button onClick={() => void handleUniversityDelete(item.id)} className="text-rose-500 hover:text-rose-700"><i className="fa-solid fa-trash-can text-xs" /></button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Budget</p>
                            <p className="text-[11px] font-bold text-slate-700 truncate">{item.total_estimated_budget || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-tighter text-slate-400">IELTS</p>
                            <p className="text-[11px] font-bold text-slate-700 truncate">{item.ielts || "—"}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>

  );
}
