"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { adminSidebarItems, type AdminSectionKey, type AdminSidebarItem } from "@/lib/admin-config";

function getRoleHome(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

interface AdminShellProps extends PropsWithChildren {
  section: AdminSectionKey;
  title: string;
  description: string;
  resourceKey?: string;
  showIntro?: boolean;
}

function itemMatches(item: AdminSidebarItem, section: AdminSectionKey, resourceKey?: string): boolean {
  if (item.children?.length) {
    return item.children.some((child) => itemMatches(child, section, resourceKey));
  }

  if (item.section !== section) return false;
  if (!item.resourceKey) return !resourceKey;
  return item.resourceKey === resourceKey;
}

function getDisplayName(user: {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
}) {
  return user.full_name?.trim() || `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
}

export function AdminShell({ section, title, description, resourceKey, showIntro = true, children }: AdminShellProps) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [groupState, setGroupState] = useState<Record<string, boolean>>({});
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const nextPath = pathname || "/admin";
      router.replace(`/admin/login?next=${encodeURIComponent(nextPath)}` as Route);
      return;
    }

    if (user.role !== "admin") {
      router.replace(getRoleHome(user.role));
    }
  }, [isLoading, pathname, router, user]);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [pathname, resourceKey]);

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#edf1f7] px-6 text-slate-700">
        <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Shetu Admin</p>
          <p className="mt-3 text-lg font-bold text-slate-900">Preparing dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(user);
  const profileImage = user.image_url || "/legacy/no-profile-img.png";

  const renderSidebarItem = (item: AdminSidebarItem) => {
    const active = itemMatches(item, section, resourceKey);
    const hasChildren = Boolean(item.children?.length);
    const isOpen = hasChildren ? (groupState[item.key] ?? active) : false;

    if (hasChildren && item.children) {
      return (
        <li className="nav-item" key={item.key}>
          <button
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[15px] transition ${
              active ? "bg-[#1f8bff] text-white" : "text-slate-200 hover:bg-white/10"
            }`}
            onClick={() => {
              if (sidebarCollapsed) {
                setSidebarCollapsed(false);
                return;
              }
              setGroupState((current) => ({
                ...current,
                [item.key]: !(current[item.key] ?? active),
              }));
            }}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-3">
              <i className={`fa-solid ${item.icon} w-4 text-center`} />
              {!sidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
            </span>
            {!sidebarCollapsed ? <i className={`fa-solid fa-angle-${isOpen ? "down" : "right"} text-xs`} /> : null}
          </button>
          {!sidebarCollapsed && isOpen ? (
            <ul className="mt-1 space-y-1 pl-2">
              {item.children.map((child) => {
                const childActive = itemMatches(child, section, resourceKey);
                return (
                  <li key={child.key}>
                    <Link
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition ${
                        childActive ? "bg-white text-[#1f8bff]" : "text-slate-300 hover:bg-white/10"
                      }`}
                      href={(child.href ?? "/admin") as Route}
                    >
                      <i className={`fa-solid ${child.icon} w-4 text-center`} />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </li>
      );
    }

    return (
      <li className="nav-item" key={item.key}>
        <Link
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-[15px] transition ${
            active ? "bg-[#1f8bff] text-white" : "text-slate-200 hover:bg-white/10"
          }`}
          href={(item.href ?? "/admin") as Route}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <i className={`fa-solid ${item.icon} w-4 text-center`} />
          {!sidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] text-slate-800">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-700 bg-[#343a40] text-white shadow-xl transition-all duration-300 ${
          sidebarCollapsed ? "w-[74px]" : "w-[250px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <Link
          className="flex min-h-[72px] items-center gap-3 border-b border-slate-600 px-4 text-white"
          href="/admin"
        >
          <img src="/shetu_logo.jpeg" alt="Shetu" className="h-9 w-auto rounded-md bg-white p-0.5 object-contain" />
          {!sidebarCollapsed ? <span className="truncate text-[15px] font-semibold tracking-wide">সেতু (Shetu)</span> : null}
        </Link>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">{adminSidebarItems.map(renderSidebarItem)}</ul>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[74px]" : "lg:pl-[250px]"}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex min-h-[58px] items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                type="button"
              >
                <i className="fa-solid fa-bars" />
              </button>
              <button
                className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:inline-flex"
                onClick={() => setSidebarCollapsed((current) => !current)}
                type="button"
              >
                <i className="fa-solid fa-bars" />
              </button>
              <Link
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#17a2b8] text-white"
                href="/"
                target="_blank"
              >
                <i className="fa-solid fa-eye" />
              </Link>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                aria-expanded={profileOpen}
                aria-label="Toggle profile menu"
                className="flex items-center gap-3 rounded-full p-1 transition hover:bg-slate-100"
                onClick={() => setProfileOpen((current) => !current)}
                type="button"
              >
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold text-slate-800">{displayName}</span>
                  <span className="block text-xs text-slate-500">{user.email}</span>
                </span>
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                  <img alt={displayName} className="h-full w-full object-cover" src={profileImage} />
                </span>
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-3 w-[290px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <div className="flex flex-col items-center gap-3 px-5 py-6">
                    <div className="h-[102px] w-[102px] overflow-hidden rounded-full border border-slate-300 bg-white p-1">
                      <img alt={displayName} className="h-full w-full rounded-full object-cover" src={profileImage} />
                    </div>
                    <p className="text-[15px] font-medium text-slate-900">{displayName}</p>
                  </div>
                  <div className="border-t border-slate-200">
                    <Link
                      className="flex items-center justify-between px-5 py-4 text-[15px] text-slate-800 transition hover:bg-slate-50"
                      href={"/admin/profile" as Route}
                    >
                      <span>My Profile</span>
                      <i className="fa-solid fa-angle-right text-sm text-slate-700" />
                    </Link>
                  </div>
                  <div className="border-t border-slate-200">
                    <Link
                      className="flex items-center justify-between px-5 py-4 text-[15px] text-slate-800 transition hover:bg-slate-50"
                      href={"/admin/profile/edit" as Route}
                    >
                      <span>Edit Profile</span>
                      <i className="fa-solid fa-angle-right text-sm text-slate-700" />
                    </Link>
                  </div>
                  <div className="border-t border-slate-200">
                    <button
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] text-slate-800 transition hover:bg-slate-50"
                      onClick={() => logout()}
                      type="button"
                    >
                      <span>Logout</span>
                      <i className="fa-solid fa-angle-right text-sm text-slate-700" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-58px)] flex-1 flex-col">
          <main className="flex-1 px-4 py-6 sm:px-6">
            {showIntro ? (
              <section className="mb-5 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Panel</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
              </section>
            ) : null}
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                <strong>Copyright &copy; 2024-2025 Work With Mahadi.</strong> All rights reserved.
              </p>
              <p>
                <strong>Version</strong> 1.0
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
