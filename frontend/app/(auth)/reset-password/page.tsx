"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { AuthField, AuthSplitShell } from "@/components/auth/auth-split-shell";
import { resendOtp, resetPassword, verifyForgotPasswordOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function ResetPasswordContent() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const resolvedEmail = query.get("email") ?? sessionStorage.getItem("reset_email") ?? "";
    setEmail(resolvedEmail);
  }, []);

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await verifyForgotPasswordOtp(email.trim(), otp.trim());
      setToken(result.reset_token);
      setMessage("OTP verified. Set your new password below.");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
            (body?.non_field_errors as string[] | undefined)?.join(", ") ??
            "Invalid OTP."
        );
      } else {
        setError("Invalid OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await resetPassword(token, password);
      sessionStorage.removeItem("reset_email");
      setMessage("Password reset successful. You can log in now.");
      setToken("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        const messages = Object.values(body).flat().filter(Boolean).join(", ");
        setError(messages || "Unable to reset password.");
      } else {
        setError("Unable to reset password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError("");
    setMessage("");
    try {
      await resendOtp(email.trim(), "password_reset");
      setMessage("A new reset OTP has been sent.");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
            (body?.non_field_errors as string[] | undefined)?.join(", ") ??
            "Unable to resend OTP."
        );
      } else {
        setError("Unable to resend OTP.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthSplitShell
      mode="reset-password"
      layout="centered"
      title="Reset Password"
      subtitle="Verify the OTP sent to your email, then set a new password."
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        ) : null}

        {!token ? (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <AuthField
              icon={Mail}
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="h-12 w-full rounded-[12px] border border-[#93a9d7] bg-white px-4 text-center text-lg font-semibold tracking-[0.35em] text-[#17264c] outline-none transition duration-200 placeholder:text-center placeholder:tracking-[0.08em] focus:border-[#2f61cf] focus:ring-4 focus:ring-[#dce8ff]"
              type="text"
              placeholder="Enter OTP"
              required
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            />
            <button
              type="submit"
              className="h-12 w-full rounded-[10px] bg-[#0c245f] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(12,36,95,0.18)] transition hover:bg-[#132f73] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              type="button"
              className="h-12 w-full rounded-[10px] border border-[#cad8f4] bg-white text-sm font-semibold text-[#17337d] transition hover:border-[#9fb4df] hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Resending…" : "Resend OTP"}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <AuthField
              icon={LockKeyhole}
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-full p-0.5 transition hover:text-[#10245a]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                </button>
              }
            />
            <AuthField
              icon={LockKeyhole}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="rounded-full p-0.5 transition hover:text-[#10245a]"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                </button>
              }
            />
            <button
              type="submit"
              className="h-12 w-full rounded-[10px] bg-[#0c245f] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(12,36,95,0.18)] transition hover:bg-[#132f73] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[#5f6b84]">
          <Link href="/login" className="font-semibold text-[#10245a] transition hover:underline">
            ← Back to Login
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
