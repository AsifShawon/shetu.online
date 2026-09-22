import { apiRequest, apiUpload } from "./client";
import type { User } from "./auth";

export interface AdminDashboardCard {
  title: string;
  value: number;
  accent?: string;
  description: string;
}

export interface AdminDashboardBox {
  title: string;
  value: number;
  accent: "info" | "success" | "warning" | "danger";
  icon: string;
  href: string;
}

export interface AdminDashboardOverview {
  dashboard_boxes?: AdminDashboardBox[];
  chart_data?: {
    labels: string[];
    contact_requests: number[];
    testimonials: number[];
  };
  summary_cards: AdminDashboardCard[];
  ops_cards: Array<{
    title: string;
    value: number;
    description: string;
  }>;
  catalog_snapshot: Record<string, number>;
  financial_snapshot: Record<string, number>;
  recent_contacts: Array<Record<string, unknown>>;
  recent_verifications: Array<Record<string, unknown>>;
  recent_withdrawals: Array<Record<string, unknown>>;
}

export type AdminRecord = Record<string, unknown>;
export type AdminPayload = FormData | Record<string, unknown>;

function ensureTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

function buildListPath(path: string, search = ""): string {
  const basePath = ensureTrailingSlash(path);
  if (!search.trim()) return basePath;
  const glue = basePath.includes("?") ? "&" : "?";
  return `${basePath}${glue}q=${encodeURIComponent(search.trim())}`;
}

function buildDetailPath(path: string, id: number): string {
  const basePath = ensureTrailingSlash(path).replace(/\?[^]*$/, "");
  return `${basePath}${id}/`;
}

export async function getAdminDashboard(): Promise<AdminDashboardOverview> {
  return apiRequest<AdminDashboardOverview>("/api/admin/dashboard/");
}

export async function getAdminResource(path: string, search = ""): Promise<AdminRecord[]> {
  return apiRequest<AdminRecord[]>(buildListPath(path, search));
}

export async function getAdminResourceDetail<T = AdminRecord>(path: string, id: number): Promise<T> {
  return apiRequest<T>(buildDetailPath(path, id));
}

export async function createAdminResource(path: string, payload: AdminPayload): Promise<AdminRecord> {
  if (payload instanceof FormData) {
    return apiUpload<AdminRecord>(ensureTrailingSlash(path), payload, "POST");
  }

  return apiRequest<AdminRecord>(ensureTrailingSlash(path), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminResource(path: string, id: number, payload: AdminPayload): Promise<AdminRecord> {
  if (payload instanceof FormData) {
    return apiUpload<AdminRecord>(buildDetailPath(path, id), payload, "PATCH");
  }

  return apiRequest<AdminRecord>(buildDetailPath(path, id), {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminResource(path: string, id: number): Promise<void> {
  return apiRequest<void>(buildDetailPath(path, id), { method: "DELETE" });
}

export async function postAdminAction(path: string, id: number, action: string, payload?: Record<string, unknown>): Promise<AdminRecord> {
  return apiRequest<AdminRecord>(`${buildDetailPath(path, id)}${action}/`, {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export type { User };
