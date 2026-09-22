"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createExperience,
  deleteExperience,
  getExperiences,
  updateExperience,
  type Experience,
} from "@/lib/api/consultants";

type ExperienceFormState = {
  organization: string;
  designation: string;
  responsibilities: string;
  start_date: string;
  end_date: string;
  duration: string;
  document: File | null;
  cv_document: File | null;
};

function createBlankForm(): ExperienceFormState {
  return {
    organization: "",
    designation: "",
    responsibilities: "",
    start_date: "",
    end_date: "",
    duration: "",
    document: null,
    cv_document: null,
  };
}

export function ConsultantExperience() {
  const { showToast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ExperienceFormState>(createBlankForm());

  const load = () => {
    getExperiences()
      .then(setExperiences)
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Experience failed to load",
          message: getApiErrorMessage(error, "Unable to load consultant experience."),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(createBlankForm());
    setShowForm(true);
  };

  const openEdit = (experience: Experience) => {
    setEditId(experience.id);
    setForm({
      organization: experience.organization,
      designation: experience.designation,
      responsibilities: experience.responsibilities,
      start_date: experience.start_date ?? "",
      end_date: experience.end_date ?? "",
      duration: experience.duration,
      document: null,
      cv_document: null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append("organization", form.organization);
    data.append("designation", form.designation);
    data.append("responsibilities", form.responsibilities);
    data.append("start_date", form.start_date);
    data.append("end_date", form.end_date);
    data.append("duration", form.duration);
    if (form.document) {
      data.append("document", form.document);
    }
    if (form.cv_document) {
      data.append("cv_document", form.cv_document);
    }

    try {
      if (editId) {
        await updateExperience(editId, data);
      } else {
        await createExperience(data);
      }
      showToast({
        variant: "success",
        title: editId ? "Experience updated" : "Experience added",
        message: "Your work experience has been saved.",
      });
      setShowForm(false);
      setEditId(null);
      setForm(createBlankForm());
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Experience save failed",
        message: getApiErrorMessage(error, "Unable to save this experience record."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this work experience entry?")) {
      return;
    }

    try {
      await deleteExperience(id);
      showToast({
        variant: "success",
        title: "Experience deleted",
        message: "The selected experience entry was removed.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this experience record."),
      });
    }
  };

  return (
    <div className="sd-section-stack sd-consultant-content-stack">
      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Professional Experience</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Show the organizations and responsibilities behind your advice</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Add clear employment history, role details, and supporting documents so students can trust your expertise.
            </p>
          </div>
          <button type="button" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={openCreate}>
            Add experience
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{editId ? "Edit experience" : "Add experience"}</h3>
              <p className="mt-1 text-sm text-slate-500">Keep each entry tight, verifiable, and directly relevant to the consulting work you offer.</p>
            </div>
            <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>

          <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Organization</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                value={form.organization}
                onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value }))}
                placeholder="Company / Organization"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Designation</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                value={form.designation}
                onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))}
                placeholder="Role title"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Start date</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                type="date"
                value={form.start_date}
                onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">End date</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                type="date"
                value={form.end_date}
                onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Duration</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                value={form.duration}
                onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                placeholder="2 years 4 months"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Supporting document</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                type="file"
                onChange={(event) => setForm((current) => ({ ...current, document: event.target.files?.[0] ?? null }))}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Responsibilities</label>
              <textarea
                className="min-h-[140px] w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                value={form.responsibilities}
                onChange={(event) => setForm((current) => ({ ...current, responsibilities: event.target.value }))}
                placeholder="Describe what you did and how it connects to student advisory work."
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resume / CV</label>
              <input
                className="w-full rounded-[22px] border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none"
                type="file"
                onChange={(event) => setForm((current) => ({ ...current, cv_document: event.target.files?.[0] ?? null }))}
              />
            </div>
            <div className="lg:col-span-2 flex flex-wrap gap-3">
              <button type="submit" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" disabled={submitting}>
                {submitting ? "Saving..." : editId ? "Update experience" : "Save experience"}
              </button>
              <button type="button" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Saved experience records</h3>
            <p className="mt-1 text-sm text-slate-500">Keep the work history that reinforces your consulting authority.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{experiences.length} records</span>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading experience...</p>
        ) : experiences.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
            No work experience has been added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Organization</th>
                  <th className="pb-3 pr-4">Designation</th>
                  <th className="pb-3 pr-4">Duration</th>
                  <th className="pb-3 pr-4">Responsibilities</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiences.map((experience) => (
                  <tr key={experience.id} className="border-t border-slate-100 align-top">
                    <td className="py-4 pr-4 font-semibold text-slate-900">{experience.organization}</td>
                    <td className="py-4 pr-4 text-slate-600">{experience.designation}</td>
                    <td className="py-4 pr-4 text-slate-600">{experience.duration || `${experience.start_date ?? ""} - ${experience.end_date ?? "Present"}`}</td>
                    <td className="py-4 pr-4 text-slate-600">{experience.responsibilities || "—"}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" onClick={() => openEdit(experience)}>
                          Edit
                        </button>
                        <button type="button" className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600" onClick={() => handleDelete(experience.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
