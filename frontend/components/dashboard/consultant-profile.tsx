"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";

import {
  EducationTitleCombobox,
  DepartmentCombobox,
  InstitutionCombobox,
  StudyLevelSelect,
  ResultInput,
  PassingYearCombobox,
  GradingSystemCombobox,
  DurationCombobox,
  OrganizationCombobox,
} from "@/components/form/education-fields";

import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { updateCurrentUser } from "@/lib/api/auth";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";
import { getCities, getUniversities, type City, type University } from "@/lib/api/catalog";
import {
  createExperience,
  createQualification,
  deleteExperience,
  deleteQualification,
  getExperiences,
  getQualifications,
  updateExperience,
  updateQualification,
  type Experience,
  type Qualification,
} from "@/lib/api/consultants";

import {
  ModernProfileInput,
  ModernProfileSelect,
  ModernProfileTextarea,
  ProfileCombobox,
  ProfileTagInput,
  ProfileUploadCard,
  ProfileEditShell,
  ProfileHeaderCard,
  ProfileSectionCard,
  ProfileSectionNav,
  StickyProfileActionBar
} from "./profile-shared";

type ProfileTab = "personal" | "academic";

type QualificationFormState = {
  level_of_education: string;
  degree_title: string;
  institution: string;
  department: string;
  passing_year: string;
  cgpa: string;
  grading_system: string;
  duration: string;
};

type ExperienceFormState = {
  organization: string;
  designation: string;
  responsibilities: string;
  start_date: string;
  end_date: string;
  duration: string;
  skill_languages: string;
  co_curricular_activities: string;
};

const NATIONALITY_SUGGESTIONS = [
  "Bangladeshi", "Australian", "Canadian", "British", "American", "Malaysian", "German", "Swedish", "Indian", "Pakistani"
];

const COUNTRY_SUGGESTIONS = [
  "Bangladesh", "Australia", "Canada", "United Kingdom", "United States", "Malaysia", "Germany", "Sweden", "India", "Saudi Arabia"
];

const CITY_SUGGESTIONS = [
  "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Adelaide", "Melbourne", "Sydney", "Toronto", "London", "Manchester"
];

const LANGUAGE_SUGGESTIONS = [
  "English", "Bangla", "Hindi", "Arabic", "French", "German", "Spanish", "Japanese", "Mandarin"
];

const ASSESSMENT_SUGGESTIONS = [
  "General Admission Guidance", "Visa Processing", "Scholarship Guidance", "SOP Review", "Country/University Selection", "Financial Planning"
];

function createBlankQualificationForm(): QualificationFormState {
  return {
    level_of_education: "",
    degree_title: "",
    institution: "",
    department: "",
    passing_year: "",
    cgpa: "",
    grading_system: "",
    duration: "",
  };
}

function createBlankExperienceForm(): ExperienceFormState {
  return {
    organization: "",
    designation: "",
    responsibilities: "",
    start_date: "",
    end_date: "",
    duration: "",
    skill_languages: "",
    co_curricular_activities: "",
  };
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first_name: "", last_name: "" };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

function getDisplayFileName(path?: string | null, file?: File | null) {
  if (file) return file.name;
  if (!path) return null;
  const segments = path.split("/");
  return segments[segments.length - 1] || "Current file attached";
}

function getRecordTimestamp(record: { updated_at?: string; created_at?: string }) {
  return new Date(record.updated_at || record.created_at || 0).getTime();
}

function sortByNewest<T extends { updated_at?: string; created_at?: string }>(items: T[]) {
  return [...items].sort((left, right) => getRecordTimestamp(right) - getRecordTimestamp(left));
}

