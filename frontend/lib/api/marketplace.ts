import { apiRequest } from "./client";

export interface StudentPost {
  id: number;
  student_id: number;
  student_name?: string;
  title: string;
  description: string;
  country_id: number | null;
  country_name?: string;
  custom_country_name?: string;
  service_category_id: number | null;
  service_name?: string;
  custom_service_name?: string;
  subject: string;
  institute: string;
  session: string;
  study_level_id: number | null;
  study_level_name?: string;
  custom_study_level_name?: string;
  budget: string | null;
  status: "active" | "disabled" | "pending" | "sent";
  created_at?: string;
}

export interface StudentPostPayload {
  title: string;
  description: string;
  country_id?: number | null;
  custom_country_name?: string;
  service_category_id?: number | null;
  custom_service_name?: string;
  subject: string;
  institute: string;
  session: string;
  study_level_id?: number | null;
  custom_study_level_name?: string;
  budget?: string | null;
}

export interface Quotation {
  id: number;
  student_id: number;
  post_id: number;
  post_title?: string;
  consultant_id: number;
  consultant_name?: string;
  consultant_service_id: number;
  service_title?: string;
  quotation: string;
  status: "active" | "disabled" | "pending" | "sent";
  created_at?: string;
}

export async function getStudentPosts(): Promise<StudentPost[]> {
  return apiRequest<StudentPost[]>("/api/marketplace/posts/");
}

export async function getMyPosts(): Promise<StudentPost[]> {
  return apiRequest<StudentPost[]>("/api/marketplace/posts/?mine=1");
}

export async function createPost(data: StudentPostPayload): Promise<StudentPost> {
  return apiRequest<StudentPost>("/api/marketplace/posts/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updatePost(id: number, data: StudentPostPayload): Promise<StudentPost> {
  return apiRequest<StudentPost>(`/api/marketplace/posts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deletePost(id: number): Promise<void> {
  return apiRequest<void>(`/api/marketplace/posts/${id}/`, { method: "DELETE" });
}

export async function getQuotations(): Promise<Quotation[]> {
  return apiRequest<Quotation[]>("/api/marketplace/quotations/");
}

export async function createQuotation(data: Partial<Quotation>): Promise<Quotation> {
  return apiRequest<Quotation>("/api/marketplace/quotations/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation> {
  return apiRequest<Quotation>(`/api/marketplace/quotations/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}
