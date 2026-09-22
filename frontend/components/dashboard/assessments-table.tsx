"use client";

import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { cn } from "@/lib/utils";
import { acceptAssessment, getAssessments, rejectAssessment, type Assessment } from "@/lib/api/assessments";
import { formatDurationDays } from "@/lib/formatters";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "sd-status sd-status--yellow" },
  proposal_pending: { label: "Proposal Waiting", cls: "sd-status sd-status--purple" },
  accepted: { label: "Accepted", cls: "sd-status sd-status--blue" },
  submitted: { label: "Submitted", cls: "sd-status sd-status--purple" },
  approved: { label: "Approved", cls: "sd-status sd-status--green" },
  revision_requested: { label: "Revision Requested", cls: "sd-status sd-status--yellow" },
  completed: { label: "Completed", cls: "sd-status sd-status--green" },
  rejected: { label: "Rejected", cls: "sd-status sd-status--red" },
};

export function AssessmentsTable({ viewAs }: { viewAs: "student" | "consultant" }) {
  const { t } = useLang();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const load = () => {
    getAssessments()
      .then(setAssessments)
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAccept = async (id: number) => {
    await acceptAssessment(id);
    load();
  };

  const handleReject = async (id: number) => {
    await rejectAssessment(id);
    load();
  };

  const normalizedQuery = deferredSearch.trim().toLowerCase();
  const filtered = assessments.filter((assessment) => {
    const matchesFilter = filter === "all" ? true : assessment.status === filter;
    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    return [
      assessment.consultant_name,
      assessment.student_name,
      assessment.service_title,
      assessment.country_name,
      assessment.preferred_subject,
      assessment.preferred_institute,
      assessment.assessment_title,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  if (viewAs === "student") {
    const studentRows = filtered.map((assessment) => ({
      id: assessment.id,
      consultantName: assessment.consultant_name ?? "Consultant",
      serviceTitle: assessment.service_title ?? "Assessment Service",
      countryName: assessment.country_name ?? "Germany",
      subjectName: assessment.preferred_subject ?? "Computer Science",
      instituteName: assessment.preferred_institute ?? "IBM",
      charge: assessment.assessment_charge ? `${assessment.assessment_charge} BDT` : "1000.00 BDT",
      duration: formatDurationDays(assessment.assessment_duration),
      status: STATUS_LABEL[assessment.status] ?? { label: assessment.status, cls: "sd-status sd-status--yellow" },
    }));

    return (
      <div className="sd-section-stack">
        <div className="sd-student-page-heading">
          <h1>{t("service_page_title")}</h1>
          <div className="sd-student-page-tools">
            <label className="sd-student-search">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
              />
              <i className="fa-solid fa-magnifying-glass" />
            </label>

            <div className="sd-student-select-wrap">
              <select value={filter} onChange={(event) => setFilter(event.target.value)} className="sd-student-select">
                <option value="all">All</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="revision_requested">Revision Requested</option>
                <option value="proposal_pending">Proposal Waiting</option>
              </select>
              <i className="fa-solid fa-chevron-down" />
            </div>
          </div>
        </div>

        <div className="sd-student-request-board">
          <div className="sd-student-request-head">
            <span>All Services</span>
            <span>Service Charge</span>
            <span>Duration</span>
            <span>Status</span>
            <span>Assessment</span>
          </div>

          {loading ? (
            <p className="sd-loading">Loading...</p>
          ) : studentRows.length === 0 ? (
            <p className="sd-empty-inline">No service requests found.</p>
          ) : (
            studentRows.map((assessment) => (
              <div className="sd-student-request-row" key={assessment.id}>
                <div className="sd-student-request-service">
                  <img src="/legacy/no-profile-img.png" alt={assessment.consultantName} />
                  <div className="sd-student-request-copy">
                    <strong>{assessment.consultantName}</strong>
                    <Link href={`/dashboard/student/assessments/${assessment.id}` as Route}>
                      {assessment.serviceTitle}
                    </Link>
                    <div className="sd-student-request-meta">
                      <span>
                        <i className="fa-solid fa-earth-americas" />
                        {assessment.countryName}
                      </span>
                      <span>
                        <i className="fa-solid fa-book-open" />
                        {assessment.subjectName}
                      </span>
                      <span>
                        <i className="fa-solid fa-building-columns" />
                        {assessment.instituteName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sd-student-request-value">{assessment.charge}</div>
                <div className="sd-student-request-value">{assessment.duration}</div>
                <div>
                  <span className={`${assessment.status.cls} sd-student-request-status`}>{assessment.status.label}</span>
                </div>
                <div className="sd-student-request-action">
                  <Link href={`/dashboard/student/assessments/${assessment.id}` as Route} className="sd-student-request-action-btn">
                    <i className="fa-solid fa-circle-arrow-down" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Link href="/dashboard/consultant" className="hover:text-primary transition-colors">{t("dash_dashboard")}</Link>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Service Requests</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">Service Requests</h2>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="Search requests..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select 
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 sm:w-56" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t("service_filter_all")}</option>
            <option value="pending">Pending</option>
            <option value="proposal_pending">Proposal Waiting</option>
            <option value="accepted">Accepted</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <p className="text-sm font-bold text-slate-500">Loading requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] bg-white p-12 text-center shadow-xl shadow-slate-200/50">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
              <i className="fa-solid fa-file-circle-question text-5xl" />
            </div>
            <h3 className="text-xl font-black text-slate-900">{t("service_no_data")}</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs">{t("service_no_data_help")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((assessment) => {
              const status = STATUS_LABEL[assessment.status] ?? { label: assessment.status, cls: "bg-slate-100 text-slate-500" };
              return (
                <div 
                  key={assessment.id} 
                  className="group relative flex flex-col gap-4 rounded-[2.5rem] bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                        <img src="/legacy/no-profile-img.png" alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">
                          {assessment.student_name ?? "Student Request"}
                        </h4>
                        <p className="mt-1 text-sm font-bold text-primary truncate">
                          {assessment.service_title || "Academic Assessment"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <i className="fa-solid fa-earth-americas" />
                            {assessment.country_name || "—"}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                            <i className="fa-solid fa-book-open" />
                            {assessment.preferred_subject || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 sm:text-right">
                      <span className={cn(
                        "inline-flex h-7 items-center rounded-full px-4 text-[10px] font-black uppercase tracking-widest border",
                        status.cls === "sd-status sd-status--green" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        status.cls === "sd-status sd-status--red" ? "bg-rose-50 text-rose-600 border-rose-100" :
                        status.cls === "sd-status sd-status--yellow" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {status.label}
                      </span>
                      {assessment.assessment_charge && (
                        <p className="text-lg font-black text-slate-900 leading-none">৳ {assessment.assessment_charge}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-3xl bg-slate-50/50 p-4 sm:grid-cols-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Institute</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{assessment.preferred_institute || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Budget</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{assessment.student_budget || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Duration</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{formatDurationDays(assessment.assessment_duration)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Date</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {assessment.status === "pending" && (
                      <>
                        <button 
                          type="button" 
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" 
                          onClick={() => handleAccept(assessment.id)}
                        >
                          <i className="fa-solid fa-check" />
                          {t("service_accept")}
                        </button>
                        <button 
                          type="button" 
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100" 
                          onClick={() => handleReject(assessment.id)}
                        >
                          <i className="fa-solid fa-xmark" />
                          {t("service_reject")}
                        </button>
                      </>
                    )}
                    {assessment.status !== "pending" && assessment.status !== "rejected" && (
                      <Link
                        href={`/dashboard/consultant/reports?assessment=${assessment.id}` as Route}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                      >
                        <i className="fa-solid fa-rocket" />
                        {assessment.status === "accepted" || assessment.status === "revision_requested"
                          ? "Open Report Workspace"
                          : "View Report"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

  );
}
