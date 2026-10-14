"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { useAuth } from "@/components/layout/auth-provider";
import { updateAdminResource } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

type AdminProfilePageMode = "view" | "edit";

interface AdminProfilePageProps {
  mode: AdminProfilePageMode;
}

function getDisplayName(user: {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
}) {
  return user.full_name?.trim() || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.body && typeof error.body === "object") {
    const body = error.body as Record<string, unknown>;
    const detail = body.detail;
    if (typeof detail === "string") return detail;
    for (const value of Object.values(body)) {
      if (typeof value === "string") return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }
  return "Request failed. Please try again.";
}

export function AdminProfilePage({ mode }: AdminProfilePageProps) {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(getDisplayName(user));
    setEmail(user.email ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [imageFile]);

  const displayName = useMemo(() => (user ? getDisplayName(user) : "Admin"), [user]);
  const profileImage = previewUrl || user?.image_url || "/legacy/no-profile-img.png";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const hasFile = imageFile instanceof File;
      if (hasFile) {
        const payload = new FormData();
        payload.append("name", name);
        payload.append("email", email);
        payload.append("phone", phone);
        payload.append("role", "admin");
        payload.append("account_type", user.account_type);
        payload.append("verification_status", user.verification_status);
        payload.append("subscription_status", user.subscription_status);
        payload.append("is_active", "true");
        payload.append("is_staff", "true");
        payload.append("image", imageFile);
        if (password) {
          payload.append("password", password);
          payload.append("repassword", repassword);
        }
        await updateAdminResource("/api/admin/users/", user.id, payload);
      } else {
        await updateAdminResource("/api/admin/users/", user.id, {
          name,
          email,
          phone,
          role: "admin",
          account_type: user.account_type,
          verification_status: user.verification_status,
          subscription_status: user.subscription_status,
          is_active: true,
          is_staff: true,
          ...(password ? { password, repassword } : {}),
        });
      }

      setPassword("");
      setRepassword("");
      setImageFile(null);
      setSuccess("Profile updated successfully.");
      await refresh();
      router.push("/admin/profile" as Route);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      description={
        mode === "view"
          ? "Review the current admin account information and quick profile details."
          : "Update the admin account information, profile photo, and password."
      }
      section="verification"
      showIntro={false}
      title={mode === "view" ? "My Profile" : "Edit Profile"}
    >
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-medium text-slate-900">
              {mode === "view" ? "Admin Profile" : "Update Profile"}
            </h2>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#045330] px-4 text-sm font-medium text-[#045330] transition hover:bg-[#F1F8F4]"
              href={(mode === "view" ? "/admin/profile/edit" : "/admin/profile") as Route}
            >
              <i className={`fa-solid ${mode === "view" ? "fa-pen-to-square" : "fa-eye"}`} />
              <span>{mode === "view" ? "Edit Profile" : "View Profile"}</span>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700">{error}</div>
        ) : null}
        {success ? (
          <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">{success}</div>
        ) : null}

        {isLoading || !user ? (
          <div className="px-5 py-10 text-sm text-slate-500">Loading profile...</div>
        ) : mode === "view" ? (
          <div className="grid gap-6 p-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-col items-center px-6 py-8 text-center">
                <div className="h-[150px] w-[150px] overflow-hidden rounded-full border border-slate-300 bg-white p-1 shadow-sm">
                  <img alt={displayName} className="h-full w-full rounded-full object-cover" src={profileImage} />
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">{displayName}</h3>
                <p className="mt-1 text-sm text-slate-500">Admin</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="space-y-0">
                {[
                  ["Full Name", displayName],
                  ["Email", user.email],
                  ["Phone", user.phone || "Not provided"],
                  ["Role", "Admin"],
                  ["Verification", user.verification_status.replace(/_/g, " ")],
                  ["Subscription", user.subscription_status],
                ].map(([label, value], index) => (
                  <div
                    className={`grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_minmax(0,1fr)] ${
                      index === 0 ? "" : "border-t border-slate-200"
                    }`}
                    key={label}
                  >
                    <div className="font-semibold text-slate-800">{label}</div>
                    <div className="text-slate-600">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form className="p-5" onSubmit={handleSubmit}>
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                    Profile Information
                  </div>
                  <div className="grid gap-4 p-5">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-slate-800">Name</span>
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                        onChange={(event) => setName(event.target.value)}
                        value={name}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-slate-800">Email</span>
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        value={email}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-slate-800">Phone</span>
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                        onChange={(event) => setPhone(event.target.value)}
                        value={phone}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                    Profile Picture
                  </div>
                  <div className="grid gap-4 p-5">
                    <div className="flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50">
                      <img alt={displayName} className="h-full w-full object-cover" src={profileImage} />
                    </div>
                    <input
                      accept="image/*"
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#045330] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#03462A]"
                      onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-3 text-lg font-medium text-slate-900">
                    Update Password
                  </div>
                  <div className="grid gap-4 p-5">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-slate-800">New Password</span>
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Leave blank to keep current password"
                        type="password"
                        value={password}
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-slate-800">Confirm Password</span>
                      <input
                        className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-[#045330] focus:ring-1 focus:ring-[#045330]"
                        onChange={(event) => setRepassword(event.target.value)}
                        type="password"
                        value={repassword}
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      Leave both password fields empty if you only want to update basic information or the profile photo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                href={"/admin/profile" as Route}
              >
                <i className="fa-solid fa-reply" />
                <span>Back</span>
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[#045330] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#03462A]"
                disabled={saving}
                type="submit"
              >
                <i className="fa-solid fa-floppy-disk" />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </AdminShell>
  );
}
