import type { ComponentPropsWithoutRef, ComponentType, PropsWithChildren, ReactNode } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Cloud, GraduationCap, Plane } from "lucide-react";

import { cn } from "@/lib/utils";

export type AuthMode = "login" | "register" | "otp" | "forgot-password" | "reset-password";

type AuthSplitShellProps = PropsWithChildren<{
  mode: AuthMode;
  title: string;
  subtitle?: string;
  layout?: "split" | "centered";
}>;

type AuthFieldProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  icon: ComponentType<{ className?: string }>;
  endAdornment?: ReactNode;
};

const authTabs: Array<{ href: Route; label: string; mode: AuthMode }> = [
  { href: "/login", label: "Log In", mode: "login" },
  { href: "/register", label: "Sign Up", mode: "register" }
];

export function AuthBrand({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <div className={cn("flex items-center justify-center", tone === "light" ? "text-white" : "text-[#045330]")}>
      <Image
        src={tone === "light" ? "/shetu_logo.jpeg" : "/shetu_logo_transparent.png"}
        alt="Shetu"
        width={160}
        height={98}
        priority={tone === "light"}
        className={cn(
          "h-12 w-auto object-contain",
          tone === "light" ? "rounded-xl bg-white p-1.5 shadow-md" : ""
        )}
      />
    </div>
  );
}

