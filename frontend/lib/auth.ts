import { apiRequest } from "@/lib/api/client";

export interface CurrentUser {
  id: number;
  email: string;
  role: "student" | "consultant" | "agency" | "admin";
}

export async function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/accounts/me/");
}
