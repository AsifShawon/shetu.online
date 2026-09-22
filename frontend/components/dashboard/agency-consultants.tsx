"use client";

import { useEffect, useState } from "react";

import { getAgencyConsultants, addAgencyConsultant, removeAgencyConsultant, type AgencyConsultant } from "@/lib/api/agencies";

export function AgencyConsultants() {
  const [consultants, setConsultants] = useState<AgencyConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [consultantId, setConsultantId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    getAgencyConsultants()
      .then(setConsultants)
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultantId.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await addAgencyConsultant({ consultant_id: Number(consultantId) });
      setConsultantId("");
      setShowForm(false);
      load();
    } catch {
      setError("Could not add consultant. Check the ID and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Agency Consultants</h2>
          <p>Consultants registered under your agency.</p>
        </div>
        <button type="button" className="legacy-primary-btn text-sm px-4 py-2" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add Consultant"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          {error && <p className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
          <form className="flex gap-3 items-end" onSubmit={handleAdd}>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-bold">Consultant User ID</label>
              <input className="legacy-form-field" placeholder="Enter consultant user ID" value={consultantId} onChange={(e) => setConsultantId(e.target.value)} />
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
              <tr><th>#</th><th>Name</th><th>Email</th><th>Verified</th><th>Action</th></tr>
            </thead>
            <tbody>
              {consultants.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[var(--legacy-muted)]">No consultants added yet.</td></tr>}
              {consultants.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td>{c.consultant_name ?? "—"}</td>
                  <td>{c.consultant_email ?? "—"}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.verification_status === "accepted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {c.verification_status ?? "pending"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline"
                      onClick={async () => { if (window.confirm("Remove consultant?")) { await removeAgencyConsultant(c.id); load(); } }}
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
    </section>
  );
}