export function ConsultantProfile() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [infoClosed, setInfoClosed] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [editMode, setEditMode] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");

  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [universityOptions, setUniversityOptions] = useState<University[]>([]);
  const [qualificationForm, setQualificationForm] = useState<QualificationFormState>(createBlankQualificationForm());
  const [experienceForm, setExperienceForm] = useState<ExperienceFormState>(createBlankExperienceForm());
  const [qualificationFile, setQualificationFile] = useState<File | null>(null);
  const [experienceDocumentFile, setExperienceDocumentFile] = useState<File | null>(null);
  const [experienceCvFile, setExperienceCvFile] = useState<File | null>(null);
  const [experienceCoverLetterFile, setExperienceCoverLetterFile] = useState<File | null>(null);
  const [experienceCertificateFile, setExperienceCertificateFile] = useState<File | null>(null);

  const [personalForm, setPersonalForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    present_address: "",
    present_city: "",
    present_country: "",
    occupation: "",
    skill_languages: "",
    date_of_birth: "",
    nationality: "",
    passport_or_nid: "",
    passport_issue_date: "",
    passport_expiry_date: "",
    preferred_city_ids: [] as string[],
    preferred_university_ids: [] as string[],
    years_of_experience: "",
    assessment_time_value: "",
    assessment_time_unit: "",
    assessment_types: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const currentQualification = qualifications[0] ?? null;
  const currentExperience = experiences[0] ?? null;
  const olderQualifications = qualifications.slice(1);
  const olderExperiences = experiences.slice(1);

  const load = async () => {
    setLoading(true);
    try {
      const [qualificationItems, experienceItems] = await Promise.all([
        getQualifications(),
        getExperiences(),
      ]);

      const nextQualifications = sortByNewest(qualificationItems);
      const nextExperiences = sortByNewest(experienceItems);
      const latestQualification = nextQualifications[0] ?? null;
      const latestExperience = nextExperiences[0] ?? null;

      setQualifications(nextQualifications);
      setExperiences(nextExperiences);
      setQualificationForm(
        latestQualification
          ? {
              level_of_education: latestQualification.level_of_education,
              degree_title: latestQualification.degree_title,
              institution: latestQualification.institution,
              department: latestQualification.department,
              passing_year: latestQualification.passing_year,
              cgpa: latestQualification.cgpa,
              grading_system: latestQualification.grading_system ?? "",
              duration: latestQualification.duration,
            }
          : createBlankQualificationForm()
      );
      setExperienceForm(
        latestExperience
          ? {
              organization: latestExperience.organization,
              designation: latestExperience.designation,
              responsibilities: latestExperience.responsibilities,
              start_date: latestExperience.start_date ?? "",
              end_date: latestExperience.end_date ?? "",
              duration: latestExperience.duration,
              skill_languages: latestExperience.skill_languages ?? "",
              co_curricular_activities: latestExperience.co_curricular_activities ?? "",
            }
          : createBlankExperienceForm()
      );
      setQualificationFile(null);
      setExperienceDocumentFile(null);
      setExperienceCvFile(null);
      setExperienceCoverLetterFile(null);
      setExperienceCertificateFile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTab = window.localStorage.getItem("consultant-profile-tab");
    if (savedTab === "personal" || savedTab === "academic") {
      setActiveTab(savedTab as ProfileTab);
      setActiveSection(savedTab === "personal" ? "identity" : "qualification");
    }

    load().catch((error) => {
      showToast({
        variant: "error",
        title: "Profile load failed",
        message: getApiErrorMessage(error, "Unable to load your consultant profile right now."),
      });
      setLoading(false);
    });
  }, [showToast]);

  useEffect(() => {
    Promise.all([getCities(), getUniversities()])
      .then(([cities, universities]) => {
        setCityOptions(cities.filter((item) => item.status === "active"));
        setUniversityOptions(universities.filter((item) => item.status === "active"));
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!user) return;

    setPersonalForm({
      full_name: user.full_name ?? `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone ?? "",
      gender: user.gender ?? "",
      present_address: user.present_address ?? "",
      present_city: user.present_city ?? "",
      present_country: user.present_country ?? "",
      occupation: user.occupation ?? "",
      skill_languages: user.skill_languages ?? "",
      date_of_birth: user.date_of_birth ?? "",
      nationality: user.nationality ?? "",
      passport_or_nid: user.passport_or_nid ?? "",
      passport_issue_date: user.passport_issue_date ?? "",
      passport_expiry_date: user.passport_expiry_date ?? "",
      preferred_city_ids: (user.preferred_city_ids ?? []).map(String),
      preferred_university_ids: (user.preferred_university_ids ?? []).map(String),
      years_of_experience: user.years_of_experience ? String(user.years_of_experience) : "",
      assessment_time_value: user.assessment_time_value ? String(user.assessment_time_value) : "",
      assessment_time_unit: user.assessment_time_unit ?? "",
      assessment_types: (user.assessment_types ?? []).join(", "),
    });
  }, [user]);

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      return;
    }

    const nextUrl = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [profileImageFile]);

  const displayImage = profileImagePreview || getMediaUrl(user?.image_url) || "/legacy/no-profile-img.png";
  const displayName = personalForm.full_name || user?.full_name || user?.email || "Consultant";
  const completion = user?.profile_completion ?? 0;
  const profileDisabled = !editMode;

  const setPersonalValue =
    (field: keyof typeof personalForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setPersonalForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const setQualificationRawValue =
    (field: keyof QualificationFormState) =>
    (val: string) => {
      setQualificationForm((current) => ({ ...current, [field]: val }));
    };

  const setExperienceValue =
    (field: keyof ExperienceFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setExperienceForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const setExperienceRawValue =
    (field: keyof ExperienceFormState) =>
    (val: string) => {
      setExperienceForm((current) => ({ ...current, [field]: val }));
    };

  const switchTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    setActiveSection(tab === "personal" ? "identity" : "qualification");
    window.localStorage.setItem("consultant-profile-tab", tab);
  };

  const handlePersonalSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPersonal(true);

    try {
      const { first_name, last_name } = splitFullName(personalForm.full_name);
      await updateCurrentUser({
        first_name,
        last_name,
        phone: personalForm.phone,
        gender: personalForm.gender,
        present_address: personalForm.present_address,
        present_city: personalForm.present_city,
        present_country: personalForm.present_country,
        occupation: personalForm.occupation,
        skill_languages: personalForm.skill_languages,
        date_of_birth: personalForm.date_of_birth,
        nationality: personalForm.nationality,
        passport_or_nid: personalForm.passport_or_nid,
        passport_issue_date: personalForm.passport_issue_date,
        passport_expiry_date: personalForm.passport_expiry_date,
        preferred_city_ids: personalForm.preferred_city_ids.map(Number),
        preferred_university_ids: personalForm.preferred_university_ids.map(Number),
        years_of_experience: personalForm.years_of_experience ? Number(personalForm.years_of_experience) : null,
        assessment_time_value: personalForm.assessment_time_value ? Number(personalForm.assessment_time_value) : null,
        assessment_time_unit: personalForm.assessment_time_unit,
        assessment_types: personalForm.assessment_types.split(",").map((item) => item.trim()).filter(Boolean),
        image: profileImageFile ?? undefined,
      });
      await refresh();
      setProfileImageFile(null);
      setEditMode(false);
      showToast({
        variant: "success",
        title: "Profile updated",
        message: "Consultant personal information saved successfully.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Profile update failed",
        message: getApiErrorMessage(error, "Unable to save your personal information."),
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleAcademicSave = async (event: FormEvent) => {
    event.preventDefault();

    const qualificationStarted = Boolean(
      qualificationForm.level_of_education ||
        qualificationForm.degree_title ||
        qualificationForm.institution ||
        qualificationForm.department ||
        qualificationForm.passing_year ||
        qualificationForm.cgpa ||
        qualificationForm.duration ||
        qualificationFile
    );
    const experienceStarted = Boolean(
      experienceForm.organization ||
        experienceForm.designation ||
        experienceForm.responsibilities ||
        experienceForm.start_date ||
        experienceForm.end_date ||
        experienceForm.duration ||
        experienceDocumentFile ||
        experienceCvFile
    );

    if (!qualificationStarted && !currentQualification && !experienceStarted && !currentExperience) {
      showToast({
        variant: "error",
        title: "Nothing to save",
        message: "Add at least one education or experience record before saving academic information.",
      });
      return;
    }

    if (
      qualificationStarted &&
      (!qualificationForm.level_of_education.trim() ||
        !qualificationForm.degree_title.trim() ||
        !qualificationForm.institution.trim())
    ) {
      showToast({
        variant: "error",
        title: "Education incomplete",
        message: "Level of education, degree title, and institution are required for the last education block.",
      });
      return;
    }

    if (experienceStarted && (!experienceForm.organization.trim() || !experienceForm.designation.trim())) {
      showToast({
        variant: "error",
        title: "Experience incomplete",
        message: "Organization and designation are required for the latest experience block.",
      });
      return;
    }

    setSavingAcademic(true);
    try {
      if (qualificationStarted) {
        const qualificationData = new FormData();
        qualificationData.append("level_of_education", qualificationForm.level_of_education);
        qualificationData.append("degree_title", qualificationForm.degree_title);
        qualificationData.append("institution", qualificationForm.institution);
        qualificationData.append("department", qualificationForm.department);
        qualificationData.append("passing_year", qualificationForm.passing_year);
        qualificationData.append("cgpa", qualificationForm.cgpa);
        qualificationData.append("grading_system", qualificationForm.grading_system);
        qualificationData.append("duration", qualificationForm.duration);
        if (qualificationFile) {
          qualificationData.append("document", qualificationFile);
        }

        if (currentQualification) {
          await updateQualification(currentQualification.id, qualificationData);
        } else {
          await createQualification(qualificationData);
        }
      }

      if (experienceStarted) {
        const experienceData = new FormData();
        experienceData.append("organization", experienceForm.organization);
        experienceData.append("designation", experienceForm.designation);
        experienceData.append("responsibilities", experienceForm.responsibilities);
        experienceData.append("start_date", experienceForm.start_date);
        experienceData.append("end_date", experienceForm.end_date);
        experienceData.append("duration", experienceForm.duration);
        experienceData.append("skill_languages", experienceForm.skill_languages);
        experienceData.append("co_curricular_activities", experienceForm.co_curricular_activities);
        if (experienceDocumentFile) {
          experienceData.append("document", experienceDocumentFile);
        }
        if (experienceCvFile) {
          experienceData.append("cv_document", experienceCvFile);
        }
        if (experienceCoverLetterFile) {
          experienceData.append("cover_letter", experienceCoverLetterFile);
        }
        if (experienceCertificateFile) {
          experienceData.append("experience_certificate", experienceCertificateFile);
        }

        if (currentExperience) {
          await updateExperience(currentExperience.id, experienceData);
        } else {
          await createExperience(experienceData);
        }
      }

      await refresh();
      await load();
      setEditMode(false);
      showToast({
        variant: "success",
        title: "Academic information saved",
        message: "Consultant education and experience were updated successfully.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Academic save failed",
        message: getApiErrorMessage(error, "Unable to save your academic information."),
      });
    } finally {
      setSavingAcademic(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "qualification" | "experience";
    id: number;
  } | null>(null);

  const handleDeleteQualification = (id: number) => {
    setDeleteTarget({ type: "qualification", id });
  };

  const handleDeleteExperience = (id: number) => {
    setDeleteTarget({ type: "experience", id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "qualification") {
        await deleteQualification(deleteTarget.id);
        showToast({
          variant: "success",
          title: "Education deleted",
          message: "The selected education record was removed.",
        });
      } else {
        await deleteExperience(deleteTarget.id);
        showToast({
          variant: "success",
          title: "Experience deleted",
          message: "The selected experience record was removed.",
        });
      }
      setDeleteTarget(null);
      await refresh();
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this record."),
      });
    }
  };

  const handleSectionNav = (id: string) => {
    setActiveSection(id);
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-500 font-medium">Loading consultant profile...</p>;
  }

  const personalNavItems = [
    { id: "identity", label: "Identity", icon: "fa-regular fa-user" },
    { id: "contact", label: "Contact", icon: "fa-regular fa-envelope" },
    { id: "passport", label: "Passport / NID", icon: "fa-regular fa-id-card" },
    { id: "address", label: "Address", icon: "fa-regular fa-map" },
    { id: "preferences", label: "Study Preferences", icon: "fa-regular fa-compass" },
    { id: "consultation", label: "Consultation Info", icon: "fa-solid fa-briefcase" },
    { id: "documents", label: "Documents", icon: "fa-regular fa-file" },
  ];

  const academicNavItems = [
    { id: "qualification", label: "Qualification", icon: "fa-solid fa-graduation-cap" },
    { id: "experience", label: "Latest Experience", icon: "fa-solid fa-briefcase" },
    { id: "records-overview", label: "Records History", icon: "fa-solid fa-history" },
  ];

  const currentNavItems = activeTab === "personal" ? personalNavItems : academicNavItems;

  return (
    <section className="flex flex-col gap-6 w-full px-2 lg:px-4 py-2">
      <div>
        <h2 className="text-xl font-black text-slate-800">Profile Information</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
          <span>Dashboard</span>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Profile Settings</span>
        </div>
      </div>

      {!infoClosed && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl px-4 py-3 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-slate-500 text-sm" />
            <span>Update your contact, passport, and consultation options used by service workflows.</span>
          </div>
          <button type="button" className="text-slate-400 hover:text-slate-800 transition-colors" onClick={() => setInfoClosed(true)}>
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      )}

      <ProfileHeaderCard
        avatarUrl={displayImage}
        name={displayName}
        email={user?.email || ""}
        role="Consultant"
        completion={completion}
        editMode={editMode}
        onToggleEdit={() => setEditMode(!editMode)}
        onAvatarChange={(file) => setProfileImageFile(file)}
      />

      <div className="flex bg-slate-100/60 p-1 rounded-xl w-fit self-start gap-1">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "personal" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => switchTab("personal")}
        >
          Personal Info
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "academic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => switchTab("academic")}
        >
          Academic & Work
        </button>
      </div>

      <ProfileEditShell>
        <div className="lg:col-span-1">
          <ProfileSectionNav
            items={currentNavItems}
            activeSection={activeSection}
            onSectionClick={handleSectionNav}
          />
        </div>

        <div className="lg:col-span-3">
          {activeTab === "personal" ? (
            <form className="flex flex-col gap-4" onSubmit={handlePersonalSave}>
              {activeSection === "identity" && (
                <ProfileSectionCard id="identity" title="Identity" icon="fa-regular fa-user" helperText="Your basic personal detail cards">
                  <ModernProfileInput
                    label="Full Name"
                    value={personalForm.full_name}
                    onChange={setPersonalValue("full_name")}
                    readOnly={profileDisabled}
                  />
                  <ModernProfileInput
                    label="Date of Birth"
                    type="date"
                    value={personalForm.date_of_birth}
                    onChange={setPersonalValue("date_of_birth")}
                    readOnly={profileDisabled}
                  />
                  <ModernProfileSelect
                    label="Gender"
                    value={personalForm.gender}
                    onChange={setPersonalValue("gender")}
                    disabled={profileDisabled}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </ModernProfileSelect>
                  <ProfileCombobox
                    label="Nationality"
                    value={personalForm.nationality}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, nationality: val }))}
                    suggestions={NATIONALITY_SUGGESTIONS}
                    disabled={profileDisabled}
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "contact" && (
                <ProfileSectionCard id="contact" title="Contact & Status" icon="fa-regular fa-envelope" helperText="Advisory status details">
                  <ModernProfileInput
                    label="Email Address"
                    value={personalForm.email}
                    readOnly
                    disabled
                  />
                  <ModernProfileInput
                    label="Phone Number"
                    value={personalForm.phone}
                    onChange={setPersonalValue("phone")}
                    readOnly={profileDisabled}
                  />
                  <ModernProfileInput
                    label="Occupation"
                    value={personalForm.occupation}
                    onChange={setPersonalValue("occupation")}
                    readOnly={profileDisabled}
                  />
                  <ProfileTagInput
                    label="Skill Languages"
                    value={personalForm.skill_languages}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, skill_languages: val }))}
                    suggestions={LANGUAGE_SUGGESTIONS}
                    disabled={profileDisabled}
                    placeholder="e.g. English, Bangla"
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "passport" && (
                <ProfileSectionCard id="passport" title="Passport / NID" icon="fa-regular fa-id-card" helperText="Verification information">
                  <ModernProfileInput
                    label="Passport or NID"
                    value={personalForm.passport_or_nid}
                    onChange={setPersonalValue("passport_or_nid")}
                    readOnly={profileDisabled}
                  />
                  <ModernProfileInput
                    label="Passport Issue Date"
                    type="date"
                    value={personalForm.passport_issue_date}
                    onChange={setPersonalValue("passport_issue_date")}
                    readOnly={profileDisabled}
                  />
                  <ModernProfileInput
                    label="Passport Expiry Date"
                    type="date"
                    value={personalForm.passport_expiry_date}
                    onChange={setPersonalValue("passport_expiry_date")}
                    readOnly={profileDisabled}
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "address" && (
                <ProfileSectionCard id="address" title="Address" icon="fa-regular fa-map" helperText="Your physical office/home location">
                  <div className="sm:col-span-2">
                    <ModernProfileInput
                      label="Present Address"
                      value={personalForm.present_address}
                      onChange={setPersonalValue("present_address")}
                      readOnly={profileDisabled}
                    />
                  </div>
                  <ProfileCombobox
                    label="Present City"
                    value={personalForm.present_city}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, present_city: val }))}
                    suggestions={CITY_SUGGESTIONS}
                    disabled={profileDisabled}
                  />
                  <ProfileCombobox
                    label="Present Country"
                    value={personalForm.present_country}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, present_country: val }))}
                    suggestions={COUNTRY_SUGGESTIONS}
                    disabled={profileDisabled}
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "preferences" && (
                <ProfileSectionCard id="preferences" title="Study Preferences" icon="fa-regular fa-compass" helperText="Destinations you advice students on">
                  <ProfileTagInput
                    label="Preferred Cities"
                    value={personalForm.preferred_city_ids}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, preferred_city_ids: val }))}
                    suggestions={cityOptions}
                    disabled={profileDisabled}
                    placeholder="Search cities..."
                  />
                  <ProfileTagInput
                    label="Preferred Universities"
                    value={personalForm.preferred_university_ids}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, preferred_university_ids: val }))}
                    suggestions={universityOptions}
                    disabled={profileDisabled}
                    placeholder="Search universities..."
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "consultation" && (
                <ProfileSectionCard id="consultation" title="Consultation Info" icon="fa-solid fa-briefcase" helperText="Your session timing and guidance details">
                  <ModernProfileInput
                    label="Years of Experience"
                    value={personalForm.years_of_experience}
                    onChange={setPersonalValue("years_of_experience")}
                    readOnly={profileDisabled}
                    placeholder="e.g. 5"
                  />
                  <ModernProfileInput
                    label="Assessment Duration"
                    type="number"
                    value={personalForm.assessment_time_value}
                    onChange={setPersonalValue("assessment_time_value")}
                    readOnly={profileDisabled}
                    placeholder="e.g. 30"
                  />
                  <ModernProfileSelect
                    label="Assessment Unit"
                    value={personalForm.assessment_time_unit}
                    onChange={setPersonalValue("assessment_time_unit")}
                    disabled={profileDisabled}
                  >
                    <option value="">Select Unit</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </ModernProfileSelect>
                  <ProfileTagInput
                    label="Assessment Guidance Types"
                    value={personalForm.assessment_types}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, assessment_types: val }))}
                    suggestions={ASSESSMENT_SUGGESTIONS}
                    disabled={profileDisabled}
                    placeholder="Search guidance fields..."
                  />
                </ProfileSectionCard>
              )}

              {activeSection === "documents" && (
                <ProfileSectionCard id="documents" title="Documents" icon="fa-regular fa-file" helperText="Verify background visually">
                  <div className="sm:col-span-2">
                    <ProfileUploadCard
                      label="Profile Picture"
                      accept="image/*"
                      fileName={getDisplayFileName(user?.image_url, profileImageFile)}
                      onFileSelect={(file) => setProfileImageFile(file)}
                      disabled={profileDisabled}
                    />
                  </div>
                </ProfileSectionCard>
              )}

              <StickyProfileActionBar
                onSave={handlePersonalSave}
                saving={savingPersonal}
                disabled={profileDisabled}
              />
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleAcademicSave}>
              {activeSection === "qualification" && (
                <div id="qualification" className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
                      <i className="fa-solid fa-graduation-cap text-xs" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Latest Qualification</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Update your most recent degree or certification</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <StudyLevelSelect
                      value={qualificationForm.level_of_education}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("level_of_education")}
                    />
                    <EducationTitleCombobox
                      label="Degree Title"
                      placeholder="e.g. MSc in Education Management"
                      value={qualificationForm.degree_title}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("degree_title")}
                    />
                    <InstitutionCombobox
                      label="Institution"
                      placeholder="Institution name"
                      value={qualificationForm.institution}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("institution")}
                    />
                    <DepartmentCombobox
                      label="Department"
                      placeholder="Department / Major"
                      value={qualificationForm.department}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("department")}
                    />
                    <PassingYearCombobox
                      label="Passing Year"
                      placeholder="Select passing year"
                      value={qualificationForm.passing_year}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("passing_year")}
                    />
                    <ResultInput
                      value={qualificationForm.cgpa}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("cgpa")}
                    />
                    <GradingSystemCombobox
                      label="Grading System"
                      placeholder="Select grading system"
                      value={qualificationForm.grading_system}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("grading_system")}
                    />
                    <DurationCombobox
                      label="Duration"
                      placeholder="Select duration"
                      value={qualificationForm.duration}
                      disabled={profileDisabled}
                      onChange={setQualificationRawValue("duration")}
                    />
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Certificate / Document"
                        fileName={getDisplayFileName(currentQualification?.document, qualificationFile)}
                        onFileSelect={(file) => setQualificationFile(file)}
                        disabled={profileDisabled}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "experience" && (
                <div id="experience" className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
                      <i className="fa-solid fa-briefcase text-xs" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Latest Experience</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Keep the most relevant organization designation current</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <OrganizationCombobox
                      label="Organization Name"
                      placeholder="Organization name"
                      value={experienceForm.organization}
                      disabled={profileDisabled}
                      onChange={setExperienceRawValue("organization")}
                    />
                    <ModernProfileInput
                      label="Designation"
                      value={experienceForm.designation}
                      onChange={setExperienceValue("designation")}
                      readOnly={profileDisabled}
                      placeholder="Role title"
                    />
                    <ModernProfileInput
                      label="Start Date"
                      type="date"
                      value={experienceForm.start_date}
                      onChange={setExperienceValue("start_date")}
                      readOnly={profileDisabled}
                    />
                    <ModernProfileInput
                      label="End Date"
                      type="date"
                      value={experienceForm.end_date}
                      onChange={setExperienceValue("end_date")}
                      readOnly={profileDisabled}
                    />
                    <DurationCombobox
                      label="Duration"
                      placeholder="Select duration"
                      value={experienceForm.duration}
                      disabled={profileDisabled}
                      onChange={setExperienceRawValue("duration")}
                    />
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Supporting Document"
                        fileName={getDisplayFileName(currentExperience?.document, experienceDocumentFile)}
                        onFileSelect={(file) => setExperienceDocumentFile(file)}
                        disabled={profileDisabled}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ModernProfileTextarea
                        label="Responsibilities"
                        value={experienceForm.responsibilities}
                        onChange={setExperienceValue("responsibilities")}
                        readOnly={profileDisabled}
                        placeholder="Describe the responsibilities that support your advisory work."
                        rows={3}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Resume / CV"
                        fileName={getDisplayFileName(currentExperience?.cv_document, experienceCvFile)}
                        onFileSelect={(file) => setExperienceCvFile(file)}
                        disabled={profileDisabled}
                      />
                    </div>
                    <ProfileTagInput
                      label="Skill Languages"
                      value={experienceForm.skill_languages}
                      onChange={(val) => setExperienceForm((e) => ({ ...e, skill_languages: val }))}
                      suggestions={LANGUAGE_SUGGESTIONS}
                      disabled={profileDisabled}
                      placeholder="e.g. English, Bangla"
                    />
                    <ModernProfileInput
                      label="Co-curricular Activities"
                      value={experienceForm.co_curricular_activities}
                      onChange={setExperienceValue("co_curricular_activities")}
                      readOnly={profileDisabled}
                      placeholder="Add debate, volunteering, etc."
                    />
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Experience Certificate"
                        fileName={getDisplayFileName(currentExperience?.experience_certificate, experienceCertificateFile)}
                        onFileSelect={(file) => setExperienceCertificateFile(file)}
                        disabled={profileDisabled}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Cover Letter"
                        fileName={getDisplayFileName(currentExperience?.cover_letter, experienceCoverLetterFile)}
                        onFileSelect={(file) => setExperienceCoverLetterFile(file)}
                        disabled={profileDisabled}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "records-overview" && (
                <div id="records-overview" className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h4 className="text-xs font-bold text-slate-800">Education Records</h4>
                      <Link href={"/dashboard/consultant/education" as Route} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        Manage all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {qualifications.length === 0 ? (
                        <p className="text-xs font-medium text-slate-400">No education records.</p>
                      ) : (
                        qualifications.map((q) => (
                          <div key={q.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex justify-between items-start gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{q.degree_title}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{q.level_of_education}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{q.institution}</p>
                            </div>
                            {editMode && (
                              <button type="button" className="text-[10px] font-bold text-red-500 hover:underline" onClick={() => handleDeleteQualification(q.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h4 className="text-xs font-bold text-slate-800">Experience Records</h4>
                      <Link href={"/dashboard/consultant/experience" as Route} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                        Manage all
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {experiences.length === 0 ? (
                        <p className="text-xs font-medium text-slate-400">No experience records.</p>
                      ) : (
                        experiences.map((exp) => (
                          <div key={exp.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex justify-between items-start gap-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{exp.organization}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{exp.designation}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{exp.duration || `${exp.start_date || "Start"} - ${exp.end_date || "Present"}`}</p>
                            </div>
                            {editMode && (
                              <button type="button" className="text-[10px] font-bold text-red-500 hover:underline" onClick={() => handleDeleteExperience(exp.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(olderQualifications.length > 0 || olderExperiences.length > 0) && (
                <div className="border border-dashed border-slate-200 bg-white rounded-xl p-3.5 text-xs font-semibold text-slate-500 w-full">
                  Older records are preserved below the latest editable entries. Use the dedicated education and experience pages to reorder or expand your full consultant history.
                </div>
              )}

              <StickyProfileActionBar
                onSave={handleAcademicSave}
                saving={savingAcademic}
                disabled={profileDisabled}
              />
            </form>
          )}
        </div>
      </ProfileEditShell>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === "qualification" ? "Delete Education Record" : "Delete Experience Record"}
        message={
          deleteTarget?.type === "qualification"
            ? "Are you sure you want to remove this education record? This cannot be undone."
            : "Are you sure you want to remove this experience record? This cannot be undone."
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  );
}
