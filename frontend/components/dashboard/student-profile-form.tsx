"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";
import { StudentCareerManager } from "@/components/dashboard/student-career-manager";
import { updateCurrentUser } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { getCities, getUniversities, type City, type University } from "@/lib/api/catalog";
import {
  createPostGraduateProfile,
  createStudentProfile,
  deletePostGraduateProfile,
  getPostGraduateProfile,
  getStudentProfile,
  updatePostGraduateProfile,
  updateStudentProfile,
  type PostGraduateProfile,
  type StudentProfile,
} from "@/lib/api/students";

import {
  ModernProfileInput,
  ModernProfileSelect,
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
type AcademicStatus = "under_graduate" | "post_graduate";

const TRACK_OPTIONS = [
  { value: "bangla", label: "Bangla Medium" },
  { value: "english", label: "English Medium" },
  { value: "madrasa", label: "Madrasa Medium" },
] as const;

const emptyAcademicFiles = {
  o_level_certificate: null as File | null,
  a_level_certificate: null as File | null,
  hsc_certificate: null as File | null,
  ssc_certificate: null as File | null,
  dakhil_certificate: null as File | null,
  alim_certificate: null as File | null,
  ielts_certificate: null as File | null,
  cv_document: null as File | null,
  cover_letter: null as File | null,
  experience_certificate: null as File | null,
};

const emptyPostGraduateForm = {
  title: "",
  grade: "",
  duration: "",
  department: "",
  start_date: "",
  end_date: "",
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

export function StudentProfileForm() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [infoClosed, setInfoClosed] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [editMode, setEditMode] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [postGraduateProfile, setPostGraduateProfile] = useState<PostGraduateProfile | null>(null);
  const [cityOptions, setCityOptions] = useState<City[]>([]);
  const [universityOptions, setUniversityOptions] = useState<University[]>([]);
  const [academicStatus, setAcademicStatus] = useState<AcademicStatus>("under_graduate");
  const [hasIelts, setHasIelts] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");

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
  });

  const [academicForm, setAcademicForm] = useState({
    academic_track: "bangla",
    o_level_result: "",
    a_level_result: "",
    hsc_result: "",
    ssc_result: "",
    dakhil_result: "",
    alim_result: "",
    ielts_score: "",
    skill_languages: "",
    co_curricular_activities: "",
  });

  const [postGraduateForm, setPostGraduateForm] = useState(emptyPostGraduateForm);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [academicFiles, setAcademicFiles] = useState(emptyAcademicFiles);
  const [postGraduateFile, setPostGraduateFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [profiles, postGraduates] = await Promise.all([
        getStudentProfile(),
        getPostGraduateProfile(),
      ]);
      const nextProfile = profiles[0] ?? null;
      const nextPostGraduate = postGraduates[0] ?? null;

      setStudentProfile(nextProfile);
      setPostGraduateProfile(nextPostGraduate);
      setAcademicStatus(nextPostGraduate ? "post_graduate" : "under_graduate");
      setHasIelts(Boolean(nextProfile?.ielts_score || nextProfile?.ielts_certificate));
      setAcademicFiles(emptyAcademicFiles);
      setPostGraduateFile(null);
      setAcademicForm({
        academic_track:
          nextProfile?.academic_track && nextProfile.academic_track !== "post_graduate"
            ? nextProfile.academic_track
            : "bangla",
        o_level_result: nextProfile?.o_level_result ?? "",
        a_level_result: nextProfile?.a_level_result ?? "",
        hsc_result: nextProfile?.hsc_result ?? "",
        ssc_result: nextProfile?.ssc_result ?? "",
        dakhil_result: nextProfile?.dakhil_result ?? "",
        alim_result: nextProfile?.alim_result ?? "",
        ielts_score: nextProfile?.ielts_score ?? "",
        skill_languages: nextProfile?.skill_languages ?? "",
        co_curricular_activities: nextProfile?.co_curricular_activities ?? "",
      });
      setPostGraduateForm({
        title: nextPostGraduate?.title ?? "",
        grade: nextPostGraduate?.grade ?? "",
        duration: nextPostGraduate?.duration ?? "",
        department: nextPostGraduate?.department ?? "",
        start_date: nextPostGraduate?.start_date ?? "",
        end_date: nextPostGraduate?.end_date ?? "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedTab = window.localStorage.getItem("student-profile-tab");
    if (savedTab === "personal" || savedTab === "academic") {
      setActiveTab(savedTab as ProfileTab);
      setActiveSection(savedTab === "personal" ? "identity" : "academic-status");
    }
    load().catch((error) => {
      showToast({
        variant: "error",
        title: "Profile load failed",
        message: getApiErrorMessage(error, "Unable to load your profile information right now."),
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
      phone: user.phone,
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

  const displayImage = profileImagePreview || user?.image_url || "/legacy/no-profile-img.png";
  const displayName = personalForm.full_name || user?.full_name || user?.email || "Student";
  const completion = user?.profile_completion ?? 0;
  const profileDisabled = !editMode;

  const setPersonalValue =
    (field: keyof typeof personalForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setPersonalForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const setAcademicValue =
    (field: keyof typeof academicForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setAcademicForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const setPostGraduateValue =
    (field: keyof typeof postGraduateForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setPostGraduateForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const setAcademicFile =
    (field: keyof typeof emptyAcademicFiles) => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setAcademicFiles((current) => ({ ...current, [field]: file }));
    };

  const handlePersonalSave = async (event: FormEvent) => {
    event.preventDefault();
    setSavingPersonal(true);
    try {
      const { first_name, last_name } = splitFullName(personalForm.full_name);
      await updateCurrentUser({
        first_name,
        last_name,
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
        image: profileImageFile ?? undefined,
      });
      await refresh();
      await load();
      setProfileImageFile(null);
      setEditMode(false);
      showToast({
        variant: "success",
        title: "Profile updated",
        message: "Personal information saved successfully.",
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
    setSavingAcademic(true);

    try {
      const studentData = new FormData();
      studentData.append("academic_track", academicForm.academic_track);
      studentData.append("o_level_result", academicForm.o_level_result);
      studentData.append("a_level_result", academicForm.a_level_result);
      studentData.append("hsc_result", academicForm.hsc_result);
      studentData.append("ssc_result", academicForm.ssc_result);
      studentData.append("dakhil_result", academicForm.dakhil_result);
      studentData.append("alim_result", academicForm.alim_result);
      studentData.append("ielts_score", hasIelts ? academicForm.ielts_score : "");
      studentData.append("skill_languages", academicForm.skill_languages);
      studentData.append("co_curricular_activities", academicForm.co_curricular_activities);

      Object.entries(academicFiles).forEach(([field, file]) => {
        if (file) {
          studentData.append(field, file);
        }
      });

      if (studentProfile?.id) {
        await updateStudentProfile(studentProfile.id, studentData);
      } else {
        await createStudentProfile(studentData);
      }

      if (academicStatus === "post_graduate") {
        const postGraduateData = new FormData();
        postGraduateData.append("title", postGraduateForm.title);
        postGraduateData.append("grade", postGraduateForm.grade);
        postGraduateData.append("duration", postGraduateForm.duration);
        postGraduateData.append("department", postGraduateForm.department);
        postGraduateData.append("start_date", postGraduateForm.start_date);
        postGraduateData.append("end_date", postGraduateForm.end_date);
        if (postGraduateFile) {
          postGraduateData.append("certificate", postGraduateFile);
        }

        if (postGraduateProfile?.id) {
          await updatePostGraduateProfile(postGraduateProfile.id, postGraduateData);
        } else {
          await createPostGraduateProfile(postGraduateData);
        }
      } else if (postGraduateProfile?.id) {
        await deletePostGraduateProfile(postGraduateProfile.id);
      }

      await refresh();
      await load();
      setEditMode(false);
      showToast({
        variant: "success",
        title: "Academic information saved",
        message: "Your academic profile was updated successfully.",
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

  const switchTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    setActiveSection(tab === "personal" ? "identity" : "academic-status");
    window.localStorage.setItem("student-profile-tab", tab);
  };

  const handleSectionNav = (id: string) => {
    setActiveSection(id);
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-500 font-medium">Loading your profile details...</p>;
  }

  const personalNavItems = [
    { id: "identity", label: "Identity", icon: "fa-regular fa-user" },
    { id: "contact", label: "Contact", icon: "fa-regular fa-envelope" },
    { id: "passport", label: "Passport / NID", icon: "fa-regular fa-id-card" },
    { id: "address", label: "Address", icon: "fa-regular fa-map" },
    { id: "preferences", label: "Study Preferences", icon: "fa-regular fa-compass" },
    { id: "documents", label: "Documents", icon: "fa-regular fa-file" },
  ];

  const academicNavItems = [
    { id: "academic-status", label: "Academic Status", icon: "fa-solid fa-graduation-cap" },
    { id: "academic-medium", label: "Select Medium", icon: "fa-solid fa-language" },
    { id: "academic-ielts", label: "IELTS", icon: "fa-regular fa-star" },
    { id: "academic-docs", label: "Docs & Activities", icon: "fa-regular fa-file-lines" },
  ];

  const currentNavItems = activeTab === "personal" ? personalNavItems : academicNavItems;

  return (
    <section className="flex flex-col gap-6 w-full px-2 lg:px-4 py-2">
      <div>
        <h2 className="text-xl font-black text-slate-800">Profile Information</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
          <span>Dashboard</span>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Update Profile</span>
        </div>
      </div>

      {!infoClosed && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl px-4 py-3 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-slate-500 text-sm" />
            <span>Update your personal and academic information used by consultants and service workflows.</span>
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
        role="Student"
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
          Personal Information
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "academic" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          onClick={() => switchTab("academic")}
        >
          Academic Information
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
            <form onSubmit={handlePersonalSave} className="flex flex-col gap-4">
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
                <ProfileSectionCard id="contact" title="Contact & Status" icon="fa-regular fa-envelope" helperText="How consultants can communicate with you">
                  <ModernProfileInput
                    label="Email Address"
                    value={personalForm.email}
                    readOnly
                    disabled
                  />
                  <ModernProfileInput
                    label="Phone Number"
                    value={personalForm.phone}
                    readOnly
                    disabled
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
                <ProfileSectionCard id="address" title="Address" icon="fa-regular fa-map" helperText="Your current physical location">
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
                <ProfileSectionCard id="preferences" title="Study Preferences" icon="fa-regular fa-compass" helperText="Targeted destinations and institutions">
                  <ProfileTagInput
                    label="Preferred Cities"
                    value={personalForm.preferred_city_ids}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, preferred_city_ids: val }))}
                    suggestions={cityOptions}
                    disabled={profileDisabled}
                    placeholder="Type to search preferred cities..."
                  />
                  <ProfileTagInput
                    label="Preferred Universities"
                    value={personalForm.preferred_university_ids}
                    onChange={(val) => setPersonalForm((p) => ({ ...p, preferred_university_ids: val }))}
                    suggestions={universityOptions}
                    disabled={profileDisabled}
                    placeholder="Type to search preferred universities..."
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
            <>
              <form onSubmit={handleAcademicSave} className="flex flex-col gap-4">
                {activeSection === "academic-status" && (
                  <div id="academic-status" className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
                          <i className="fa-solid fa-graduation-cap text-xs" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">Academic Status</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Choose undergraduate or postgraduate state</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex bg-slate-100/60 p-1 rounded-xl w-fit gap-1">
                      <button
                        type="button"
                        disabled={profileDisabled}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${academicStatus === "under_graduate" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800 disabled:opacity-50"}`}
                        onClick={() => setAcademicStatus("under_graduate")}
                      >
                        Under Graduate
                      </button>
                      <button
                        type="button"
                        disabled={profileDisabled}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${academicStatus === "post_graduate" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800 disabled:opacity-50"}`}
                        onClick={() => setAcademicStatus("post_graduate")}
                      >
                        Post Graduate
                      </button>
                    </div>

                    {academicStatus === "post_graduate" && (
                      <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-slate-55">
                        <ModernProfileInput
                          label="Graduation Title"
                          value={postGraduateForm.title}
                          onChange={setPostGraduateValue("title")}
                          readOnly={profileDisabled}
                          placeholder="e.g. Bachelor of Science"
                        />
                        <ModernProfileInput
                          label="Grade/CGPA"
                          value={postGraduateForm.grade}
                          onChange={setPostGraduateValue("grade")}
                          readOnly={profileDisabled}
                          placeholder="e.g. 3.85"
                        />
                        <ModernProfileInput
                          label="Duration"
                          value={postGraduateForm.duration}
                          onChange={setPostGraduateValue("duration")}
                          readOnly={profileDisabled}
                          placeholder="e.g. 4 Years"
                        />
                        <ModernProfileInput
                          label="Department/Subject"
                          value={postGraduateForm.department}
                          onChange={setPostGraduateValue("department")}
                          readOnly={profileDisabled}
                          placeholder="e.g. Computer Science"
                        />
                        <ModernProfileInput
                          label="Start Date"
                          type="date"
                          value={postGraduateForm.start_date}
                          onChange={setPostGraduateValue("start_date")}
                          readOnly={profileDisabled}
                        />
                        <ModernProfileInput
                          label="End Date"
                          type="date"
                          value={postGraduateForm.end_date}
                          onChange={setPostGraduateValue("end_date")}
                          readOnly={profileDisabled}
                        />
                        <div className="sm:col-span-2">
                          <ProfileUploadCard
                            label="Your Certificate"
                            fileName={getDisplayFileName(postGraduateProfile?.certificate, postGraduateFile)}
                            onFileSelect={(file) => setPostGraduateFile(file)}
                            disabled={profileDisabled}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "academic-medium" && (
                  <div id="academic-medium" className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-language text-xs" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Select Medium</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Use the same medium-specific structure</p>
                      </div>
                    </div>

                    <div className="flex bg-slate-100/60 p-1 rounded-xl w-fit gap-1">
                      {TRACK_OPTIONS.map((track) => (
                        <button
                          key={track.value}
                          type="button"
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${academicForm.academic_track === track.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          disabled={profileDisabled}
                          onClick={() => setAcademicForm((current) => ({ ...current, academic_track: track.value }))}
                        >
                          {track.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 mt-2">
                      {academicForm.academic_track === "english" && (
                        <>
                          <ModernProfileInput
                            label="O Level Result"
                            value={academicForm.o_level_result}
                            onChange={setAcademicValue("o_level_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="O Level Certificate"
                            fileName={getDisplayFileName(studentProfile?.o_level_certificate, academicFiles.o_level_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, o_level_certificate: file }))}
                            disabled={profileDisabled}
                          />
                          <ModernProfileInput
                            label="A Level Result"
                            value={academicForm.a_level_result}
                            onChange={setAcademicValue("a_level_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="A Level Certificate"
                            fileName={getDisplayFileName(studentProfile?.a_level_certificate, academicFiles.a_level_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, a_level_certificate: file }))}
                            disabled={profileDisabled}
                          />
                        </>
                      )}

                      {academicForm.academic_track === "bangla" && (
                        <>
                          <ModernProfileInput
                            label="HSC Result"
                            value={academicForm.hsc_result}
                            onChange={setAcademicValue("hsc_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="HSC Certificate"
                            fileName={getDisplayFileName(studentProfile?.hsc_certificate, academicFiles.hsc_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, hsc_certificate: file }))}
                            disabled={profileDisabled}
                          />
                          <ModernProfileInput
                            label="SSC Result"
                            value={academicForm.ssc_result}
                            onChange={setAcademicValue("ssc_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="SSC Certificate"
                            fileName={getDisplayFileName(studentProfile?.ssc_certificate, academicFiles.ssc_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, ssc_certificate: file }))}
                            disabled={profileDisabled}
                          />
                        </>
                      )}

                      {academicForm.academic_track === "madrasa" && (
                        <>
                          <ModernProfileInput
                            label="Dakhil Result"
                            value={academicForm.dakhil_result}
                            onChange={setAcademicValue("dakhil_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="Dakhil Certificate"
                            fileName={getDisplayFileName(studentProfile?.dakhil_certificate, academicFiles.dakhil_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, dakhil_certificate: file }))}
                            disabled={profileDisabled}
                          />
                          <ModernProfileInput
                            label="Alim Result"
                            value={academicForm.alim_result}
                            onChange={setAcademicValue("alim_result")}
                            readOnly={profileDisabled}
                          />
                          <ProfileUploadCard
                            label="Alim Certificate"
                            fileName={getDisplayFileName(studentProfile?.alim_certificate, academicFiles.alim_certificate)}
                            onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, alim_certificate: file }))}
                            disabled={profileDisabled}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "academic-ielts" && (
                  <div id="academic-ielts" className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center shadow-sm">
                          <i className="fa-regular fa-star text-xs" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">IELTS Score & Certificate</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Verify your English proficiency</p>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasIelts}
                          disabled={profileDisabled}
                          onChange={(e) => setHasIelts(e.target.checked)}
                          className="rounded border-slate-300 text-slate-800 focus:ring-slate-800 focus:ring-offset-0 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700">Is IELTS?</span>
                      </label>
                    </div>

                    {hasIelts && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ModernProfileInput
                          label="IELTS Score"
                          value={academicForm.ielts_score}
                          onChange={setAcademicValue("ielts_score")}
                          readOnly={profileDisabled}
                          placeholder="e.g. 7.5"
                        />
                        <ProfileUploadCard
                          label="IELTS Certificate"
                          fileName={getDisplayFileName(studentProfile?.ielts_certificate, academicFiles.ielts_certificate)}
                          onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, ielts_certificate: file }))}
                          disabled={profileDisabled}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "academic-docs" && (
                  <ProfileSectionCard id="academic-docs" title="Documents and activities" icon="fa-regular fa-file-lines" helperText="CV, Cover letter and references">
                    <ProfileTagInput
                      label="Skill Languages"
                      value={academicForm.skill_languages}
                      onChange={(val) => setAcademicForm((a) => ({ ...a, skill_languages: val }))}
                      suggestions={LANGUAGE_SUGGESTIONS}
                      disabled={profileDisabled}
                      placeholder="e.g. English, Bangla"
                    />
                    <ModernProfileInput
                      label="Co-curricular Activities"
                      value={academicForm.co_curricular_activities}
                      onChange={setAcademicValue("co_curricular_activities")}
                      readOnly={profileDisabled}
                      placeholder="e.g. Debate, volunteering"
                    />
                    <ProfileUploadCard
                      label="CV / Resume"
                      fileName={getDisplayFileName(studentProfile?.cv_document, academicFiles.cv_document)}
                      onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, cv_document: file }))}
                      disabled={profileDisabled}
                    />
                    <ProfileUploadCard
                      label="Cover Letter"
                      fileName={getDisplayFileName(studentProfile?.cover_letter, academicFiles.cover_letter)}
                      onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, cover_letter: file }))}
                      disabled={profileDisabled}
                    />
                    <div className="sm:col-span-2">
                      <ProfileUploadCard
                        label="Experience Certificate"
                        fileName={getDisplayFileName(studentProfile?.experience_certificate, academicFiles.experience_certificate)}
                        onFileSelect={(file) => setAcademicFiles((c) => ({ ...c, experience_certificate: file }))}
                        disabled={profileDisabled}
                      />
                    </div>
                  </ProfileSectionCard>
                )}

                <StickyProfileActionBar
                  onSave={handleAcademicSave}
                  saving={savingAcademic}
                  disabled={profileDisabled}
                />
              </form>
              <div className="mt-2 border border-slate-100 bg-white rounded-2xl p-5 shadow-sm">
                <StudentCareerManager />
              </div>
            </>
          )}
        </div>
      </ProfileEditShell>
    </section>
  );
}
