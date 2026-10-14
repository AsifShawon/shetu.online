"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getAgencyConsultants,
  addAgencyConsultant,
  removeAgencyConsultant,
  type AgencyConsultant,
} from "@/lib/api/agencies";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";

export function AgencyConsultants() {
  const { showToast } = useToast();

  const [consultants, setConsultants] = useState<AgencyConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [consultantId, setConsultantId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await getAgencyConsultants();
      setConsultants(data);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not load consultants",
        message: getApiErrorMessage(error, "Failed to load agency consultants."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = Number(consultantId.trim());
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      showToast({
        variant: "warning",
        title: "Invalid ID",
        message: "Please enter a valid numeric consultant user ID.",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addAgencyConsultant({ consultant_id: parsedId });
      showToast({
        variant: "success",
        title: "Consultant added",
        message: "Consultant successfully linked to your agency.",
      });
      setConsultantId("");
      setShowForm(false);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not add consultant",
        message: getApiErrorMessage(error, "Check the consultant ID and ensure your agency profile is created."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!deletingId) return;
    try {
      await removeAgencyConsultant(deletingId);
      showToast({
        variant: "success",
        title: "Consultant removed",
        message: "Consultant removed from your agency team.",
      });
      setDeletingId(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Remove failed",
        message: getApiErrorMessage(error, "Could not remove this consultant."),
      });
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Agency Consultants</h2>
          <p>Consultants registered under your agency.</p>
        </div>
        <button
          type="button"
          className="legacy-primary-btn px-4 py-2 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Consultant"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          <form className="flex items-end gap-3" onSubmit={handleAdd}>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Consultant User ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                className="legacy-form-field"
                placeholder="Enter consultant user ID"
                value={consultantId}
                onChange={(e) => setConsultantId(e.target.value)}
              />
            </div>
            <button type="submit" className="legacy-primary-btn" disabled={submitting}>
              {submitting ? "Adding…" : "Add"}
            </button>
          </form>
        </div>
      )}

      <div className="legacy-dashboard-table-wrap">
        {loading ? (
          <p className="p-6 text-center text-[var(--legacy-muted)]">Loading…</p>
        ) : (
          <table className="legacy-dashboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {consultants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--legacy-muted)]">
                    No consultants added yet.
                  </td>
                </tr>
              )}
              {consultants.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td className="font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      {c.consultant_image ? (
                        <img
                          src={getMediaUrl(c.consultant_image) ?? c.consultant_image}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : null}
                      <span>{c.consultant_name ?? "—"}</span>
                    </div>
                  </td>
                  <td>{c.consultant_email ?? "—"}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        c.verification_status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {c.verification_status ?? "pending"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline hover:text-red-700"
                      onClick={() => setDeletingId(c.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={deletingId !== null}
        title="Remove Consultant"
        message="Are you sure you want to remove this consultant from your agency? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
        onConfirm={handleRemove}
        onClose={() => setDeletingId(null)}
      />
    </section>
  );
}