function AuthTabs({ mode, tone = "light" }: { mode: AuthMode; tone?: "light" | "dark" }) {
  return (
    <nav
      className={cn(
        "inline-flex rounded-full p-1 backdrop-blur-sm",
        tone === "light"
          ? "border border-white/20 bg-white/10"
          : "border border-[#c8ded0] bg-[#F1F8F4]"
      )}
    >
      {authTabs.map((tab) => {
        const isActive = tab.mode === mode;

        return (
          <Link
            key={tab.mode}
            href={tab.href}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200",
              isActive
                ? tone === "light"
                  ? "bg-white text-[#045330] shadow-[0_12px_30px_rgba(255,255,255,0.24)]"
                  : "bg-[#045330] text-white shadow-[0_8px_20px_rgba(4,83,48,0.2)]"
                : tone === "light"
                  ? "text-white/80 hover:text-white"
                  : "text-slate-600 hover:text-[#045330]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AuthArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* SVG: dashed flight path + circle loop at bottom-left */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 420 640"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Soft glow halo behind the plane (~86%, ~40% of panel) */}
        <circle cx="358" cy="254" r="38" fill="rgba(255,255,255,0.07)" />

        {/* Main dashed flight path — from loop up to plane position */}
        <path
          d="M90 536 C100 500 118 468 146 443 C176 416 210 402 246 389 C284 375 318 368 346 347 C368 329 380 298 378 262"
          stroke="rgba(255,255,255,0.82)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="5 13"
        />

        {/* Circle loop at bottom-left */}
        <circle
          cx="75"
          cy="536"
          r="46"
          stroke="rgba(255,255,255,0.64)"
          strokeWidth="2.1"
          strokeDasharray="5 13"
          fill="none"
        />
      </svg>

      {/* Left cloud */}
      <Cloud
        className="absolute left-[10%] top-[44%] h-12 w-12 fill-white text-white drop-shadow-[0_10px_22px_rgba(7,20,56,0.24)]"
        strokeWidth={1.4}
      />

      {/* Right cloud — smaller */}
      <Cloud
        className="absolute right-[11%] top-[61%] h-8 w-8 fill-white text-white drop-shadow-[0_8px_18px_rgba(7,20,56,0.22)]"
        strokeWidth={1.4}
      />

      {/* Plane — larger, bright glow */}
      <div className="absolute right-[12%] top-[35%]">
        {/* Outer glow ring */}
        <div className="absolute inset-0 -m-4 rounded-full bg-white/10 blur-xl" />
        <Plane
          className="relative h-16 w-16 -rotate-[14deg] fill-white text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.55)]"
          strokeWidth={1.3}
        />
      </div>
    </div>
  );
}

function AuthFooter() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-[#667595] sm:text-sm">
      <span>Shetu</span>
      <span className="hidden sm:inline">•</span>
      <Link href={"/eduwise-terms-and-condition" as Route} className="transition hover:text-[#045330] hover:underline">
        Terms
      </Link>
      <span className="hidden sm:inline">•</span>
      <Link href="/login" className="transition hover:text-[#045330] hover:underline">
        Login
      </Link>
      <span className="hidden sm:inline">•</span>
      <Link href="/register" className="transition hover:text-[#045330] hover:underline">
        Sign up
      </Link>
    </div>
  );
}

function HeroPanel({ mode }: { mode: AuthMode }) {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-[24px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] lg:min-h-full">
      <Image
        src="/legacy/Frontend/assets/img/page/sign_in_up_left.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 45vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,53,31,0.88)_0%,rgba(4,83,48,0.76)_45%,rgba(2,53,31,0.85)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(221,239,229,0.25),transparent_24%),radial-gradient(circle_at_22%_80%,rgba(4,83,48,0.3),transparent_28%)]" />
      <div className="relative z-10 flex h-full flex-col items-center px-8 py-11 text-center">
        <AuthBrand />
        <div className="mt-8">
          <AuthTabs mode={mode} />
        </div>
        <p className="mt-12 max-w-[18rem] text-[0.95rem] leading-7 text-white/84">
          To get complete guideline to your study abroad successfully create an account or log in.
        </p>
      </div>
      <AuthArtwork />
    </div>
  );
}

function CenteredShell({ title, subtitle, children }: Omit<AuthSplitShellProps, "mode" | "layout">) {
  return (
    <section className="v3-auth-shell flex min-h-[calc(100dvh-112px)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5">
        <AuthBrand tone="dark" />
        <div className="w-full rounded-[24px] border border-[#c8ded0] bg-white/90 px-5 py-8 shadow-[0_28px_90px_rgba(4,83,48,0.12)] backdrop-blur-md sm:px-8 sm:py-10">
          {title ? (
            <header className="mb-6 text-center">
              <h1 className="text-[1.7rem] font-bold tracking-[-0.02em] text-[#045330] sm:text-[2rem]">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm leading-6 text-[#667595]">{subtitle}</p> : null}
            </header>
          ) : null}
          {children}
        </div>
        <AuthFooter />
      </div>
    </section>
  );
}

export function AuthSplitShell({ mode, title, subtitle, children, layout = "split" }: AuthSplitShellProps) {
  if (layout === "centered") {
    return (
      <CenteredShell title={title} subtitle={subtitle}>
        {children}
      </CenteredShell>
    );
  }

  return (
    <section className="v3-auth-shell flex min-h-[calc(100dvh-112px)] w-full items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1216px]">
        <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/88 p-3 shadow-[0_28px_90px_rgba(4,83,48,0.12)] backdrop-blur-md md:p-4">
          <div className="grid min-h-[640px] gap-4 lg:grid-cols-[minmax(0,1.07fr)_minmax(0,1fr)] lg:min-h-[640px]">
            <div className="hidden lg:block">
              <HeroPanel mode={mode} />
            </div>
            <div className="flex min-w-0 items-center justify-center rounded-[26px] bg-white px-5 py-8 sm:px-10 md:px-12 md:py-10 lg:px-14">
              <div className="flex w-full max-w-[380px] flex-col justify-center">
                <div className="mb-8 flex flex-col items-center gap-6 text-center lg:hidden">
                  <AuthBrand tone="dark" />
                  <AuthTabs mode={mode} tone="dark" />
                </div>
                <header className="text-center">
                  <h1 className="text-[1.95rem] font-semibold tracking-[-0.03em] text-[#045330] md:text-[2.2rem]">
                    {title}
                  </h1>
                  {subtitle ? <p className="mt-2 text-sm leading-6 text-[#667595]">{subtitle}</p> : null}
                </header>
                <div className="mt-8">{children}</div>
              </div>
            </div>
          </div>
        </div>
        <AuthFooter />
      </div>
    </section>
  );
}

export function AuthField({ icon: Icon, endAdornment, className, ...props }: AuthFieldProps) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
      <input
        className={cn(
          "h-12 w-full rounded-[12px] border border-[#c8ded0] bg-white pl-11 pr-4 text-sm text-[#0B1F16] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#045330] focus:ring-4 focus:ring-[#DDEFE5]",
          endAdornment ? "pr-12" : "",
          className
        )}
        {...props}
      />
      {endAdornment ? (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-[#8993a8]">
          {endAdornment}
        </div>
      ) : null}
    </div>
  );
}
