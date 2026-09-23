"use client";

import type { Route } from "next";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";

import { useAuth } from "@/components/layout/auth-provider";
import { ApiError } from "@/lib/api/client";
import { resendOtp, verifyOtp } from "@/lib/api/auth";

function getDashboardPath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

export default function OtpPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otpParts, setOtpParts] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  useEffect(() => {
    const stored = sessionStorage.getItem("reg_email") ?? "";
    setEmail(stored);
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, +(prev - 0.1).toFixed(2)));
    }, 100);
    return () => clearInterval(t);
  }, []);

  const timeLeftDisplay = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}.${String(Math.floor(timeLeft % 60)).padStart(2, "0")}s`;

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const digits = pastedText.replace(/\D/g, "");
    if (!digits) return;

    if (digits.length >= 4) {
      // 4-digit code: prefer populating the entire OTP from the first box
      const fourDigits = digits.slice(0, 4).split("");
      setOtpParts(fourDigits);
      setTimeout(() => {
        inputsRef.current[3]?.focus();
      }, 0);
    } else {
      // Less than 4 digits: fill logically starting from current index
      setOtpParts((prev) => {
        const next = [...prev];
        for (let i = 0; i < digits.length && index + i < 4; i++) {
          next[index + i] = digits[i];
        }
        return next;
      });
      const nextFocus = Math.min(3, index + digits.length);
      setTimeout(() => {
        inputsRef.current[nextFocus]?.focus();
      }, 0);
    }
  };

  const handlePartChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setOtpParts((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    if (digits.length >= 4) {
      const fourDigits = digits.slice(0, 4).split("");
      setOtpParts(fourDigits);
      setTimeout(() => {
        inputsRef.current[3]?.focus();
      }, 0);
      return;
    }

    let digit = digits.slice(-1);
    if (otpParts[index] && digits.length === 2) {
      const added = value.replace(otpParts[index], "").replace(/\D/g, "");
      if (added) {
        digit = added.slice(-1);
      }
    }

    setOtpParts((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 3) {
      setTimeout(() => {
        inputsRef.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handlePartKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpParts[index]) {
        e.preventDefault();
        setOtpParts((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
      } else if (index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
        setOtpParts((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    } else if (e.key === "ArrowLeft") {
      if (index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowRight") {
      if (index < 3) {
        e.preventDefault();
        inputsRef.current[index + 1]?.focus();
      }
    } else if (
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.key.length === 1 &&
      !/\d/.test(e.key)
    ) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError("Email not found. Please register again.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const code = otpParts.join("");
      if (code.length < 4) {
        setError("Please enter the 4-digit OTP.");
        setLoading(false);
        return;
      }
      const user = await verifyOtp(email, code);
      sessionStorage.removeItem("reg_email");
      await refresh();
      router.push(getDashboardPath(user.role));
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError((body?.detail as string) ?? "Invalid OTP. Please try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await resendOtp(email, "registration");
      setResent(true);
      setTimeLeft(60);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown>;
        setError(
          (body?.detail as string) ??
            (body?.non_field_errors as string[])?.join(", ") ??
            "Unable to resend OTP right now."
        );
      } else {
        setError("Unable to resend OTP right now.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100dvh-112px)] w-full flex-col items-center justify-center px-4 py-8">

      {/* Plane + loop decoration – bottom-left */}
      <div className="pointer-events-none absolute bottom-[4%] left-[4%] hidden sm:block" aria-hidden>
        <svg width="200" height="150" viewBox="0 0 200 150" fill="none">
          {/* Dashed path curving up-right */}
          <path
            d="M32 138 C44 114 62 94 84 76 C108 56 136 42 168 26"
            stroke="rgba(140,170,220,0.45)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="5 11"
          />
          {/* Circle loop */}
          <circle cx="28" cy="138" r="22" stroke="rgba(140,170,220,0.38)" strokeWidth="2" fill="none" strokeDasharray="5 11" />
        </svg>
        <Plane
          className="absolute bottom-[72px] left-[114px] h-10 w-10 -rotate-[28deg] fill-white/55 text-white/55 drop-shadow-[0_8px_18px_rgba(80,120,200,0.3)]"
          strokeWidth={1.3}
        />
      </div>

      {/* Logo */}
      <div className="mb-5 flex items-center justify-center">
        <Image
          src="/shetu_logo.jpeg"
          alt="Shetu"
          width={160}
          height={98}
          priority
          className="h-12 w-auto rounded-xl bg-white p-1.5 object-contain shadow-md"
        />
      </div>

      {/* Feedback messages */}
      {error ? (
        <div className="mb-4 w-full max-w-[460px] rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      ) : null}
      {resent ? (
        <div className="mb-4 w-full max-w-[460px] rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
          OTP resent successfully!
        </div>
      ) : null}

      <form className="w-full max-w-[460px]" onSubmit={handleSubmit}>
        {/* OTP card */}
        <div className="rounded-[22px] border border-[#c8d8ef]/60 bg-[#dbe5f2]/55 px-6 py-8 text-center shadow-[0_18px_50px_rgba(18,46,104,0.13)] backdrop-blur-sm sm:px-10">
          <h2 className="mb-8 text-[1.1rem] font-bold text-[#17264c] sm:text-[1.15rem]">
            Enter the OTP from your mail
          </h2>

          <div className="mb-5 flex items-center justify-center gap-3 sm:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`OTP digit ${i + 1}`}
                className="h-14 w-14 rounded-[10px] border border-[#cdd8eb] bg-white text-center text-2xl font-bold text-[#10245a] outline-none shadow-sm transition focus:border-[#2f61cf] focus:ring-2 focus:ring-[#dce8ff] sm:h-16 sm:w-16"
                value={otpParts[i]}
                onChange={(e) => handlePartChange(i, e.target.value)}
                onKeyDown={(e) => handlePartKeyDown(i, e)}
                onPaste={(e) => handlePaste(i, e)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          <p className="text-xs text-[#8a96a8]">
            Remaining time :{" "}
            <span className="font-medium">{timeLeftDisplay}</span>
          </p>
        </div>

        {/* Action buttons — outside card */}
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-12 flex-1 rounded-[10px] border border-[#9aa6b9] bg-white text-sm font-semibold text-[#485468] transition hover:border-[#6f819b] hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || timeLeft <= 0}
            className="h-12 flex-1 rounded-[10px] bg-[#0f255f] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,37,95,0.22)] transition hover:bg-[#142d72] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>

        {/* Resend */}
        <p className="mt-4 text-center text-sm text-[#666f85]">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="ml-1 font-bold text-[#10245a] transition hover:underline disabled:opacity-60"
          >
            {resending ? "Resending…" : "Resend"}
          </button>
        </p>
      </form>
    </section>
  );
}
