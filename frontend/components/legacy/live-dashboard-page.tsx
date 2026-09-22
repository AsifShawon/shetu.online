"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useLang } from "@/components/layout/lang-provider";
import { NotificationMenu } from "@/components/layout/notification-menu";
import { cn } from "@/lib/utils";
import { getAssessments } from "@/lib/api/assessments";
import { getConsultantDashboardSummary } from "@/lib/api/consultants";
import type { TranslationKey } from "@/lib/i18n";
import { getQuotations } from "@/lib/api/marketplace";
import { getWalletTransactions } from "@/lib/api/payments";
import type { DashboardRole, DashboardSection, AdminSection } from "@/lib/legacy-dashboard-data";
import { roleConfigs, adminNavigation } from "@/lib/legacy-dashboard-data";

function computeBalance(txns: Array<{ amount: string; transaction_type: string }>): string {
  const total = txns.reduce((sum, t) => {
    const amount = parseFloat(t.amount) || 0;
    return t.transaction_type === "cash_in" ? sum + amount : sum - amount;
  }, 0);
  return total.toLocaleString();
}

// Nav icon map
const NAV_ICONS: Record<string, string> = {
  overview: "fa-solid fa-gauge-high",
  choices: "fa-solid fa-bars-staggered",
  profile: "fa-solid fa-award",
  assessments: "fa-solid fa-file-circle-check",
  education: "fa-solid fa-graduation-cap",
  experience: "fa-solid fa-briefcase",
  requests: "fa-solid fa-inbox",
  wallet: "fa-solid fa-wallet",
  quotations: "fa-solid fa-file-invoice-dollar",
  saved: "fa-regular fa-bookmark",
  services: "fa-solid fa-gears",
  consultants: "fa-solid fa-user-tie",
  posts: "fa-solid fa-layer-group",
  balance: "fa-solid fa-wallet",
  reports: "fa-solid fa-file-lines",
  reviews: "fa-solid fa-star",
  training: "fa-solid fa-graduation-cap",
  countries: "fa-solid fa-earth-americas",
  gallery: "fa-solid fa-images",
  transactions: "fa-solid fa-arrow-right-arrow-left",
  // admin
  content: "fa-solid fa-sliders",
  catalog: "fa-solid fa-book-open",
  packages: "fa-solid fa-box",
  verification: "fa-solid fa-shield-halved",
};

const DASHBOARD_BY_ROLE = {
  student: "/dashboard/student",
  consultant: "/dashboard/consultant",
  agency: "/dashboard/agency",
  admin: "/admin",
} as const;

const PROFILE_BY_ROLE = {
  student: "/dashboard/student/profile",
  consultant: "/dashboard/consultant/profile",
  agency: "/dashboard/agency/profile",
  admin: "/admin",
} as const;

const STUDENT_ACTION_LABELS = {
  "/dashboard/student/last-education": "dash_last_education",
  "/dashboard/student/choices/create": "dash_choice_create",
  "/dashboard/consultants-of-eduwise": "dash_send_request",
  "/dashboard/student/assessments": "dash_get_assessment",
} as const;

const CONSULTANT_ACTION_LABELS: Partial<Record<string, TranslationKey>> = {
  "/dashboard/consultant/services": "dash_create_service",
  "/dashboard/consultant/services/create": "dash_create_service",
  "/dashboard/consultant/education": "dash_my_education",
  "/dashboard/consultant/experience": "dash_work_experience",
  "/dashboard/consultant/requests": "dash_request",
};

const DASHBOARD_NAV_LABELS: Partial<Record<DashboardRole, Partial<Record<DashboardSection, TranslationKey>>>> = {
  student: {
    overview: "dash_dashboard",
    profile: "dash_edit_profile",
    choices: "dash_your_choice",
    assessments: "dash_service_request",
    wallet: "dash_balance",
    posts: "dash_your_post",
    quotations: "dash_quotations",
  },
  consultant: {
    overview: "dash_dashboard",
    services: "dash_my_service",
    requests: "dash_transactions",
    balance: "dash_balance",
    reviews: "dash_reviews",
    reports: "dash_reports",
    education: "dash_my_education",
    training: "dash_my_training",
    profile: "dash_edit_profile",
    experience: "dash_work_experience",
  },
};

