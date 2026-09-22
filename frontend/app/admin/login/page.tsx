"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { AuthCard } from "@/components/legacy/auth-card";
import { ApiError } from "@/lib/api/client";

function getHomePath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

function AdminLoginContent() {
  const { user, isLoading, adminLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(getHomePath(user.role));
  }, [isLoading, router, user]);

  const nextPath = searchParams.get("next") || "/admin";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const sessionUser = await adminLogin(email, password);
      router.push((sessionUser.role === "admin" ? nextPath : getHomePath(sessionUser.role)) as Route);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
          (body?.non_field_errors as string[])?.join(", ") ??
          "Admin sign in failed."
        );
      } else {
        setError("Admin sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Admin Sign In"
      subtitle="Access the Shetu control center for content, catalog, verification, packages, training, and transaction operations."
      image="/legacy/Frontend/assets/img/icon/login.png"
    >
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Admin Email</label>
            <input
              className="legacy-form-field"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              required
              type="email"
              value={email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
            <input
              className="legacy-form-field"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              required
              type="password"
              value={password}
            />
          </div>

          <button
            className="legacy-primary-btn w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign In To Admin"}
          </button>

          <p className="text-center text-sm text-slate-700">
            Need the public auth screen instead?
            <Link className="ml-2 font-bold text-[var(--legacy-primary)] underline" href="/login">
              Open User Login
            </Link>
          </p>

          <p className="text-center text-sm text-slate-700">
            Using an invitation token?
            <Link className="ml-2 font-bold text-[var(--legacy-primary)] underline" href={"/admin/register" as Route}>
              Register Admin
            </Link>
          </p>
        </form>
      </div>
    </AuthCard>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-slate-500">Loading admin login...</p>}>
      <AdminLoginContent />
    </Suspense>
  );
}
