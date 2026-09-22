"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";
import { AuthCard } from "@/components/legacy/auth-card";
import { startAdminRegistration, verifyAdminRegistration } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";

export default function AdminRegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<"start" | "verify">("start");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invitation_token: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    code: "",
  });

  const handleStart = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await startAdminRegistration({
        invitation_token: form.invitation_token,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
      });
      setStep("verify");
      showToast({
        variant: "success",
        title: "Verification sent",
        message: "Check the invited email inbox for the admin OTP.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Registration start failed",
        message: getApiErrorMessage(error, "Unable to start admin registration."),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await verifyAdminRegistration(form.email, form.code);
      await refresh();
      showToast({
        variant: "success",
        title: "Admin account ready",
        message: "The invited admin account has been activated.",
      });
      router.push("/admin" as Route);
    } catch (error) {
      showToast({
        variant: "error",
        title: "OTP verification failed",
        message: getApiErrorMessage(error, "Unable to verify the admin invitation OTP."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Admin Registration"
      subtitle="Invite-only onboarding for new admin accounts in the Shetu control center."
      image="/legacy/Frontend/assets/img/icon/login.png"
    >
      {step === "start" ? (
        <form className="space-y-4" onSubmit={handleStart}>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Invitation Token</label>
            <input className="legacy-form-field" value={form.invitation_token} onChange={(event) => setForm((current) => ({ ...current, invitation_token: event.target.value }))} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Invited Email</label>
            <input className="legacy-form-field" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">First Name</label>
              <input className="legacy-form-field" value={form.first_name} onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Last Name</label>
              <input className="legacy-form-field" value={form.last_name} onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Phone</label>
            <input className="legacy-form-field" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
            <input className="legacy-form-field" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </div>
          <button className="legacy-primary-btn w-full" disabled={loading} type="submit">
            {loading ? "Starting..." : "Send OTP"}
          </button>
          <p className="text-center text-sm text-slate-700">
            Already active?
            <Link className="ml-2 font-bold text-[var(--legacy-primary)] underline" href={"/admin/login" as Route}>
              Go to admin login
            </Link>
          </p>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleVerify}>
          <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50 px-4 py-4 text-sm leading-7 text-cyan-950">
            OTP sent to <strong>{form.email}</strong>. Enter it below to activate the admin account.
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">OTP Code</label>
            <input className="legacy-form-field" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required />
          </div>
          <button className="legacy-primary-btn w-full" disabled={loading} type="submit">
            {loading ? "Verifying..." : "Verify and finish"}
          </button>
          <button className="legacy-outline-btn w-full" disabled={loading} type="button" onClick={() => setStep("start")}>
            Back
          </button>
        </form>
      )}
    </AuthCard>
  );
}