const DASHBOARD_SUMMARY_LABELS: Partial<Record<DashboardRole, Partial<Record<string, TranslationKey>>>> = {
  student: {
    "Total Request": "dash_total_request",
    "Complete Request": "dash_completed_request",
    "Active Consultants": "dash_active_consultants",
    "Total Revised": "dash_total_revised",
  },
  consultant: {
    Earnings: "dash_earnings",
    "Total Request": "dash_total_request",
    Completed: "dash_completed",
    Reviews: "dash_reviews",
  },
};

const CONSULTANT_NAV_ICONS: Partial<Record<DashboardSection, string>> = {
  overview: "fa-regular fa-circle-play",
  services: "fa-solid fa-rectangle-list",
  saved: "fa-regular fa-bookmark",
  education: "fa-solid fa-graduation-cap",
  requests: "fa-solid fa-arrows-left-right",
  experience: "fa-solid fa-chart-column",
  reports: "fa-regular fa-clipboard",
  balance: "fa-solid fa-wallet",
  reviews: "fa-regular fa-star",
  training: "fa-solid fa-graduation-cap",
  profile: "fa-regular fa-pen-to-square",
};

interface DashboardShellProps {
  role: DashboardRole | "admin";
  section: DashboardSection | AdminSection;
  children: React.ReactNode;
}

