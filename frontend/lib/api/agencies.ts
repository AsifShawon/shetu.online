import { apiRequest, apiUpload } from "./client";

export interface AgencyProfile {
  id: number;
  user_id: number;
  slogan?: string;
  description?: string;
  banner_heading?: string;
  sub_heading?: string;
  banner?: string | null;
  about_text?: string;
  mission?: string;
  vision?: string;
  policy?: string;
  map_link?: string;
  image?: string | null;
}

export interface AgencyConsultant {
  id: number;
  agency_id: number;
  consultant_id: number;
  consultant_name?: string;
  consultant_email?: string;
  consultant_image?: string | null;
  verification_status?: string;
}

export interface AgencyService {
  id: number;
  agency_id: number;
  service_category_id?: number;
  service_name?: string;
  title: string;
  description: string;
  image?: string | null;
  active: boolean;
}

export interface AgencyCountryOffering {
  id: number;
  agency_id: number;
  country_id: number;
  country_name?: string;
  country_image?: string | null;
  title: string;
  description: string;
  image?: string | null;
  active: boolean;
}

export interface AgencyGalleryImage {
  id: number;
  agency_id: number;
  image: string;
  active: boolean;
}

export async function getAgencyProfile(): Promise<AgencyProfile[]> {
  return apiRequest<AgencyProfile[]>("/api/agencies/profile/");
}

export async function createAgencyProfile(data: FormData): Promise<AgencyProfile> {
  return apiUpload<AgencyProfile>("/api/agencies/profile/", data);
}

export async function updateAgencyProfile(id: number, data: FormData): Promise<AgencyProfile> {
  return apiUpload<AgencyProfile>(`/api/agencies/profile/${id}/`, data, "PATCH");
}

export async function getAgencyConsultants(): Promise<AgencyConsultant[]> {
  return apiRequest<AgencyConsultant[]>("/api/agencies/consultants/");
}

export async function addAgencyConsultant(data: { consultant_id: number }): Promise<AgencyConsultant> {
  return apiRequest<AgencyConsultant>("/api/agencies/consultants/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function removeAgencyConsultant(id: number): Promise<void> {
  return apiRequest<void>(`/api/agencies/consultants/${id}/`, { method: "DELETE" });
}

export async function getAgencyServices(): Promise<AgencyService[]> {
  return apiRequest<AgencyService[]>("/api/agencies/services/");
}

export async function createAgencyService(data: FormData): Promise<AgencyService> {
  return apiUpload<AgencyService>("/api/agencies/services/", data);
}

export async function updateAgencyService(id: number, data: FormData): Promise<AgencyService> {
  return apiUpload<AgencyService>(`/api/agencies/services/${id}/`, data, "PATCH");
}

export async function deleteAgencyService(id: number): Promise<void> {
  return apiRequest<void>(`/api/agencies/services/${id}/`, { method: "DELETE" });
}

export async function getAgencyCountries(): Promise<AgencyCountryOffering[]> {
  return apiRequest<AgencyCountryOffering[]>("/api/agencies/countries/");
}

export async function createAgencyCountry(data: FormData): Promise<AgencyCountryOffering> {
  return apiUpload<AgencyCountryOffering>("/api/agencies/countries/", data);
}

export async function updateAgencyCountry(id: number, data: FormData): Promise<AgencyCountryOffering> {
  return apiUpload<AgencyCountryOffering>(`/api/agencies/countries/${id}/`, data, "PATCH");
}

export async function deleteAgencyCountry(id: number): Promise<void> {
  return apiRequest<void>(`/api/agencies/countries/${id}/`, { method: "DELETE" });
}

export async function getAgencyGallery(): Promise<AgencyGalleryImage[]> {
  return apiRequest<AgencyGalleryImage[]>("/api/agencies/gallery/");
}

export async function uploadGalleryImage(data: FormData): Promise<AgencyGalleryImage> {
  return apiUpload<AgencyGalleryImage>("/api/agencies/gallery/", data);
}

export async function deleteGalleryImage(id: number): Promise<void> {
  return apiRequest<void>(`/api/agencies/gallery/${id}/`, { method: "DELETE" });
}
