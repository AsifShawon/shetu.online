"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";

import { AuthField, AuthSplitShell } from "@/components/auth/auth-split-shell";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email.trim());
      sessionStorage.setItem("reset_email", email.trim());
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}` as Route);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
            (body?.email as string[] | undefined)?.join(", ") ??
            "Unable to start the reset flow."
        );
      } else {
        setError("Unable to start the reset flow.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      mode="forgot-password"
      layout="centered"
      title="Forgot Password"
      subtitle="Enter your email and we will send a password reset OTP."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <AuthField
          icon={Mail}
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button
          type="submit"
          className="h-12 w-full rounded-[10px] bg-[#045330] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(4,83,48,0.22)] transition hover:bg-[#03462A] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Sending OTP…" : "Send Reset OTP"}
        </button>

        <p className="text-center text-sm text-[#5f6b84]">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-[#045330] transition hover:text-[#03462A] hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthSplitShell>
  );
}