export function DashboardShell({ role, section, children }: DashboardShellProps) {
  const { user, isLoading, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const menuToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const sidebarCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [consultantHeroStats, setConsultantHeroStats] = useState<Record<string, string> | null>(null);
  const [studentHeroStats, setStudentHeroStats] = useState<Record<string, string> | null>(null);
  const [studentAssessmentCount, setStudentAssessmentCount] = useState("0");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const expectedRole = role === "admin" ? "admin" : role;
  const hasMatchedRole = user?.role === expectedRole;

  // Restore sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ew_sidebar_collapsed");
      if (stored === "true") setSidebarCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const nextPath = pathname || "/";
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    if (!hasMatchedRole) {
      const fallback = DASHBOARD_BY_ROLE[user.role];
      router.replace(fallback);
    }
  }, [hasMatchedRole, isLoading, pathname, router, user]);

  useEffect(() => {
    if (!isLoading && user && hasMatchedRole) {
      getWalletTransactions()
        .then((txns) => setBalance(computeBalance(txns)))
        .catch(() => null);
    }
  }, [hasMatchedRole, isLoading, user]);

  useEffect(() => {
    if (!isLoading && user && hasMatchedRole && role === "consultant") {
      getConsultantDashboardSummary()
        .then((summary) => {
          setConsultantHeroStats({
            Earnings: `৳ ${Number(summary.stats.total_earnings || 0).toLocaleString()}`,
            "Total Request": String(summary.stats.total_requests),
            Completed: String(summary.stats.completed_requests),
            Reviews: String(summary.stats.total_reviews),
          });
        })
        .catch(() => setConsultantHeroStats(null));
    }
  }, [hasMatchedRole, isLoading, role, user]);

  useEffect(() => {
    if (!isLoading && user && hasMatchedRole && role === "student") {
      Promise.all([getAssessments(), getQuotations()])
        .then(([assessments, quotations]) => {
          const completedCount = assessments.filter((item) =>
            ["approved", "completed"].includes(item.status),
          ).length;
          const revisedCount = assessments.filter((item) => item.status === "revision_requested").length;
          const activeConsultants = new Set(
            quotations.map((item) => item.consultant_name).filter((name): name is string => Boolean(name)),
          ).size;

          setStudentAssessmentCount(String(assessments.length));
          setStudentHeroStats({
            "Total Request": String(assessments.length),
            "Complete Request": String(completedCount),
            "Active Consultants": String(activeConsultants),
            "Total Revised": String(revisedCount),
          });
        })
        .catch(() => {
          setStudentAssessmentCount("0");
          setStudentHeroStats(null);
        });
    }
  }, [hasMatchedRole, isLoading, role, user]);

  useEffect(() => {
    setProfileOpen(false);
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      const target = event.target as Node;
      if (!userMenuRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const closeSidebarDrawer = useCallback((restoreFocus = true) => {
    setSidebarOpen(false);
    if (restoreFocus) {
      menuToggleButtonRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSidebarDrawer();
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [closeSidebarDrawer, sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const bodyStyle = document.body.style;
    const previousOverflow = bodyStyle.overflow;
    const previousPaddingRight = bodyStyle.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    bodyStyle.overflow = "hidden";
    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      bodyStyle.overflow = previousOverflow;
      bodyStyle.paddingRight = previousPaddingRight;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;
    sidebarCloseButtonRef.current?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const syncSidebarMode = () => {
      if (mediaQuery.matches) {
        setSidebarCollapsed(false);
      }
    };

    syncSidebarMode();
    mediaQuery.addEventListener("change", syncSidebarMode);
    return () => mediaQuery.removeEventListener("change", syncSidebarMode);
  }, []);

  if (isLoading || !user || !hasMatchedRole) {
    return (
      <div className="ew-shell">
        <div className="ew-main">
          <div className="ew-content">
            <div className="ew-loading-state">
              <div className="ew-loading-spinner" aria-label="Loading" />
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : "…";

  const config = role !== "admin" ? roleConfigs[role as DashboardRole] : null;
  const nav = config?.nav ?? adminNavigation;
  const logo = config?.logo ?? "/shetu_logo.jpeg";
  const accentClass = config !== null ? config.accentClass : "admin";
  const summary = config?.summary ?? [];
  const resolvedSummary =
    role === "student" && studentHeroStats
      ? [
        { label: "Total Request", value: studentHeroStats["Total Request"] ?? "0", icon: "/legacy/Frontend/assets/icons/file.png" },
        { label: "Complete Request", value: studentHeroStats["Complete Request"] ?? "0", icon: "/legacy/Frontend/assets/icons/healthy.png" },
        { label: "Active Consultants", value: studentHeroStats["Active Consultants"] ?? "0", icon: "/legacy/Frontend/assets/icons/check.png" },
        { label: "Total Revised", value: studentHeroStats["Total Revised"] ?? "0", icon: "/legacy/Frontend/assets/icons/filePending.png" },
      ]
      : role === "consultant" && consultantHeroStats
        ? summary.map((item) => ({
          ...item,
          value: consultantHeroStats[item.label] ?? item.value,
        }))
        : summary;
  const localizedSummary = resolvedSummary.map((item) => ({
    ...item,
    displayLabel:
      role !== "admin" && DASHBOARD_SUMMARY_LABELS[role]?.[item.label]
        ? t(DASHBOARD_SUMMARY_LABELS[role]?.[item.label] as TranslationKey)
        : item.label,
  }));
  const actions = config?.actions ?? [];
  const localizedActions = actions.map((item) => ({
    ...item,
    displayLabel:
      role === "student" && item.href in STUDENT_ACTION_LABELS
        ? t(STUDENT_ACTION_LABELS[item.href as keyof typeof STUDENT_ACTION_LABELS])
        : role === "consultant" && CONSULTANT_ACTION_LABELS[item.href]
          ? t(CONSULTANT_ACTION_LABELS[item.href] as TranslationKey)
          : item.label,
  }));
  const localizedNav = nav.map((item) => ({
    ...item,
    displayLabel:
      role !== "admin" && DASHBOARD_NAV_LABELS[role]?.[item.key as DashboardSection]
        ? t(DASHBOARD_NAV_LABELS[role]?.[item.key as DashboardSection] as TranslationKey)
        : item.label,
    iconClass:
      role === "consultant" && CONSULTANT_NAV_ICONS[item.key as DashboardSection]
        ? CONSULTANT_NAV_ICONS[item.key as DashboardSection]
        : NAV_ICONS[item.key] ?? "bx bx-circle",
  }));

  const dashboardTitle =
    role === "student" ? t("dash_student_dashboard") :
      role === "consultant" ? t("dash_consultant_dashboard") :
        role === "agency" ? t("dash_agency_dashboard") :
          "Admin Dashboard";

  const isVerified = user?.verification_status === "accepted";
  const isPro = user?.subscription_status === "pro";
  const profilePath = PROFILE_BY_ROLE[user.role];
  const verificationLabel = t(isVerified ? "dash_verified" : "dash_not_verified");
  const balanceLabel = t("dash_balance_label");
  const editProfileLabel = t("dash_edit_profile");
  const proLabel = t("dash_pro");
  const goPremiumLabel = t("dash_go_premium");
  const requestLabel = t("dash_requests");
  const consultantRequestCount = consultantHeroStats?.["Total Request"] ?? "0";
  const completion = user?.profile_completion ?? 0;
  const consultantTopbarActions = role === "consultant"
    ? [
      {
        href: "/dashboard/consultant/services/create" as Route,
        displayLabel: t("dash_create_service"),
        iconClass: "fa-regular fa-pen-to-square",
      },
      {
        href: "/dashboard/consultant/requests" as Route,
        displayLabel: `${consultantRequestCount} ${requestLabel}`,
        iconClass: "fa-regular fa-copy",
      },
    ]
    : [];
  const studentTopbarActions = role === "student"
    ? [
      {
        href: "/dashboard/student/choices/create" as Route,
        displayLabel: t("dash_choice_create"),
        iconClass: "fa-solid fa-pen-to-square",
      },
      {
        href: "/dashboard/student/assessments" as Route,
        displayLabel: `${studentAssessmentCount} ${t(Number(studentAssessmentCount) === 1 ? "dash_assessment" : "dash_assessments")}`,
        iconClass: "fa-solid fa-file-lines",
      },
    ]
    : [];

  const toggleSidebarDrawer = () => {
    setSidebarOpen((value) => !value);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem("ew_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const quickActions = role === "student" ? studentTopbarActions : consultantTopbarActions;
  const walletHref = role === "consultant"
    ? "/dashboard/consultant/balance" as Route
    : "/dashboard/student/wallet" as Route;

  return (
    <div
      className={cn(
        "ew-shell",
        sidebarCollapsed ? "ew-shell--collapsed" : "",
        `ew-shell--${role}`
      )}
    >
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <button
          type="button"
          className="ew-overlay"
          onClick={() => closeSidebarDrawer()}
          aria-label="Close menu"
        />
      )}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        id="ew-sidebar"
        className={cn(
          "ew-sidebar",
          sidebarOpen ? "ew-sidebar--open" : ""
        )}
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen ? true : undefined}
        aria-label="Dashboard navigation"
      >
        {/* Sidebar header: logo + collapse toggle */}
        <div className="ew-sidebar-head">
          <Link href="/" title="Back to homepage" className="ew-sidebar-logo-link" aria-label="Shetu home">
            <img
              alt="Shetu"
              src={logo}
              className={cn("ew-sidebar-logo", sidebarCollapsed ? "ew-sidebar-logo--compact" : "")}
            />
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="ew-sidebar-collapse-btn"
            onClick={toggleSidebarCollapse}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <i className={cn("fa-solid", sidebarCollapsed ? "fa-chevron-right" : "fa-chevron-left")} aria-hidden="true" />
          </button>

          {/* Mobile close button */}
          <button
            ref={sidebarCloseButtonRef}
            type="button"
            className="ew-sidebar-mobile-close"
            onClick={() => closeSidebarDrawer()}
            aria-label="Close menu"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* User profile card */}
        <Link
          href={profilePath as Route}
          className="ew-sidebar-profile"
          onClick={() => closeSidebarDrawer(false)}
          title={sidebarCollapsed ? displayName : undefined}
        >
          <div className="ew-sidebar-avatar-wrap">
            <img
              src={user.image_url ?? "/legacy/no-profile-img.png"}
              alt={displayName}
              className="ew-sidebar-avatar"
            />
            <span className="ew-sidebar-online-dot" aria-hidden="true" />
          </div>
          {!sidebarCollapsed && (
            <div className="ew-sidebar-profile-copy">
              <p className="ew-sidebar-profile-name">{displayName}</p>
              <span className="ew-sidebar-profile-role">
                {user.role}
                {isVerified && <i className="fa-solid fa-circle-check" aria-label="Verified" />}
              </span>
              <span className="ew-sidebar-profile-balance">
                <i className="fa-solid fa-wallet" aria-hidden="true" />
                ৳ {balance}
              </span>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <div className="ew-sidebar-nav-wrap">
          {!sidebarCollapsed && (
            <p className="ew-sidebar-nav-label" aria-hidden="true">
              {t("dash_menu")}
            </p>
          )}

          <nav aria-label="Dashboard menu">
            {localizedNav.map((item) => {
              const active = item.key === section;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "ew-nav-item",
                    active ? "ew-nav-item--active" : "",
                    sidebarCollapsed ? "ew-nav-item--icon-only" : ""
                  )}
                  onClick={() => closeSidebarDrawer(false)}
                  title={sidebarCollapsed ? item.displayLabel : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <i className={cn(item.iconClass, "ew-nav-icon")} aria-hidden="true" />
                  {!sidebarCollapsed && (
                    <span className="ew-nav-label">{item.displayLabel}</span>
                  )}
                  {active && !sidebarCollapsed && (
                    <span className="ew-nav-active-dot" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Premium promo for consultant */}
          {role === "consultant" && !sidebarCollapsed && (
            <div className="ew-sidebar-promo">
              <div className="ew-sidebar-promo-icon" aria-hidden="true">
                <i className="fa-solid fa-crown" />
              </div>
              <h4 className="ew-sidebar-promo-title">Professional Services</h4>
              <p className="ew-sidebar-promo-body">Expand your reach and attract more students.</p>
              <Link
                href={"/pro-packages" as Route}
                className="ew-sidebar-promo-btn"
              >
                {goPremiumLabel}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar footer: logout */}
        <div className="ew-sidebar-footer">
          <button
            type="button"
            className={cn("ew-sidebar-logout", sidebarCollapsed ? "ew-sidebar-logout--icon-only" : "")}
            onClick={() => {
              closeSidebarDrawer(false);
              logout();
            }}
            title={sidebarCollapsed ? t("dash_logout") : undefined}
            aria-label={t("dash_logout")}
          >
            <i className="fa-solid fa-right-from-bracket ew-logout-icon" aria-hidden="true" />
            {!sidebarCollapsed && <span className="ew-logout-label">{t("dash_logout")}</span>}
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN AREA ══════════ */}
      <div className="ew-main">
        {/* ── Topbar ── */}
        <header className="ew-topbar">
          <div className="ew-topbar-left">
            {/* Mobile hamburger */}
            <button
              ref={menuToggleButtonRef}
              type="button"
              className="ew-hamburger"
              onClick={toggleSidebarDrawer}
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              aria-controls="ew-sidebar"
            >
              <i className="fa-solid fa-bars" aria-hidden="true" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              type="button"
              className="ew-sidebar-toggle-btn"
              onClick={toggleSidebarCollapse}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i className="fa-solid fa-bars" aria-hidden="true" />
            </button>

            <div className="ew-topbar-title-group">
              <h1 className="ew-topbar-title">{dashboardTitle}</h1>
              <p className="ew-topbar-date">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="ew-topbar-right">
            {/* Language toggle */}
            <button
              type="button"
              className="ew-lang-btn"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              aria-label={`Switch to ${lang === "bn" ? "English" : "Bengali"}`}
            >
              <i className="fa-solid fa-earth-americas" aria-hidden="true" />
              <span className="ew-lang-label-full">{lang === "bn" ? "বাংলা" : "English"}</span>
              <span className="ew-lang-label-short">{lang === "bn" ? "BN" : "EN"}</span>
            </button>

            {/* Notifications */}
            <NotificationMenu onOpen={() => setProfileOpen(false)} />

            {/* Profile dropdown */}
            <div className="ew-profile-menu" ref={userMenuRef}>
              <button
                type="button"
                className="ew-profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <img
                  src={user.image_url ?? "/legacy/no-profile-img.png"}
                  alt={displayName}
                  className="ew-profile-avatar"
                />
                <i className="fa-solid fa-chevron-down ew-profile-chevron" aria-hidden="true" />
              </button>

              {profileOpen && (
                <div
                  className="ew-profile-dropdown"
                  role="menu"
                  aria-label="User menu"
                >
                  <div className="ew-profile-dropdown-head">
                    <img
                      src={user.image_url ?? "/legacy/no-profile-img.png"}
                      alt={displayName}
                      className="ew-profile-dropdown-avatar"
                    />
                    <div>
                      <p className="ew-profile-dropdown-name">{displayName}</p>
                      <p className="ew-profile-dropdown-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="ew-profile-dropdown-divider" role="separator" />
                  <Link
                    href={profilePath as Route}
                    className="ew-profile-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    <i className="fa-solid fa-user-gear" aria-hidden="true" />
                    <span>{editProfileLabel}</span>
                  </Link>
                  <button
                    type="button"
                    className="ew-profile-dropdown-item ew-profile-dropdown-item--danger"
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); logout(); }}
                  >
                    <i className="fa-solid fa-power-off" aria-hidden="true" />
                    <span>{t("dash_logout")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Quick Actions Strip ── */}
        <div className="ew-quick-actions">
          <Link
            href={walletHref}
            className="ew-quick-balance"
          >
            <span className="ew-quick-balance-icon" aria-hidden="true">
              <i className="fa-solid fa-wallet" />
            </span>
            <span className="ew-quick-balance-copy">
              <small>{balanceLabel}</small>
              <strong>৳ {balance}</strong>
            </span>
          </Link>

          {quickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="ew-quick-pill"
            >
              <i className={cn(item.iconClass, "ew-quick-pill-icon")} aria-hidden="true" />
              <span>{item.displayLabel}</span>
            </Link>
          ))}
        </div>

        {/* ── Page Content ── */}
        <main className="ew-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
