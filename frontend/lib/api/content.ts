import { apiRequest } from "./client";

export interface SiteSetting {
  id: number;
  company_name: string;
  primary_logo: string | null;
  secondary_logo: string | null;
  company_detail: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  twitter: string;
  youtube: string;
  instagram: string;
}

export interface Slider {
  id: number;
  subtitle: string;
  title: string;
  slug: string;
  description: string;
  image: string | null;
}

export interface AboutSection {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string | null;
}

export interface Testimonial {
  id: number;
  name: string;
  designation: string;
  description: string;
  image: string | null;
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface TermsDocument {
  id: number;
  title: string;
  content: string;
}

export interface ContactPayload {
  name: string;
  phone: string;
  email: string;
  service_interest?: string;
  subject: string;
  message: string;
}

export async function getSiteSettings(): Promise<SiteSetting[]> {
  return apiRequest<SiteSetting[]>("/api/content/settings/");
}

export async function getSliders(): Promise<Slider[]> {
  return apiRequest<Slider[]>("/api/content/sliders/");
}

export async function getAboutSections(): Promise<AboutSection[]> {
  return apiRequest<AboutSection[]>("/api/content/about/");
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return apiRequest<Testimonial[]>("/api/content/testimonials/");
}

export async function getFaqs(): Promise<FAQ[]> {
  return apiRequest<FAQ[]>("/api/content/faq/");
}

export async function getTerms(): Promise<TermsDocument[]> {
  return apiRequest<TermsDocument[]>("/api/content/terms/");
}

export async function submitContact(payload: ContactPayload): Promise<unknown> {
  return apiRequest<unknown>("/api/content/contact-submissions/", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
