"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  OrganizationCombobox,
  PassingYearCombobox,
  DurationCombobox,
  EducationUploadDropzone,
} from "@/components/form/education-fields";

import {
  createPersonalTraining,
  deletePersonalTraining,
  getPersonalTrainings,
  updatePersonalTraining,
  type PersonalTraining,
} from "@/lib/api/consultants";

function toFormData(values: Record<string, string | File | null | undefined>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    data.append(key, value);
  });
  return data;
}

export function ConsultantPersonalTrainingManager() {
  const { showToast } = useToast();
  const [trainings, setTrainings] = useState<PersonalTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    year: "",
    duration: "",
    result_or_award: "",
    document: null as File | null,
  });

  const setRawValue = (field: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };


  const load = async () => {
    setLoading(true);
    try {
      setTrainings(await getPersonalTrainings());
    } catch (error) {
      showToast({
        variant: "error",
        title: "Personal training load failed",
        message: getApiErrorMessage(error, "Unable to load personal training records."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditId(null);
    setForm({ title: "", organization: "", year: "", duration: "", result_or_award: "", document: null });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = toFormData(form);
      if (editId) {
        await updatePersonalTraining(editId, data);
      } else {
        await createPersonalTraining(data);
      }
      reset();
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Personal training save failed",
        message: getApiErrorMessage(error, "Unable to save this personal training record."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this personal training record?")) {
      return;
    }
    setSaving(true);
    try {
      await deletePersonalTraining(id);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this personal training."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Personal training records</h3>
          <p className="mt-1 text-sm text-slate-500">This is the consultant-specific training history missing from the initial V3 dashboard.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{trainings.length}</span>
      </div>

      <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Training Title <span className="text-rose-500">*</span></label>
          <input
            className="sd-field"
            placeholder="e.g. Certified Scrum Master"
            value={form.title}
            onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
            required
            disabled={saving}
          />
        </div>
        <OrganizationCombobox
          label="Organization"
          placeholder="Select or type provider"
          value={form.organization}
          required
          disabled={saving}
          onChange={setRawValue("organization")}
        />
        <PassingYearCombobox
          label="Year"
          placeholder="Select or type completion year"
          value={form.year}
          required
          disabled={saving}
          onChange={setRawValue("year")}
        />
        <DurationCombobox
          label="Duration"
          placeholder="Select or type duration"
          value={form.duration}
          disabled={saving}
          onChange={setRawValue("duration")}
        />
        <div className="lg:col-span-2 flex flex-col gap-1.5 w-full">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Result or Award</label>
          <input
            className="sd-field"
            placeholder="e.g. Grade A / Pass"
            value={form.result_or_award}
            onChange={(e) => setForm((c) => ({ ...c, result_or_award: e.target.value }))}
            disabled={saving}
          />
        </div>
        <div className="lg:col-span-2">
          <EducationUploadDropzone
            label="Certificate / Document"
            selectedFileName={form.document ? (form.document as File).name : (editId ? "Current file attached" : "No file selected")}
            disabled={saving}
            onChange={(file) => setForm((c) => ({ ...c, document: file }))}
          />
        </div>
        <div className="lg:col-span-2 flex gap-3 mt-2">
          <button type="submit" className="sd-btn-primary h-11 px-6 font-bold" disabled={saving}>
            {saving ? "Saving..." : editId ? "Update record" : "Add record"}
          </button>
          {editId ? (
            <button type="button" className="sd-btn-outline h-11 px-6 font-bold" onClick={reset}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading personal trainings...</p> : trainings.map((item) => (
          <article key={item.id} className="rounded-[22px] border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-black text-slate-900">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{item.organization} · {item.year}</p>
                <p className="mt-2 text-sm text-slate-500">{item.result_or_award || "No award"}{item.duration ? ` · ${item.duration}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" onClick={() => {
                  setEditId(item.id);
                  setForm({
                    title: item.title,
                    organization: item.organization ?? "",
                    year: item.year ?? "",
                    duration: item.duration ?? "",
                    result_or_award: item.result_or_award ?? "",
                    document: null,
                  });
                }}>Edit</button>
                <button type="button" className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
