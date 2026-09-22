"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Menu,
  Phone,
  Settings,
  User,
  UserPlus,
  Users,
  X,
  LogOut
} from "lucide-react";

import { publicNavigation } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const menuItems = [
    { label: "Consultants", href: "/consultants", icon: Users },
    { label: "Become Consultant", href: "/become-consultant", icon: UserPlus },
    { label: "Pricing", href: "/pricing", icon: CreditCard },
  ];

  const accountItems = [
    {
      label: "Dashboard",
      href: user?.role === "admin" ? "/admin" : `/dashboard/${user?.role || "student"}`,
      icon: LayoutDashboard,
    },
    { label: "Profile", href: "/profile", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      {/* ── Main bar ── */}
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          className="flex shrink-0 items-center gap-2 font-semibold"
          href="/"
        >
          <img
            src="/shetu_logo.jpeg"
            alt="Shetu"
            className="h-10 w-auto rounded-md object-contain"
          />
          <span className="text-base sm:text-lg font-bold text-[#0c6b41]">সেতু</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              className={cn(
                "transition-colors hover:text-foreground",
                pathname === item.href ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
              href={item.href as Route}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={user.role === "admin" ? "/admin" : `/dashboard/${user.role}`}>
                Dashboard
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile: compact auth + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {!user && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden min-[380px]:inline-flex"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80 transition-colors hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer Wrapper */}
        <div
          id="mobile-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[360px] transform rounded-l-[32px] bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <Link
                className="flex items-center gap-2 font-semibold"
                href="/"
                onClick={() => setMobileOpen(false)}
              >
                <img
                  src="/shetu_logo.jpeg"
                  alt="Shetu"
                  className="h-9 w-auto rounded-md object-contain"
                />
                <span className="text-base font-bold text-[#0c6b41]">সেতু</span>
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-6 p-4">
              {/* User mini-card */}
              {user ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
                  {(() => {
                    const userName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                            {userName[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{userName}</span>
                            <span className="text-xs text-slate-500 capitalize">{user.role}</span>
                          </div>
                        </div>
                        <Link
                          href={"/dashboard/profile/edit" as Route}
                          className="rounded-full bg-white p-2 text-slate-400 shadow-sm hover:text-primary transition-colors"
                          aria-label="Profile"
                        >
                          <User className="h-4 w-4" />
                        </Link>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="rounded-xl">
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Main navigation group */}
              <div className="space-y-3">
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Menu
                </p>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href as Route}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex h-12 items-center justify-between rounded-xl px-4 transition-all",
                          isActive
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
                          <span className="text-sm font-semibold">{item.label}</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4", isActive ? "text-white/70" : "text-slate-300")} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Account group */}
              {user && (
                <div className="space-y-3">
                  <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Account
                  </p>
                  <div className="space-y-1">
                    {accountItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href as Route}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex h-12 items-center justify-between rounded-xl px-4 transition-all",
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400")} />
                            <span className="text-sm font-semibold">{item.label}</span>
                          </div>
                          <ChevronRight className={cn("h-4 w-4", isActive ? "text-white/70" : "text-slate-300")} />
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => logout()}
                      className="flex w-full h-12 items-center justify-between rounded-xl px-4 text-rose-600 transition-all hover:bg-rose-50"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-semibold">Logout</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Contact group */}
              <div className="space-y-3">
                <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Contact
                </p>
                <div className="grid gap-2">
                  <a
                    href="tel:+1234567890"
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Us</span>
                      <span className="text-sm font-semibold text-slate-700">+123 456 7890</span>
                    </div>
                  </a>
                  <a
                    href="mailto:support@shetu.com"
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Us</span>
                      <span className="text-sm font-semibold text-slate-700">support@shetu.com</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-slate-100 p-6 text-center">
              <p className="text-sm font-bold text-slate-900">সেতু (Shetu)</p>
              <p className="text-xs text-slate-400 mt-1">
                {user ? `${`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email} • ${user.role}` : "Premium Study Abroad Platform"}
              </p>
              <p className="text-[10px] text-slate-300 mt-4 uppercase tracking-widest">
                v2.4.0 • © 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
