"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { useToast } from "@/components/layout/toast-provider";
import {
  getAdminResource,
  updateAdminResource,
  type AdminRecord,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";

const RESOURCE_PATH = "/api/admin/refund-requests/";

export default function AdminRefundRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<AdminRecord[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const items = await getAdminResource(RESOURCE_PATH);
      setRequests(items);
      setNotes(
        Object.fromEntries(items.map((item) => [Number(item.id), String(item.admin_notes ?? "")]))
      );
      setStatuses(
        Object.fromEntries(items.map((item) => [Number(item.id), String(item.status ?? "pending")]))
      );
    } catch (error) {
      showToast({
        variant: "error",
        title: "Refund load failed",
        message: getApiErrorMessage(error, "Unable to load refund requests."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (id: number) => {
    setBusyId(id);
    try {
      await updateAdminResource(RESOURCE_PATH, id, {
        status: statuses[id],
        admin_notes: notes[id],
      });
      showToast({
        variant: "success",
        title: "Refund updated",
        message: "The refund request was updated.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Refund update failed",
        message: getApiErrorMessage(error, "Unable to update this refund request."),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell
      section="transactions"
      resourceKey="refund-requests"
      title="Refund Requests"
      description="Review refund requests tied to assessment orders and persist the admin decision."
    >
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-medium text-slate-900">Refund review queue</h2>
          <p className="mt-1 text-sm text-slate-500">Update status and internal notes without leaving the transactions workflow.</p>
        </div>

        <div className="space-y-4 p-5">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading refund requests...</p>
          ) : requests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              No refund request has been submitted.
            </p>
          ) : (
            requests.map((request) => {
              const id = Number(request.id);
              return (
                <article key={id} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px]">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Assessment #{String(request.assessment_id)} · Order #{String(request.order_id)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{String(request.reason ?? "No reason supplied.")}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        Requested by user #{String(request.requested_by_id ?? "-")}
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</label>
                      <select
                        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                        value={statuses[id] ?? "pending"}
                        onChange={(event) => setStatuses((current) => ({ ...current, [id]: event.target.value }))}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="processed">Processed</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin notes</label>
                      <textarea
                        className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-3 text-sm"
                        value={notes[id] ?? ""}
                        onChange={(event) => setNotes((current) => ({ ...current, [id]: event.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 rounded-md bg-[#045330] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#03462A]"
                    disabled={busyId === id}
                    onClick={() => handleSave(id)}
                  >
                    {busyId === id ? "Saving..." : "Save update"}
                  </button>
                </article>
              );
            })
          )}
        </div>
      </section>
    </AdminShell>
  );
}
