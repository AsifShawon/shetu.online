import { apiRequest, apiUpload } from "./client";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone: string;
  gender: string;
  present_address: string;
  present_city: string;
  present_country: string;
  occupation: string;
  skill_languages: string;
  date_of_birth?: string | null;
  nationality: string;
  passport_or_nid: string;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  role: "student" | "consultant" | "agency" | "admin";
  account_type: "personal" | "agency";
  verification_status: "pending" | "in_progress" | "accepted" | "rejected";
  subscription_status: "none" | "pro";
  profile_completion: number;
  balance: string;
  image_url?: string | null;
  preferred_city_ids: number[];
  preferred_university_ids: number[];
  years_of_experience?: number | null;
  assessment_time_value?: number | null;
  assessment_time_unit?: string;
  assessment_types?: string[];
  is_banned: boolean;
  banned_until?: string | null;
  ban_reason?: string;
}

export interface UpdateCurrentUserPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  present_address?: string;
  present_city?: string;
  present_country?: string;
  occupation?: string;
  skill_languages?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_or_nid?: string;
  passport_issue_date?: string;
  passport_expiry_date?: string;
  image?: File | null;
  preferred_city_ids?: number[];
  preferred_university_ids?: number[];
  years_of_experience?: number | null;
  assessment_time_value?: number | null;
  assessment_time_unit?: string;
  assessment_types?: string[];
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "student" | "consultant" | "agency";
  present_country?: string;
  present_city?: string;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>("/api/auth/me/");
}

export async function loginUser(identifier: string, password: string): Promise<User> {
  return apiRequest<User>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
}

export async function adminLoginUser(email: string, password: string): Promise<User> {
  return apiRequest<User>("/api/admin/login/", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function registerStart(payload: RegisterPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/register/start/", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyOtp(email: string, code: string): Promise<User> {
  return apiRequest<User>("/api/auth/register/verify/", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
}

export async function resendOtp(email: string, purpose: "registration" | "password_reset" = "registration"): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/resend-otp/", {
    method: "POST",
    body: JSON.stringify({ email, purpose })
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/forgot-password/", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function verifyForgotPasswordOtp(email: string, code: string): Promise<{ reset_token: string }> {
  return apiRequest<{ reset_token: string }>("/api/auth/forgot-password/verify/", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/reset-password/", {
    method: "POST",
    body: JSON.stringify({ token, new_password })
  });
}

export async function changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({ old_password, new_password })
  });
}

export async function logoutUser(): Promise<void> {
  return apiRequest<void>("/api/auth/logout/", { method: "POST" });
}

export async function updateCurrentUser(payload: UpdateCurrentUserPayload): Promise<User> {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }
    formData.append(key, value);
  });

  return apiUpload<User>("/api/accounts/me/", formData, "PATCH");
}

export interface AdminInvitation {
  id: number;
  email: string;
  token: string;
  expires_at: string;
  accepted_at?: string | null;
  notes?: string;
}

export async function startAdminRegistration(payload: {
  invitation_token: string;
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  phone?: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/api/admin/register/start/", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function verifyAdminRegistration(email: string, code: string): Promise<User> {
  return apiRequest<User>("/api/admin/register/verify/", {
    method: "POST",
    body: JSON.stringify({ email, code })
  });
}
