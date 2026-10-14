"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getAgencyCountries,
  createAgencyCountry,
  deleteAgencyCountry,
  type AgencyCountryOffering,
} from "@/lib/api/agencies";
import { getCountries } from "@/lib/api/catalog";
import { getApiErrorMessage } from "@/lib/api/client";

export function AgencyCountries() {
  const { showToast } = useToast();

  const [offerings, setOfferings] = useState<AgencyCountryOffering[]>([]);
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({ country_id: "", title: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const [off, co] = await Promise.all([getAgencyCountries(), getCountries()]);
      setOfferings(off);
      setCountries(co.filter((c) => c.status === "active"));
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not load countries",
        message: getApiErrorMessage(error, "Failed to load agency country offerings."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.country_id) {
      showToast({
        variant: "warning",
        title: "Country required",
        message: "Please choose a country from the catalog.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("country_id", form.country_id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      if (imageFile) {
        fd.append("image", imageFile);
      }

      await createAgencyCountry(fd);
      showToast({
        variant: "success",
        title: "Country offering added",
        message: "Agency country offering published successfully.",
      });
      setShowForm(false);
      setForm({ country_id: "", title: "", description: "" });
      setImageFile(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Save failed",
        message: getApiErrorMessage(error, "Could not add this country offering."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAgencyCountry(deletingId);
      showToast({
        variant: "success",
        title: "Country offering removed",
        message: "Agency country offering removed successfully.",
      });
      setDeletingId(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Failed to remove this country offering."),
      });
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Country Offerings</h2>
          <p>Countries your agency provides services for.</p>
        </div>
        <button
          type="button"
          className="legacy-primary-btn px-4 py-2 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Country"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                className="legacy-form-field"
                required
                value={form.country_id}
                onChange={set("country_id")}
              >
                <option value="">-- Select Country --</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                className="legacy-form-field"
                required
                placeholder="e.g. Study in UK"
                value={form.title}
                onChange={set("title")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">Description</label>
              <textarea
                className="legacy-form-field"
                rows={2}
                placeholder="Brief description"
                value={form.description}
                onChange={set("description")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="legacy-primary-btn" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="legacy-outline-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
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
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Title</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {offerings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--legacy-muted)]">
                    No country offerings yet.
                  </td>
                </tr>
              )}
              {offerings.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td className="font-semibold text-slate-800">
                    {o.country_name ?? o.country_id}
                  </td>
                  <td>{o.title}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        o.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {o.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline hover:text-red-700"
                      onClick={() => setDeletingId(o.id)}
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

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete Country Offering"
        message="Are you sure you want to delete this country offering? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </section>
  );
}
