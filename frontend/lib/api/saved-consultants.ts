import { apiRequest } from "./client";

export interface SavedConsultant {
  id: number;
  consultant_id: number;
  consultant_name: string;
  consultant_image?: string | null;
  consultant_country_name: string;
  consultant_country_image?: string | null;
  consultant_rating: number;
  consultant_review_count: number;
  consultant_verification_status: "pending" | "in_progress" | "accepted" | "rejected";
  consultant_subscription_status: "none" | "pro";
  created_at: string;
}

export async function getSavedConsultants(): Promise<SavedConsultant[]> {
  return apiRequest<SavedConsultant[]>("/api/accounts/saved-consultants/");
}

export async function saveConsultant(consultantId: number): Promise<SavedConsultant> {
  return apiRequest<SavedConsultant>("/api/accounts/saved-consultants/", {
    method: "POST",
    body: JSON.stringify({ consultant_id: consultantId }),
  });
}

export async function removeSavedConsultant(savedId: number): Promise<void> {
  return apiRequest<void>(`/api/accounts/saved-consultants/${savedId}/`, {
    method: "DELETE",
  });
}
