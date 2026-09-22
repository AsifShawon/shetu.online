import { apiRequest, apiUpload } from "./client";

export interface StudentProfile {
  id: number;
  user_id: number;
  academic_track: "bangla" | "english" | "madrasa" | "post_graduate";
  o_level_result?: string;
  a_level_result?: string;
  hsc_result?: string;
  ssc_result?: string;
  dakhil_result?: string;
  alim_result?: string;
  ielts_score?: string;
  o_level_certificate?: string | null;
  a_level_certificate?: string | null;
  hsc_certificate?: string | null;
  ssc_certificate?: string | null;
  dakhil_certificate?: string | null;
  alim_certificate?: string | null;
  ielts_certificate?: string | null;
  last_education_title?: string;
  last_education_department?: string;
  last_education_start?: string;
  last_education_end?: string;
  last_education_duration?: string;
  last_education_result?: string;
  last_education_certificate?: string | null;
  cv_document?: string | null;
  cover_letter?: string | null;
  experience_certificate?: string | null;
  skill_languages?: string;
  co_curricular_activities?: string;
}

export interface PostGraduateProfile {
  id: number;
  user_id: number;
  grade?: string;
  title?: string;
  duration?: string;
  department?: string;
  start_date?: string | null;
  end_date?: string | null;
  certificate?: string | null;
}

export interface StudentChoice {
  id: number;
  user_id: number;
  service_id: number;
  service_name?: string;
  country_id: number;
  country_name?: string;
  institute: string;
  subject: string;
  session: string;
  budget: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentQualification {
  id: number;
  user: number;
  level_of_education: string;
  degree_title: string;
  institution: string;
  board_or_university?: string;
  department?: string;
  passing_year?: string;
  result?: string;
  grading_system?: string;
  duration?: string;
  document?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentExperience {
  id: number;
  user: number;
  organization: string;
  designation: string;
  responsibilities?: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: string;
  cv_document?: string | null;
  cover_letter?: string | null;
  experience_certificate?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentTraining {
  id: number;
  user: number;
  title: string;
  organization?: string;
  year?: string;
  duration?: string;
  result_or_award?: string;
  document?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyAbroadLead {
  name: string;
  phone: string;
  email: string;
  last_education_title: string;
  last_education_result: string;
  ielts_score?: string;
  interest_for: string;
  preferred_country?: number;
  budget?: string;
  note?: string;
}

export function hasValidLastEducation(profile: StudentProfile | null | undefined): boolean {
  if (!profile) return false;

  return Boolean(
    profile.last_education_title &&
    profile.last_education_department &&
    profile.last_education_start &&
    profile.last_education_duration &&
    profile.last_education_result
  );
}

export async function getStudentProfile(): Promise<StudentProfile[]> {
  return apiRequest<StudentProfile[]>("/api/students/profile/");
}

export async function createStudentProfile(data: FormData): Promise<StudentProfile> {
  return apiUpload<StudentProfile>("/api/students/profile/", data);
}

export async function updateStudentProfile(id: number, data: FormData): Promise<StudentProfile> {
  return apiUpload<StudentProfile>(`/api/students/profile/${id}/`, data, "PATCH");
}

export async function getPostGraduateProfile(): Promise<PostGraduateProfile[]> {
  return apiRequest<PostGraduateProfile[]>("/api/students/postgraduate-profile/");
}

export async function createPostGraduateProfile(data: FormData): Promise<PostGraduateProfile> {
  return apiUpload<PostGraduateProfile>("/api/students/postgraduate-profile/", data);
}

export async function updatePostGraduateProfile(id: number, data: FormData): Promise<PostGraduateProfile> {
  return apiUpload<PostGraduateProfile>(`/api/students/postgraduate-profile/${id}/`, data, "PATCH");
}

export async function deletePostGraduateProfile(id: number): Promise<void> {
  return apiRequest<void>(`/api/students/postgraduate-profile/${id}/`, { method: "DELETE" });
}

export async function getStudentChoices(): Promise<StudentChoice[]> {
  return apiRequest<StudentChoice[]>("/api/students/choices/");
}

export async function getStudentQualifications(): Promise<StudentQualification[]> {
  return apiRequest<StudentQualification[]>("/api/students/qualifications/");
}

export async function createStudentQualification(data: FormData): Promise<StudentQualification> {
  return apiUpload<StudentQualification>("/api/students/qualifications/", data);
}

export async function updateStudentQualification(id: number, data: FormData): Promise<StudentQualification> {
  return apiUpload<StudentQualification>(`/api/students/qualifications/${id}/`, data, "PATCH");
}

export async function deleteStudentQualification(id: number): Promise<void> {
  return apiRequest<void>(`/api/students/qualifications/${id}/`, { method: "DELETE" });
}

export async function getStudentExperiences(): Promise<StudentExperience[]> {
  return apiRequest<StudentExperience[]>("/api/students/experiences/");
}

export async function createStudentExperience(data: FormData): Promise<StudentExperience> {
  return apiUpload<StudentExperience>("/api/students/experiences/", data);
}

export async function updateStudentExperience(id: number, data: FormData): Promise<StudentExperience> {
  return apiUpload<StudentExperience>(`/api/students/experiences/${id}/`, data, "PATCH");
}

export async function deleteStudentExperience(id: number): Promise<void> {
  return apiRequest<void>(`/api/students/experiences/${id}/`, { method: "DELETE" });
}

export async function getStudentTrainings(): Promise<StudentTraining[]> {
  return apiRequest<StudentTraining[]>("/api/students/trainings/");
}

export async function createStudentTraining(data: FormData): Promise<StudentTraining> {
  return apiUpload<StudentTraining>("/api/students/trainings/", data);
}

export async function updateStudentTraining(id: number, data: FormData): Promise<StudentTraining> {
  return apiUpload<StudentTraining>(`/api/students/trainings/${id}/`, data, "PATCH");
}

export async function deleteStudentTraining(id: number): Promise<void> {
  return apiRequest<void>(`/api/students/trainings/${id}/`, { method: "DELETE" });
}

export async function createStudentChoice(data: Partial<StudentChoice>): Promise<StudentChoice> {
  return apiRequest<StudentChoice>("/api/students/choices/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateStudentChoice(id: number, data: Partial<StudentChoice>): Promise<StudentChoice> {
  return apiRequest<StudentChoice>(`/api/students/choices/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteStudentChoice(id: number): Promise<void> {
  return apiRequest<void>(`/api/students/choices/${id}/`, { method: "DELETE" });
}

export async function submitStudyAbroadLead(data: StudyAbroadLead): Promise<unknown> {
  return apiRequest<unknown>("/api/students/study-abroad-leads/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
