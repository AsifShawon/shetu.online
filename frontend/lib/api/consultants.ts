import { apiRequest, apiUpload } from "./client";

export interface ConsultantDashboardStats {
  active_services: number;
  total_services: number;
  total_requests: number;
  pending_requests: number;
  accepted_requests: number;
  submitted_reports: number;
  completed_requests: number;
  total_reviews: number;
  average_rating: number;
  total_earnings: string;
  available_balance: string;
  profile_completion: number;
  qualifications: number;
  experiences: number;
  training_enrollments: number;
  course_orders: number;
  active_subscription: boolean;
}

export interface ConsultantDashboardRequest {
  id: number;
  assessment_title: string;
  student_name: string;
  country_name: string;
  service_title: string;
  status: string;
  charge: string;
  duration: string;
  created_at: string;
}

export interface ConsultantOpportunityPost {
  id: number;
  title: string;
  description: string;
  student_name: string;
  country_name: string;
  service_name: string;
  study_level_name: string;
  subject: string;
  budget: string;
  quotation_count: number;
  has_sent_quotation: boolean;
  created_at: string;
}

export interface ConsultantDashboardSummary {
  stats: ConsultantDashboardStats;
  recent_requests: ConsultantDashboardRequest[];
  recent_posts: ConsultantOpportunityPost[];
}

export interface PublicConsultantProfile {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  image_url: string | null;
  country: {
    id: number;
    name: string;
    slug: string;
  } | null;
  present_city?: string;
  present_country?: string;
  experience_summary?: string;
  assessment_price?: string | null;
  assessment_duration?: string;
  verification_status: string;
  profile_completion: number;
  average_rating: number;
  total_reviews: number;
  experience_count: number;
  qualification_count: number;
}

