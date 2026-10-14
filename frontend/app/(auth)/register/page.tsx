"use client";

import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, User } from "lucide-react";

import { AuthField, AuthSplitShell } from "@/components/auth/auth-split-shell";
import { useAuth } from "@/components/layout/auth-provider";
import { ApiError } from "@/lib/api/client";
import { registerStart } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const roles = ["Student", "Consultant", "Agency"] as const;

function getRoleFromParam(value: string | null): (typeof roles)[number] | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "student") return "Student";
  if (normalized === "consultant") return "Consultant";
  if (normalized === "agency") return "Agency";

  return null;
}

function splitFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function getDashboardPath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

function RegisterPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<(typeof roles)[number]>(() => getRoleFromParam(searchParams.get("role")) ?? "Student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const nextRole = getRoleFromParam(searchParams.get("role"));
    if (nextRole) {
      setRole(nextRole);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(getDashboardPath(user.role));
  }, [isLoading, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const { firstName, lastName } = splitFullName(fullName);

    if (!firstName) {
      setError("Please enter your name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerStart({
        email: email.trim(),
        password,
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        role: role.toLowerCase() as "student" | "consultant" | "agency",
        present_country: "",
        present_city: ""
      });
      sessionStorage.setItem("reg_email", email.trim());
      sessionStorage.setItem("reg_purpose", "registration");
      router.push("/otp" as Route);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        const messages = Object.values(body).flat().join(", ");
        setError(messages || "Registration failed. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitShell
      mode="register"
      title="Create an Account"
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Role selector */}
        <div className="flex items-center justify-center gap-5 pb-1">
          {roles.map((item) => {
            const checked = role === item;

            return (
              <label
                key={item}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border-b-2 pb-1 text-[0.95rem] font-medium transition",
                  checked
                    ? "border-[#045330] text-[#045330]"
                    : "border-transparent text-[#5f6b84] hover:text-[#045330]"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={item}
                  checked={checked}
                  onChange={() => setRole(item)}
                  className="h-3.5 w-3.5 accent-[#045330]"
                />
                <span>{item}</span>
              </label>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <AuthField
          icon={User}
          placeholder="Write your name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />

        <AuthField
          icon={Phone}
          type="tel"
          placeholder="Phone number"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />

        <AuthField
          icon={Mail}
          type="email"
          placeholder="Write your email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <AuthField
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-full p-0.5 transition hover:text-[#045330]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
            </button>
          }
        />

        <AuthField
          icon={LockKeyhole}
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-type Password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="rounded-full p-0.5 transition hover:text-[#045330]"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-[10px] bg-[#045330] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(4,83,48,0.22)] transition hover:bg-[#03462A] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </AuthSplitShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSplitShell mode="register" title="Create an Account" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
