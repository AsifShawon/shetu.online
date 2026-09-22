"use client";

import type { Route } from "next";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
  type StudentProfile,
} from "@/lib/api/students";

import { calculateEducationDuration } from "@/components/form/education-fields";

import {
  ModernProfileInput,
  ProfileCombobox,
  ProfileUploadCard,
  ProfileSectionCard,
  StickyProfileActionBar
} from "./profile-shared";

const STUDY_SUGGESTIONS = [
  "SSC", "HSC", "O Level", "A Level", "Diploma", "Foundation",
  "Bachelor of Science", "Bachelor of Arts", "Bachelor of Business Administration",
  "Bachelor of Engineering", "Bachelor of Computer Science", "Bachelor of Information Technology",
  "Bachelor of Commerce", "Bachelor of Pharmacy", "Bachelor of Laws", "MBBS",
  "Master of Science", "Master of Arts", "Master of Business Administration",
  "Master of Engineering", "Master of Information Technology", "Postgraduate Diploma",
  "PhD / Doctor of Philosophy"
];

const DEPT_SUGGESTIONS = [
  "Science", "Business Studies", "Humanities", "Computer Science",
  "Computer Science and Engineering", "Information Technology", "Software Engineering",
  "Electrical and Electronic Engineering", "Civil Engineering", "Mechanical Engineering",
  "Pharmacy", "Law", "Economics", "English", "Accounting", "Finance",
  "Marketing", "Management", "Mathematics", "Physics", "Chemistry", "Biology",
  "Public Health", "Nursing", "Architecture", "Data Science", "Cyber Security",
  "Artificial Intelligence"
];

function getDisplayFileName(path?: string | null, file?: File | null) {
  if (file) return file.name;
  if (!path) return null;
  const segments = path.split("/");
  return segments[segments.length - 1] || "Current file attached";
}

export function StudentLastEducationForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [infoClosed, setInfoClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [dateError, setDateError] = useState("");
  const [form, setForm] = useState({
    last_education_title: "",
    last_education_department: "",
    last_education_start: "",
    last_education_end: "",
    last_education_duration: "",
    last_education_result: "",
  });

  useEffect(() => {
    getStudentProfile()
      .then((profiles) => {
        const nextProfile = profiles[0] ?? null;
        setProfile(nextProfile);
        
        const start = nextProfile?.last_education_start ?? "";
        const end = nextProfile?.last_education_end ?? "";
        let duration = nextProfile?.last_education_duration ?? "";
        
        if (start && end) {
          if (new Date(end) >= new Date(start)) {
            duration = calculateEducationDuration(start, end);
          } else {
            setDateError("Session End cannot be before Session Start");
          }
        }

        setForm({
          last_education_title: nextProfile?.last_education_title ?? "",
          last_education_department: nextProfile?.last_education_department ?? "",
          last_education_start: start,
          last_education_end: end,
          last_education_duration: duration,
          last_education_result: nextProfile?.last_education_result ?? "",
        });
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Last education load failed",
          message: getApiErrorMessage(error, "Unable to load your last education details."),
        });
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleDateChange = (field: "last_education_start" | "last_education_end", value: string) => {
    setForm((current) => {
      const nextForm = { ...current, [field]: value };
      const start = nextForm.last_education_start;
      const end = nextForm.last_education_end;
      
      if (start && end) {
        if (new Date(end) < new Date(start)) {
          setDateError("Session End cannot be before Session Start");
          nextForm.last_education_duration = "";
        } else {
          setDateError("");
          nextForm.last_education_duration = calculateEducationDuration(start, end);
        }
      } else {
        setDateError("");
      }
      return nextForm;
    });
  };

  const handleFieldChange = (field: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (dateError) {
      showToast({
        variant: "error",
        title: "Validation Error",
        message: "Please fix the session dates before submitting.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("last_education_title", form.last_education_title);
      data.append("last_education_department", form.last_education_department);
      data.append("last_education_start", form.last_education_start);
      data.append("last_education_end", form.last_education_end);
      data.append("last_education_duration", form.last_education_duration);
      data.append("last_education_result", form.last_education_result);
      if (certificateFile) {
        data.append("last_education_certificate", certificateFile);
      }

      if (profile?.id) {
        await updateStudentProfile(profile.id, data);
      } else {
        await createStudentProfile(data);
      }

      await refresh();
      showToast({
        variant: "success",
        title: "Last education updated",
        message: "Your last education was saved successfully.",
      });
      router.push("/dashboard/student/choices/create" as Route);
      router.refresh();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Save failed",
        message: getApiErrorMessage(error, "Unable to save your last education."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-500 font-medium">Loading last education details...</p>;
  }

  return (
    <section className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-4 py-2">
      <div>
        <h2 className="text-xl font-black text-slate-800">Your Last Education</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
          <span>Dashboard</span>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Last Education Form</span>
        </div>
      </div>

      {!infoClosed && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl px-4 py-3 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-slate-500 text-sm" />
            <span>Add your latest qualification so consultants can assess your study options faster.</span>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-800 transition-colors" onClick={() => setInfoClosed(true)}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ProfileSectionCard title="Update Your Last Education" icon="fa-solid fa-graduation-cap" helperText="Provide basic details of your last degree/diploma">
          <ProfileCombobox
            label="Title Of Your Education"
            value={form.last_education_title}
            suggestions={STUDY_SUGGESTIONS}
            onChange={handleFieldChange("last_education_title")}
            placeholder="Select or type your education title"
          />
          <ProfileCombobox
            label="Group/Department"
            value={form.last_education_department}
            suggestions={DEPT_SUGGESTIONS}
            onChange={handleFieldChange("last_education_department")}
            placeholder="Select or type your group/department"
          />
          <ModernProfileInput
            label="Result/GPA"
            value={form.last_education_result}
            onChange={(e) => handleFieldChange("last_education_result")(e.target.value)}
            placeholder="e.g. 4.00 or A+"
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Education Period" icon="fa-regular fa-calendar-days" helperText="Your dates of enrollment and graduation">
          <ModernProfileInput
            label="Session Start"
            type="date"
            value={form.last_education_start}
            onChange={(e) => handleDateChange("last_education_start", e.target.value)}
          />
          <ModernProfileInput
            label="Session End"
            type="date"
            value={form.last_education_end}
            onChange={(e) => handleDateChange("last_education_end", e.target.value)}
            error={dateError}
          />
          {form.last_education_duration && (
            <div className="sm:col-span-2 text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/50 w-fit">
              Duration: {form.last_education_duration}
            </div>
          )}
        </ProfileSectionCard>

        <ProfileSectionCard title="Documents" icon="fa-regular fa-file" helperText="Verify your degree certificate">
          <div className="sm:col-span-2">
            <ProfileUploadCard
              label="Certificate/Documents"
              fileName={getDisplayFileName(profile?.last_education_certificate, certificateFile)}
              onFileSelect={(file) => setCertificateFile(file)}
            />
          </div>
        </ProfileSectionCard>

        <StickyProfileActionBar
          onSave={handleSubmit}
          saving={submitting}
          disabled={submitting}
        />
      </form>
    </section>
  );
}
