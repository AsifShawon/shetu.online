"use client";

import { useEffect, useState } from "react";

import { getAgencyServices, createAgencyService, deleteAgencyService, type AgencyService } from "@/lib/api/agencies";

export function AgencyServices() {
  const [services, setServices] = useState<AgencyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const load = () => {
    getAgencyServices()
      .then(setServices)
      .catch(() => null)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      await createAgencyService(fd);
      setShowForm(false);
      setForm({ title: "", description: "" });
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div><h2>Agency Services</h2><p>Services published by your agency.</p></div>
        <button type="button" className="legacy-primary-btn text-sm px-4 py-2" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add Service"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-bold">Title</label>
              <input className="legacy-form-field" required placeholder="Service title" value={form.title} onChange={set("title")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">Description</label>
              <input className="legacy-form-field" placeholder="Short description" value={form.description} onChange={set("description")} />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="legacy-primary-btn" disabled={submitting}>{submitting ? "Saving…" : "Save"}</button>
              <button type="button" className="legacy-outline-btn" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="legacy-dashboard-table-wrap">
        {loading ? (
          <p className="p-6 text-center text-[var(--legacy-muted)]">Loading…</p>
        ) : (
          <table className="legacy-dashboard-table">
            <thead>
              <tr><th>#</th><th>Title</th><th>Description</th><th>Active</th><th>Action</th></tr>
            </thead>
            <tbody>
              {services.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[var(--legacy-muted)]">No services yet.</td></tr>}
              {services.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.title}</td>
                  <td className="max-w-xs truncate">{s.description}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline"
                      onClick={async () => { if (window.confirm("Delete?")) { await deleteAgencyService(s.id); load(); } }}
                    >
                      Delete
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
