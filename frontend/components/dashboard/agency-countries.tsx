"use client";

import { useEffect, useState } from "react";

import { getAgencyCountries, createAgencyCountry, deleteAgencyCountry, type AgencyCountryOffering } from "@/lib/api/agencies";
import { getCountries } from "@/lib/api/catalog";

export function AgencyCountries() {
  const [offerings, setOfferings] = useState<AgencyCountryOffering[]>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ country_id: "", title: "", description: "" });

  const load = () => {
    Promise.all([getAgencyCountries(), getCountries()])
      .then(([off, co]) => {
        setOfferings(off);
        setCountries(co.filter((c) => c.status === "active"));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("country_id", form.country_id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      await createAgencyCountry(fd);
      setShowForm(false);
      setForm({ country_id: "", title: "", description: "" });
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div><h2>Country Offerings</h2><p>Countries your agency provides services for.</p></div>
        <button type="button" className="legacy-primary-btn text-sm px-4 py-2" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Add Country"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-bold">Country</label>
              <select className="legacy-form-field" required value={form.country_id} onChange={set("country_id")}>
                <option value="">-- Select Country --</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">Title</label>
              <input className="legacy-form-field" required placeholder="e.g. Study in UK" value={form.title} onChange={set("title")} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold">Description</label>
              <textarea className="legacy-form-field" rows={2} placeholder="Brief description" value={form.description} onChange={set("description")} />
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
              <tr><th>#</th><th>Country</th><th>Title</th><th>Active</th><th>Action</th></tr>
            </thead>
            <tbody>
              {offerings.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[var(--legacy-muted)]">No country offerings yet.</td></tr>}
              {offerings.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td>{o.country_name ?? o.country_id}</td>
                  <td>{o.title}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {o.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline"
                      onClick={async () => { if (window.confirm("Delete?")) { await deleteAgencyCountry(o.id); load(); } }}
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
