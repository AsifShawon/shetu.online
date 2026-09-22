"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/layout/auth-provider";

type NavItem = {
  key: "home" | "consultants" | "explore" | "requests" | "account";
  href: string;
  label: string;
  icon: string;
  matchers: string[];
};

function pathMatches(pathname: string, matchers: string[]) {
  return matchers.some((matcher) => {
    if (matcher === "/") return pathname === "/";
    return pathname === matcher || pathname.startsWith(`${matcher}/`);
  });
}

function getAccountHref(role?: "student" | "consultant" | "agency" | "admin") {
  if (role === "consultant") return "/dashboard/consultant/profile";
  if (role === "agency") return "/dashboard/agency/profile";
  if (role === "admin") return "/admin";
  if (role === "student") return "/dashboard/student/profile";
  return "/login";
}

function getRequestsHref(role?: "student" | "consultant" | "agency" | "admin") {
  if (role === "consultant") return "/dashboard/consultant/reports";
  if (role === "agency") return "/dashboard/agency/consultants";
  if (role === "student") return "/dashboard/student/posts";
  return "/student-post";
}

function getRequestMatchers(role?: "student" | "consultant" | "agency" | "admin") {
  if (role === "consultant") {
    return ["/dashboard/consultant/requests", "/dashboard/consultant/reports", "/dashboard/consultant/services"];
  }
  if (role === "agency") {
    return ["/dashboard/agency/consultants", "/dashboard/agency/services", "/dashboard/agency/transactions"];
  }
  if (role === "student") {
    return ["/student-post", "/dashboard/student/posts", "/dashboard/student/quotations", "/dashboard/student/assessments"];
  }
  return ["/student-post", "/dashboard/student/posts"];
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const items: NavItem[] = [
    {
      key: "home",
      href: "/",
      label: "Home",
      icon: "fa-house",
      matchers: ["/"],
    },
    {
      key: "consultants",
      href: "/consultants",
      label: "Consultants",
      icon: "fa-user-group",
      matchers: ["/consultants", "/consultants-profile-details-view", "/dashboard/consultants-of-eduwise"],
    },
    {
      key: "explore",
      href: "/study-abroad",
      label: "Explore",
      icon: "fa-compass",
      matchers: [
        "/study-abroad",
        "/study-abroad-query",
        "/search-consultant-country",
        "/search-consultant-service",
        "/your-search-result",
        "/your-consultants-search-result",
        "/your-selected-result",
      ],
    },
    {
      key: "requests",
      href: getRequestsHref(user?.role),
      label: user?.role === "student" ? "Posts" : "Requests",
      icon: "fa-file-lines",
      matchers: getRequestMatchers(user?.role),
    },
    {
      key: "account",
      href: getAccountHref(user?.role),
      label: user ? "Profile" : "Account",
      icon: "fa-user",
      matchers: ["/dashboard", "/login", "/register", "/otp", "/forgot-password", "/reset-password"],
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 lg:hidden"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <ul className="flex h-[68px] items-center gap-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 px-2 shadow-2xl backdrop-blur-xl">
        {items.map((item) => {
          const active = pathMatches(pathname, item.matchers);
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? "scale-105 bg-[#0B1F4D] text-white shadow-md"
                    : "text-slate-500 hover:text-[#0B1F4D]"
                }`}
              >
                <i className={`fa-solid ${item.icon} text-[15px]`} aria-hidden="true" />
                <span className="truncate leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