export interface Qualification {
  id: number;
  user_id: number;
  level_of_education: string;
  degree_title: string;
  institution: string;
  department: string;
  passing_year: string;
  cgpa: string;
  grading_system?: string;
  duration: string;
  document: string | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: number;
  user_id: number;
  organization: string;
  designation: string;
  responsibilities: string;
  start_date: string;
  end_date: string | null;
  duration: string;
  document: string | null;
  cv_document: string | null;
  cover_letter?: string | null;
  experience_certificate?: string | null;
  skill_languages?: string;
  co_curricular_activities?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalTraining {
  id: number;
  user_id: number;
  title: string;
  organization?: string;
  year?: string;
  duration?: string;
  result_or_award?: string;
  document?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultantService {
  id: number;
  created_at: string;
  updated_at: string;
  consultant_id: number;
  consultant_name?: string;
  consultant_image?: string | null;
  consultant_rating?: number;
  consultant_review_count?: number;
  consultant_verification_status?: string;
  consultant_subscription_status?: string;
  consultant_joined_at?: string;
  country_id: number;
  country_name?: string;
  country_image?: string | null;
  title: string;
  description: string;
  price: string;
  duration: string;
  status: "active" | "disabled";
  service_categories: number[];
  service_category_names?: string[];
  study_levels: number[];
  study_level_names?: string[];
  subjects: number[];
  subject_names?: string[];
  subject_names_input?: string[];
}

export interface ProPackage {
  id: number;
  name: string;
  level: string;
  package_type: "monthly" | "annual";
  duration_days: number;
  description: string;
  price: string;
  features: string[];
  status: "active" | "disabled";
}

export interface ProSubscription {
  id: number;
  user_id: number;
  package_id: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

export interface ConsultantTraining {
  id: number;
  user_id: number;
  training_id: number;
  title?: string;
}

export async function getConsultantServices(params?: {
  consultant_id?: number;
  country_id?: number;
  city_id?: number;
  university_id?: number;
  country?: string;
  keyword?: string;
  scope?: "public" | "mine";
}): Promise<ConsultantService[]> {
  const search = new URLSearchParams();
  if (params?.consultant_id) search.set("consultant_id", String(params.consultant_id));
  if (params?.country_id) search.set("country_id", String(params.country_id));
  if (params?.city_id) search.set("city_id", String(params.city_id));
  if (params?.university_id) search.set("university_id", String(params.university_id));
  if (params?.country) search.set("country", params.country);
  if (params?.keyword) search.set("keyword", params.keyword);
  if (params?.scope) search.set("scope", params.scope);
  const query = search.toString();
  return apiRequest<ConsultantService[]>(`/api/consultants/services/${query ? `?${query}` : ""}`);
}

export async function getConsultantSubjects(): Promise<Subject[]> {
  return apiRequest<Subject[]>("/api/consultants/subjects/");
}

export async function getConsultantDashboardSummary(): Promise<ConsultantDashboardSummary> {
  return apiRequest<ConsultantDashboardSummary>("/api/consultants/dashboard-summary/");
}

export async function getPublicConsultantProfile(id: number): Promise<PublicConsultantProfile> {
  return apiRequest<PublicConsultantProfile>(`/api/consultants/public/${id}/`);
}

export async function createConsultantService(data: Partial<ConsultantService>): Promise<ConsultantService> {
  return apiRequest<ConsultantService>("/api/consultants/services/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function createConsultantServicesBulk(services: Partial<ConsultantService>[]): Promise<ConsultantService[]> {
  return apiRequest<ConsultantService[]>("/api/consultants/services/bulk/", {
    method: "POST",
    body: JSON.stringify(services)
  });
}

export async function updateConsultantService(id: number, data: Partial<ConsultantService>): Promise<ConsultantService> {
  return apiRequest<ConsultantService>(`/api/consultants/services/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteConsultantService(id: number): Promise<void> {
  return apiRequest<void>(`/api/consultants/services/${id}/`, { method: "DELETE" });
}

export async function getProPackages(): Promise<ProPackage[]> {
  return apiRequest<ProPackage[]>("/api/consultants/pro-packages/");
}

export async function getMySubscriptions(): Promise<ProSubscription[]> {
  return apiRequest<ProSubscription[]>("/api/consultants/pro-subscriptions/");
}

export async function getQualifications(): Promise<Qualification[]> {
  return apiRequest<Qualification[]>("/api/consultants/qualifications/");
}

export async function createQualification(data: FormData): Promise<Qualification> {
  return apiUpload<Qualification>("/api/consultants/qualifications/", data);
}

export async function updateQualification(id: number, data: FormData): Promise<Qualification> {
  return apiUpload<Qualification>(`/api/consultants/qualifications/${id}/`, data, "PATCH");
}

export async function deleteQualification(id: number): Promise<void> {
  return apiRequest<void>(`/api/consultants/qualifications/${id}/`, { method: "DELETE" });
}

export async function getExperiences(): Promise<Experience[]> {
  return apiRequest<Experience[]>("/api/consultants/experiences/");
}

export async function createExperience(data: FormData): Promise<Experience> {
  return apiUpload<Experience>("/api/consultants/experiences/", data);
}

export async function updateExperience(id: number, data: FormData): Promise<Experience> {
  return apiUpload<Experience>(`/api/consultants/experiences/${id}/`, data, "PATCH");
}

export async function deleteExperience(id: number): Promise<void> {
  return apiRequest<void>(`/api/consultants/experiences/${id}/`, { method: "DELETE" });
}

export async function getPersonalTrainings(): Promise<PersonalTraining[]> {
  return apiRequest<PersonalTraining[]>("/api/consultants/personal-trainings/");
}

export async function createPersonalTraining(data: FormData): Promise<PersonalTraining> {
  return apiUpload<PersonalTraining>("/api/consultants/personal-trainings/", data);
}

export async function updatePersonalTraining(id: number, data: FormData): Promise<PersonalTraining> {
  return apiUpload<PersonalTraining>(`/api/consultants/personal-trainings/${id}/`, data, "PATCH");
}

export async function deletePersonalTraining(id: number): Promise<void> {
  return apiRequest<void>(`/api/consultants/personal-trainings/${id}/`, { method: "DELETE" });
}
