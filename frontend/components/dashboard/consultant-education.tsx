"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  EducationTitleCombobox,
  DepartmentCombobox,
  InstitutionCombobox,
  StudyLevelSelect,
  ResultInput,
  EducationUploadDropzone,
  PassingYearCombobox,
  DurationCombobox,
} from "@/components/form/education-fields";


import {
  createQualification,
  deleteQualification,
  getQualifications,
  updateQualification,
  type Qualification,
} from "@/lib/api/consultants";

type EducationFormState = {
  level_of_education: string;
  degree_title: string;
  institution: string;
  department: string;
  passing_year: string;
  cgpa: string;
  duration: string;
  document: File | null;
};

function createBlankForm(): EducationFormState {
  return {
    level_of_education: "",
    degree_title: "",
    institution: "",
    department: "",
    passing_year: "",
    cgpa: "",
    duration: "",
    document: null,
  };
}

export function ConsultantEducation() {
  const { showToast } = useToast();
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<EducationFormState>(createBlankForm());

  const load = () => {
    getQualifications()
      .then(setQualifications)
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Education failed to load",
          message: getApiErrorMessage(error, "Unable to load consultant education records."),
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

  const openEdit = (qualification: Qualification) => {
    setEditId(qualification.id);
    setForm({
      level_of_education: qualification.level_of_education,
      degree_title: qualification.degree_title,
      institution: qualification.institution,
      department: qualification.department,
      passing_year: qualification.passing_year,
      cgpa: qualification.cgpa,
      duration: qualification.duration,
      document: null,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append("level_of_education", form.level_of_education);
    data.append("degree_title", form.degree_title);
    data.append("institution", form.institution);
    data.append("department", form.department);
    data.append("passing_year", form.passing_year);
    data.append("cgpa", form.cgpa);
    data.append("duration", form.duration);
    if (form.document) {
      data.append("document", form.document);
    }

    try {
      if (editId) {
        await updateQualification(editId, data);
      } else {
        await createQualification(data);
      }
      showToast({
        variant: "success",
        title: editId ? "Education updated" : "Education added",
        message: "Your educational information has been saved.",
      });
      setShowForm(false);
      setEditId(null);
      setForm(createBlankForm());
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Education save failed",
        message: getApiErrorMessage(error, "Unable to save this educational entry."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this education entry?")) {
      return;
    }

    try {
      await deleteQualification(id);
      showToast({
        variant: "success",
        title: "Education deleted",
        message: "The selected educational record was removed.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this educational record."),
      });
    }
  };

  return (
    <div className="sd-section-stack sd-consultant-content-stack">
      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Educational Qualification</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Document the degrees that support your credibility</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Keep your latest academic history visible so students and reviewers can understand the background behind your advice.
            </p>
          </div>
          <button type="button" className="sd-btn-primary h-11 px-6 font-bold" onClick={openCreate}>
            Add education
          </button>
        </div>
      </section>

      {showForm ? (
        <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{editId ? "Edit education" : "Add education"}</h3>
              <p className="mt-1 text-sm text-slate-500">Use the most relevant degree, result, duration, and institution details.</p>
            </div>
            <button type="button" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>

          <form className="grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
            <StudyLevelSelect
              value={form.level_of_education}
              required
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, level_of_education: val }))}
            />
            <EducationTitleCombobox
              label="Degree Title"
              placeholder="e.g. BSc in Computer Science"
              value={form.degree_title}
              required
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, degree_title: val }))}
            />
            <InstitutionCombobox
              label="Institution"
              placeholder="University / College"
              value={form.institution}
              required
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, institution: val }))}
            />
            <DepartmentCombobox
              label="Department"
              placeholder="Department / Major"
              value={form.department}
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, department: val }))}
            />
            <PassingYearCombobox
              label="Passing Year"
              placeholder="Select or type passing year"
              value={form.passing_year}
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, passing_year: val }))}
            />
            <ResultInput
              value={form.cgpa}
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, cgpa: val }))}
            />
            <DurationCombobox
              label="Duration"
              placeholder="Select or type duration"
              value={form.duration}
              disabled={submitting}
              onChange={(val) => setForm((current) => ({ ...current, duration: val }))}
            />
            <div className="lg:col-span-2">
              <EducationUploadDropzone
                label="Certificate / Document"
                selectedFileName={form.document ? form.document.name : (editId ? "Current file attached" : "No file selected")}
                disabled={submitting}
                onChange={(file) => setForm((current) => ({ ...current, document: file }))}
              />
            </div>
            <div className="lg:col-span-2 flex flex-wrap gap-3 mt-2">
              <button type="submit" className="sd-btn-primary h-11 px-6 font-bold" disabled={submitting}>
                {submitting ? "Saving..." : editId ? "Update education" : "Save education"}
              </button>
              <button type="button" className="sd-btn-outline h-11 px-6 font-bold" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Saved education records</h3>
            <p className="mt-1 text-sm text-slate-500">Maintain the record set that supports your professional positioning.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{qualifications.length} records</span>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading education...</p>
        ) : qualifications.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
            No educational qualification has been added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="pb-3 pr-4">Level</th>
                  <th className="pb-3 pr-4">Degree</th>
                  <th className="pb-3 pr-4">Institution</th>
                  <th className="pb-3 pr-4">Year</th>
                  <th className="pb-3 pr-4">Result</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {qualifications.map((qualification) => (
                  <tr key={qualification.id} className="border-t border-slate-100">
                    <td className="py-4 pr-4 text-slate-600">{qualification.level_of_education}</td>
                    <td className="py-4 pr-4 font-semibold text-slate-900">{qualification.degree_title}</td>
                    <td className="py-4 pr-4 text-slate-600">{qualification.institution}</td>
                    <td className="py-4 pr-4 text-slate-600">{qualification.passing_year || "—"}</td>
                    <td className="py-4 pr-4 text-slate-600">{qualification.cgpa || "—"}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600" onClick={() => openEdit(qualification)}>
                          Edit
                        </button>
                        <button type="button" className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600" onClick={() => handleDelete(qualification.id)}>
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
