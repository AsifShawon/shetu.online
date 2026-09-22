import { apiRequest } from "./client";

export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  image: string | null;
  status: "active" | "disabled";
}

export interface Country {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  status: "active" | "disabled";
}

export interface City {
  id: number;
  country: number;
  country_name?: string;
  name: string;
  slug: string;
  status: "active" | "disabled";
}

export interface University {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  status: "active" | "disabled";
}

export interface Course {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  status: "active" | "disabled";
}

export interface Training {
  id: number;
  title: string;
  thumbnail: string | null;
  training_type: string;
  description: string;
  overview: string;
  organization: string;
  address: string;
  language: string;
  application_deadline: string | null;
  start_date: string | null;
  duration: string;
  price: string;
  document: string | null;
  status: "active" | "disabled";
}

export interface StudyLevel {
  id: number;
  name: string;
  slug: string;
  status: "active" | "disabled";
}

export interface EducationalInfo {
  id: number;
  title: string;
  country_id: number;
  institution_name: string;
  location: string;
  next_batch: string | null;
  entry_score: string;
  course_name: string;
  study_level_id: number;
  budget: string;
  scholarship_available: boolean;
  scholarship_percentage: string;
  card_banner: string | null;
  show_on_home: boolean;
  status: "active" | "disabled";
}

export async function getServices(): Promise<ServiceCategory[]> {
  return apiRequest<ServiceCategory[]>("/api/catalog/services/");
}

export async function getCountries(): Promise<Country[]> {
  return apiRequest<Country[]>("/api/catalog/countries/");
}

export async function getCities(countryId?: number): Promise<City[]> {
  const query = countryId ? `?country_id=${countryId}` : "";
  return apiRequest<City[]>(`/api/catalog/cities/${query}`);
}

export async function getCountry(id: number): Promise<Country> {
  return apiRequest<Country>(`/api/catalog/countries/${id}/`);
}

export async function getUniversities(): Promise<University[]> {
  return apiRequest<University[]>("/api/catalog/universities/");
}

export async function getCourses(): Promise<Course[]> {
  return apiRequest<Course[]>("/api/catalog/courses/");
}

export async function getTrainings(): Promise<Training[]> {
  return apiRequest<Training[]>("/api/consultants/trainings/");
}

export async function getTraining(id: number): Promise<Training> {
  return apiRequest<Training>(`/api/consultants/trainings/${id}/`);
}

export async function getStudyLevels(): Promise<StudyLevel[]> {
  return apiRequest<StudyLevel[]>("/api/catalog/study-levels/");
}

export async function getEducationalInfoList(): Promise<EducationalInfo[]> {
  return apiRequest<EducationalInfo[]>("/api/catalog/educational-info/");
}

export async function getEducationalInfo(id: number): Promise<EducationalInfo> {
  return apiRequest<EducationalInfo>(`/api/catalog/educational-info/${id}/`);
}
