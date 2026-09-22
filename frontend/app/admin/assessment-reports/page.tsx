"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { useToast } from "@/components/layout/toast-provider";
import {
  getAdminResource,
  postAdminAction,
  type AdminRecord,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";

const RESOURCE_PATH = "/api/admin/assessment-reports/";

export default function AdminAssessmentReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setReports(await getAdminResource(RESOURCE_PATH));
    } catch (error) {
      showToast({
        variant: "error",
        title: "Reports load failed",
        message: getApiErrorMessage(error, "Unable to load assessment reports."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      const payload =
        action === "reject"
          ? { rejection_reason: window.prompt("Enter rejection reason") || "" }
          : undefined;
      await postAdminAction(RESOURCE_PATH, id, action, payload);
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
      setBusyId(null);
    }
  };

  return (
    <AdminShell
      section="verification"
      resourceKey="assessment-reports"
      title="Assessment Reports"
      description="Approve or reject consultant assessment reports before students can finalize them."
    >
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-medium text-slate-900">Assessment report queue</h2>
          <p className="mt-1 text-sm text-slate-500">This page covers the admin approval gate in the new assessment workflow.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-white text-slate-900">
              <tr>
                <th className="px-4 py-4 font-semibold">Assessment</th>
                <th className="px-4 py-4 font-semibold">Student</th>
                <th className="px-4 py-4 font-semibold">Consultant</th>
                <th className="px-4 py-4 font-semibold">Modules</th>
                <th className="px-4 py-4 font-semibold">Preview</th>
                <th className="px-4 py-4 font-semibold">Submission</th>
                <th className="px-4 py-4 font-semibold">Approval</th>
                <th className="px-4 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading reports...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">No reports are waiting in the queue.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={String(report.id)} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-4 text-slate-700">
                      <p className="font-semibold text-slate-900">{String(report.assessment_title ?? report.assessment_id ?? "-")}</p>
                      <p className="mt-1 text-xs text-slate-500">#{String(report.assessment_id ?? "-")}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{String(report.student_name ?? report.student_id ?? "-")}</td>
                    <td className="px-4 py-4 text-slate-700">{String(report.consultant_name ?? report.consultant_id ?? "-")}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {Array.isArray(report.module_keys) && report.module_keys.length > 0
                        ? report.module_keys.map((item) => String(item).replaceAll("_", " ")).join(", ")
                        : "-"}
                    </td>
                    <td className="px-4 py-4 text-xs leading-6 text-slate-600">
                      {String(report.content_preview ?? "No preview available.")}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{String(report.submission_status ?? "-").replaceAll("_", " ")}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {String(report.admin_approval_status ?? "pending").replaceAll("_", " ")}
                      </span>
                      {report.rejection_reason ? (
                        <p className="mt-2 max-w-sm text-xs text-rose-600">{String(report.rejection_reason)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/assessment-reports/${String(report.id)}` as Route}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-600"
                          disabled={busyId === Number(report.id)}
                          onClick={() => handleAction(Number(report.id), "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-500 px-3 py-2 text-xs font-semibold text-rose-600"
                          disabled={busyId === Number(report.id)}
                          onClick={() => handleAction(Number(report.id), "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
