"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { AuthField, AuthSplitShell } from "@/components/auth/auth-split-shell";
import { useAuth } from "@/components/layout/auth-provider";
import { ApiError } from "@/lib/api/client";

function getDashboardPath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(getDashboardPath(user.role));
  }, [isLoading, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(identifier.trim(), password);
      router.push(getDashboardPath(user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
            (body?.non_field_errors as string[])?.join(", ") ??
            "Invalid credentials. Please try again."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      mode="login"
      title="Log In"
      subtitle="log in with your email & password"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <AuthField
          icon={Mail}
          placeholder="Email or phone"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />

        <AuthField
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-full p-0.5 transition hover:text-[#10245a]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-[10px] bg-[#0c245f] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(12,36,95,0.18)] transition hover:bg-[#132f73] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Logging In..." : "Log In"}
        </button>

        <p className="pt-1 text-center text-sm text-[#5f6b84]">
          <Link href="/forgot-password" className="transition hover:text-[#10245a] hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-[#5f6b84]">
          Don&apos;t have account?
          <Link href="/register" className="ml-2 font-semibold text-[#10245a] transition hover:underline">
            Create
          </Link>
        </p>
      </form>
    </AuthSplitShell>
  );
}
