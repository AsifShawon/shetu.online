"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getAgencyServices,
  createAgencyService,
  deleteAgencyService,
  type AgencyService,
} from "@/lib/api/agencies";
import { getServices, type ServiceCategory } from "@/lib/api/catalog";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";

export function AgencyServices() {
  const { showToast } = useToast();

  const [services, setServices] = useState<AgencyService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    service_category_id: "",
    title: "",
    description: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const [serviceList, categoryList] = await Promise.all([
        getAgencyServices(),
        getServices(),
      ]);
      setServices(serviceList);
      setCategories(categoryList.filter((cat) => cat.status === "active"));
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not load services",
        message: getApiErrorMessage(error, "Failed to load agency services."),
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
    if (!form.service_category_id) {
      showToast({
        variant: "warning",
        title: "Category required",
        message: "Please select a service category.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("service_category_id", form.service_category_id);
      fd.append("title", form.title);
      fd.append("description", form.description);
      if (imageFile) {
        fd.append("image", imageFile);
      }

      await createAgencyService(fd);
      showToast({
        variant: "success",
        title: "Service created",
        message: "Agency service published successfully.",
      });
      setShowForm(false);
      setForm({ service_category_id: "", title: "", description: "" });
      setImageFile(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Could not create service",
        message: getApiErrorMessage(error, "Failed to create agency service."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteAgencyService(deletingId);
      showToast({
        variant: "success",
        title: "Service deleted",
        message: "Agency service deleted successfully.",
      });
      setDeletingId(null);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Could not delete this agency service."),
      });
    }
  };

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Agency Services</h2>
          <p>Services published by your agency.</p>
        </div>
        <button
          type="button"
          className="legacy-primary-btn px-4 py-2 text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "Add Service"}
        </button>
      </div>

      {showForm && (
        <div className="border-t border-slate-100 p-6">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Service Category <span className="text-red-500">*</span>
              </label>
              <select
                className="legacy-form-field"
                required
                value={form.service_category_id}
                onChange={set("service_category_id")}
              >
                <option value="">-- Select Service Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
                placeholder="Service title"
                value={form.title}
                onChange={set("title")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">Description</label>
              <textarea
                className="legacy-form-field"
                rows={3}
                placeholder="Short description"
                value={form.description}
                onChange={set("description")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-bold text-slate-700">Service Image</label>
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
                <th>Category</th>
                <th>Title</th>
                <th>Description</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--legacy-muted)]">
                    No services yet.
                  </td>
                </tr>
              )}
              {services.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>
                    <span className="font-semibold text-slate-800">
                      {s.service_name || "—"}
                    </span>
                  </td>
                  <td>{s.title}</td>
                  <td className="max-w-xs truncate">{s.description}</td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        s.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-bold text-red-500 underline hover:text-red-700"
                      onClick={() => setDeletingId(s.id)}
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
        title="Delete Service"
        message="Are you sure you want to delete this agency service? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeletingId(null)}
      />
    </section>
  );
}
