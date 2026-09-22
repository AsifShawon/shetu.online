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
  GradingSystemCombobox,
  DurationCombobox,
  OrganizationCombobox,
} from "@/components/form/education-fields";

import {
  createStudentExperience,
  createStudentQualification,
  createStudentTraining,
  deleteStudentExperience,
  deleteStudentQualification,
  deleteStudentTraining,
  getStudentExperiences,
  getStudentQualifications,
  getStudentTrainings,
  updateStudentExperience,
  updateStudentQualification,
  updateStudentTraining,
  type StudentExperience,
  type StudentQualification,
  type StudentTraining,
} from "@/lib/api/students";

function appendFormData(values: Record<string, string | File | null | undefined>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    data.append(key, value);
  });
  return data;
}

export function StudentCareerManager() {
  const { showToast } = useToast();
  const [qualifications, setQualifications] = useState<StudentQualification[]>([]);
  const [experiences, setExperiences] = useState<StudentExperience[]>([]);
  const [trainings, setTrainings] = useState<StudentTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qualificationEditId, setQualificationEditId] = useState<number | null>(null);
  const [experienceEditId, setExperienceEditId] = useState<number | null>(null);
  const [trainingEditId, setTrainingEditId] = useState<number | null>(null);

  const [qualificationForm, setQualificationForm] = useState({
    level_of_education: "",
    degree_title: "",
    institution: "",
    board_or_university: "",
    department: "",
    passing_year: "",
    result: "",
    grading_system: "",
    duration: "",
    document: null as File | null,
  });
  const [experienceForm, setExperienceForm] = useState({
    organization: "",
    designation: "",
    responsibilities: "",
    start_date: "",
    end_date: "",
    duration: "",
    cv_document: null as File | null,
    cover_letter: null as File | null,
    experience_certificate: null as File | null,
  });
  const [trainingForm, setTrainingForm] = useState({
    title: "",
    organization: "",
    year: "",
    duration: "",
    result_or_award: "",
    document: null as File | null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [qualificationData, experienceData, trainingData] = await Promise.all([
        getStudentQualifications(),
        getStudentExperiences(),
        getStudentTrainings(),
      ]);
      setQualifications(qualificationData);
      setExperiences(experienceData);
      setTrainings(trainingData);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Profile records failed to load",
        message: getApiErrorMessage(error, "Unable to load qualification, experience, and training records."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetQualification = () => {
    setQualificationEditId(null);
    setQualificationForm({
      level_of_education: "",
      degree_title: "",
      institution: "",
      board_or_university: "",
      department: "",
      passing_year: "",
      result: "",
      grading_system: "",
      duration: "",
      document: null,
    });
  };

  const resetExperience = () => {
    setExperienceEditId(null);
    setExperienceForm({
      organization: "",
      designation: "",
      responsibilities: "",
      start_date: "",
      end_date: "",
      duration: "",
      cv_document: null,
      cover_letter: null,
      experience_certificate: null,
    });
  };

  const resetTraining = () => {
    setTrainingEditId(null);
    setTrainingForm({ title: "", organization: "", year: "", duration: "", result_or_award: "", document: null });
  };

  const saveQualification = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = appendFormData(qualificationForm);
      if (qualificationEditId) {
        await updateStudentQualification(qualificationEditId, data);
      } else {
        await createStudentQualification(data);
      }
      resetQualification();
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Qualification save failed",
        message: getApiErrorMessage(error, "Unable to save this qualification."),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveExperience = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = appendFormData(experienceForm);
      if (experienceEditId) {
        await updateStudentExperience(experienceEditId, data);
      } else {
        await createStudentExperience(data);
      }
      resetExperience();
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Experience save failed",
        message: getApiErrorMessage(error, "Unable to save this experience."),
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTraining = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = appendFormData(trainingForm);
      if (trainingEditId) {
        await updateStudentTraining(trainingEditId, data);
      } else {
        await createStudentTraining(data);
      }
      resetTraining();
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Training save failed",
        message: getApiErrorMessage(error, "Unable to save this training record."),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (kind: "qualification" | "experience" | "training", id: number) => {
    if (!window.confirm("Delete this record?")) {
      return;
    }

    setSaving(true);
    try {
      if (kind === "qualification") await deleteStudentQualification(id);
      if (kind === "experience") await deleteStudentExperience(id);
      if (kind === "training") await deleteStudentTraining(id);
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this record."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
        Add the structured qualification, experience, and training records that were missing from the initial V3 student profile flow.
      </div>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900">Qualifications</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">Academic history beyond the Bangladesh-specific last-education form.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{qualifications.length}</span>
        </div>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={saveQualification}>
          <StudyLevelSelect
            value={qualificationForm.level_of_education}
            required
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, level_of_education: val }))}
          />
          <EducationTitleCombobox
            label="Degree Title"
            placeholder="Select or type degree title"
            value={qualificationForm.degree_title}
            required
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, degree_title: val }))}
          />
          <InstitutionCombobox
            label="Institution"
            placeholder="Select or type institution"
            value={qualificationForm.institution}
            required
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, institution: val }))}
          />
          <InstitutionCombobox
            label="Board or University"
            placeholder="Select or type board/university"
            value={qualificationForm.board_or_university}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, board_or_university: val }))}
          />
          <DepartmentCombobox
            label="Department"
            placeholder="Select or type department"
            value={qualificationForm.department}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, department: val }))}
          />
          <PassingYearCombobox
            label="Passing Year"
            placeholder="Select or type passing year"
            value={qualificationForm.passing_year}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, passing_year: val }))}
          />
          <ResultInput
            value={qualificationForm.result}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, result: val }))}
          />
          <GradingSystemCombobox
            label="Grading System"
            placeholder="Select or type grading system"
            value={qualificationForm.grading_system}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, grading_system: val }))}
          />
          <DurationCombobox
            label="Duration"
            placeholder="Select or type duration"
            value={qualificationForm.duration}
            disabled={saving}
            onChange={(val) => setQualificationForm((c) => ({ ...c, duration: val }))}
          />
          <div className="lg:col-span-2">
            <EducationUploadDropzone
              label="Certificate or Document"
              selectedFileName={qualificationForm.document ? qualificationForm.document.name : "No file selected"}
              disabled={saving}
              onChange={(file) => setQualificationForm((c) => ({ ...c, document: file }))}
            />
          </div>
          <div className="lg:col-span-2 flex gap-3">
            <button type="submit" className="sd-btn-primary" disabled={saving}>{saving ? "Saving..." : qualificationEditId ? "Update qualification" : "Add qualification"}</button>
            {qualificationEditId ? <button type="button" className="sd-btn-outline" onClick={resetQualification}>Cancel</button> : null}
          </div>
        </form>

        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading qualifications...</p> : qualifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.degree_title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.institution}{item.department ? `, ${item.department}` : ""}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.level_of_education} · {item.result || "No result"} · {item.duration || "No duration"}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-bold text-sky-700 underline" onClick={() => {
                    setQualificationEditId(item.id);
                    setQualificationForm({
                      level_of_education: item.level_of_education,
                      degree_title: item.degree_title,
                      institution: item.institution,
                      board_or_university: item.board_or_university ?? "",
                      department: item.department ?? "",
                      passing_year: item.passing_year ?? "",
                      result: item.result ?? "",
                      grading_system: item.grading_system ?? "",
                      duration: item.duration ?? "",
                      document: null,
                    });
                  }}>Edit</button>
                  <button type="button" className="text-xs font-bold text-rose-600 underline" onClick={() => removeRecord("qualification", item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900">Experience</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">Work, volunteer, or relevant activity records used by consultant assessment context.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{experiences.length}</span>
        </div>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={saveExperience}>
          <OrganizationCombobox
            label="Organization"
            placeholder="Select or type organization name"
            value={experienceForm.organization}
            required
            disabled={saving}
            onChange={(val) => setExperienceForm((c) => ({ ...c, organization: val }))}
          />
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Designation <span className="text-rose-500">*</span></label>
            <input
              className="sd-field"
              placeholder="e.g. Software Engineer"
              value={experienceForm.designation}
              required
              disabled={saving}
              onChange={(e) => setExperienceForm((c) => ({ ...c, designation: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Start Date</label>
            <input
              type="date"
              className="sd-field"
              value={experienceForm.start_date}
              disabled={saving}
              onChange={(e) => setExperienceForm((c) => ({ ...c, start_date: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">End Date</label>
            <input
              type="date"
              className="sd-field"
              value={experienceForm.end_date}
              disabled={saving}
              onChange={(e) => setExperienceForm((c) => ({ ...c, end_date: e.target.value }))}
            />
          </div>
          <DurationCombobox
            label="Duration"
            placeholder="Select or type duration"
            value={experienceForm.duration}
            disabled={saving}
            onChange={(val) => setExperienceForm((c) => ({ ...c, duration: val }))}
          />
          <div className="lg:col-span-2 flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Responsibilities</label>
            <textarea
              className="sd-field min-h-[120px]"
              placeholder="Detail your responsibilities and achievements..."
              value={experienceForm.responsibilities}
              disabled={saving}
              onChange={(e) => setExperienceForm((c) => ({ ...c, responsibilities: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-2 grid gap-5 md:grid-cols-3">
            <EducationUploadDropzone
              label="CV Document"
              selectedFileName={experienceForm.cv_document ? (experienceForm.cv_document as File).name : "No file selected"}
              disabled={saving}
              onChange={(file) => setExperienceForm((c) => ({ ...c, cv_document: file }))}
            />
            <EducationUploadDropzone
              label="Cover Letter"
              selectedFileName={experienceForm.cover_letter ? (experienceForm.cover_letter as File).name : "No file selected"}
              disabled={saving}
              onChange={(file) => setExperienceForm((c) => ({ ...c, cover_letter: file }))}
            />
            <EducationUploadDropzone
              label="Experience Certificate"
              selectedFileName={experienceForm.experience_certificate ? (experienceForm.experience_certificate as File).name : "No file selected"}
              disabled={saving}
              onChange={(file) => setExperienceForm((c) => ({ ...c, experience_certificate: file }))}
            />
          </div>
          <div className="lg:col-span-2 flex gap-3">
            <button type="submit" className="sd-btn-primary" disabled={saving}>{saving ? "Saving..." : experienceEditId ? "Update experience" : "Add experience"}</button>
            {experienceEditId ? <button type="button" className="sd-btn-outline" onClick={resetExperience}>Cancel</button> : null}
          </div>
        </form>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading experiences...</p> : experiences.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.organization}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.designation}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.duration || `${item.start_date || "Start"} - ${item.end_date || "Present"}`}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-bold text-sky-700 underline" onClick={() => {
                    setExperienceEditId(item.id);
                    setExperienceForm({
                      organization: item.organization,
                      designation: item.designation,
                      responsibilities: item.responsibilities ?? "",
                      start_date: item.start_date ?? "",
                      end_date: item.end_date ?? "",
                      duration: item.duration ?? "",
                      cv_document: null,
                      cover_letter: null,
                      experience_certificate: null,
                    });
                  }}>Edit</button>
                  <button type="button" className="text-xs font-bold text-rose-600 underline" onClick={() => removeRecord("experience", item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900">Trainings</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">Short courses, certifications, and workshops relevant to your study journey.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{trainings.length}</span>
        </div>
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={saveTraining}>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Training Title <span className="text-rose-500">*</span></label>
            <input
              className="sd-field"
              placeholder="e.g. Professional Scrum Master"
              value={trainingForm.title}
              required
              disabled={saving}
              onChange={(e) => setTrainingForm((c) => ({ ...c, title: e.target.value }))}
            />
          </div>
          <OrganizationCombobox
            label="Organization"
            placeholder="Select or type training provider"
            value={trainingForm.organization}
            required
            disabled={saving}
            onChange={(val) => setTrainingForm((c) => ({ ...c, organization: val }))}
          />
          <PassingYearCombobox
            label="Year"
            placeholder="Select or type completion year"
            value={trainingForm.year}
            required
            disabled={saving}
            onChange={(val) => setTrainingForm((c) => ({ ...c, year: val }))}
          />
          <DurationCombobox
            label="Duration"
            placeholder="Select or type training duration"
            value={trainingForm.duration}
            disabled={saving}
            onChange={(val) => setTrainingForm((c) => ({ ...c, duration: val }))}
          />
          <div className="lg:col-span-2 flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 ml-1">Result or Award</label>
            <input
              className="sd-field"
              placeholder="e.g. Certified / Grade A / Distinction"
              value={trainingForm.result_or_award}
              disabled={saving}
              onChange={(e) => setTrainingForm((c) => ({ ...c, result_or_award: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-2">
            <EducationUploadDropzone
              label="Certificate or Document"
              selectedFileName={trainingForm.document ? (trainingForm.document as File).name : "No file selected"}
              disabled={saving}
              onChange={(file) => setTrainingForm((c) => ({ ...c, document: file }))}
            />
          </div>
          <div className="lg:col-span-2 flex gap-3">
            <button type="submit" className="sd-btn-primary" disabled={saving}>{saving ? "Saving..." : trainingEditId ? "Update training" : "Add training"}</button>
            {trainingEditId ? <button type="button" className="sd-btn-outline" onClick={resetTraining}>Cancel</button> : null}
          </div>
        </form>
        <div className="mt-4 space-y-3">
          {loading ? <p className="text-sm text-slate-500">Loading trainings...</p> : trainings.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.organization} · {item.year}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.result_or_award || "No award"} {item.duration ? `· ${item.duration}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs font-bold text-sky-700 underline" onClick={() => {
                    setTrainingEditId(item.id);
                    setTrainingForm({
                      title: item.title,
                      organization: item.organization ?? "",
                      year: item.year ?? "",
                      duration: item.duration ?? "",
                      result_or_award: item.result_or_award ?? "",
                      document: null,
                    });
                  }}>Edit</button>
                  <button type="button" className="text-xs font-bold text-rose-600 underline" onClick={() => removeRecord("training", item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
