"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useLang } from "@/components/layout/lang-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteSettings, type SiteSetting } from "@/lib/api/content";
import { legacySite } from "@/lib/legacy-data";

import { LanguageToggle } from "./language-toggle";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function getDashboardPath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant";
  if (role === "agency") return "/dashboard/agency";
  if (role === "admin") return "/admin";
  return "/dashboard/student";
}

function getProfilePath(role?: string): Route {
  if (role === "consultant") return "/dashboard/consultant/profile";
  if (role === "agency") return "/dashboard/agency/profile";
  if (role === "admin") return "/admin";
  return "/dashboard/student/profile";
}

const consultantRegisterHref = "/register?role=consultant";

/* ── Inner shell — has access to LangContext ─────────────────────────── */
function ShellContent({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { t } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const wasMobileOpenRef = useRef(false);

  const isAuth = useMemo(
    () =>
      ["/login", "/register", "/forgot-password", "/reset-password", "/otp"].includes(pathname),
    [pathname]
  );
  const isHome = pathname === "/";

  useEffect(() => {
    getSiteSettings()
      .then((list) => { if (list.length) setSettings(list[0]); })
      .catch(() => null);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (wasMobileOpenRef.current && !mobileOpen) {
      hamburgerRef.current?.focus();
    }
    wasMobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  const phone = settings?.phone ?? legacySite.phone;
  const email = settings?.email ?? legacySite.email;
  const logoSrc = "/shetu_logo.jpeg";

  const dashboardHref = getDashboardPath(user?.role);
  const profileHref = getProfilePath(user?.role);
  const ctaLabel = user?.first_name?.trim() || t("nav_register");

  const navItems = [
    { href: "/consultants", activeHref: "/consultants", label: t("footer_consultants"), icon: "fa-user-group" },
    { href: consultantRegisterHref, activeHref: "/register", label: t("footer_become"), icon: "fa-user-plus" },
    { href: "/pricing", activeHref: "/pricing", label: t("nav_pricing"), icon: "fa-tags" },
  ];

  const accountItems = user
    ? [
        { href: dashboardHref, label: t("nav_dashboard"), icon: "fa-table-columns" },
        { href: profileHref, label: "Profile", icon: "fa-user" },
      ]
    : [
        { href: "/login" as Route, label: t("nav_signin"), icon: "fa-right-to-bracket" },
        { href: "/register" as Route, label: t("nav_register"), icon: "fa-user-plus" },
      ];

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <div className={`legacy-site min-h-screen bg-[#f7fafd] text-[var(--legacy-text)] ${isHome ? "legacy-site--home" : ""} ${mobileOpen ? "legacy-site--mobile-nav-open" : ""}`}>
      <header id="fixtNavbar" className="legacy-fixed-header">
        <div className="top-header">
          <div className="top-container">
            <div className="top-header-content">
              <div className="left">
                <a href={`tel:${phone}`}>
                  <i className="fa-solid fa-phone" /> {phone}
                </a>
                <a className="mail" href={`mailto:${email}`}>
                  <i className="fa-solid fa-envelope" /> {email}
                </a>
              </div>
              <div className="right">
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="header_bar">
          <div className="nav_menu_bar">
            <div className="logo_section">
              <Link href="/">
                <img src={logoSrc} alt={t("site_name")} />
              </Link>
            </div>
            <header>
              <div className="header_bar_container">
                <button
                  ref={hamburgerRef}
                  type="button"
                  className={`hamburger-toggle ${mobileOpen ? "is-hidden" : ""}`}
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-menu-drawer"
                >
                  <i className="fa-solid fa-bars" />
                </button>
                <button
                  type="button"
                  className={`legacy-mobile-nav-backdrop ${mobileOpen ? "is-open" : ""}`}
                  onClick={closeMobileMenu}
                  aria-label="Close menu"
                />
                <div
                  id="mobile-menu-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-hidden={!mobileOpen}
                  className={`nav-buttons ${mobileOpen ? "is-open" : ""}`}
                >
                  <div className="legacy-mobile-nav-head">
                    <div className="legacy-mobile-nav-brand">
                      <img src={logoSrc} alt={t("site_name")} />
                    </div>
                    <button
                      type="button"
                      className="legacy-mobile-nav-close"
                      onClick={closeMobileMenu}
                      aria-label="Close menu"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  <div className="navbar-links">
                    <ul className="legacy-mobile-menu-list">
                      {navItems.map((item) => (
                        <li
                          key={item.href}
                          className="nav-link"
                        >
                          <Link
                            href={item.href as Route}
                            className={`legacy-mobile-menu-link ${isActive(pathname, item.activeHref) ? "is-active" : ""}`}
                            onClick={closeMobileMenu}
                          >
                            <span className="legacy-mobile-menu-link__left">
                              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                              <span>{item.label}</span>
                            </span>
                            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className="legacy-header-cta-wrap">
                      <Link
                        href={user ? dashboardHref : ("/register" as Route)}
                        className="legacy-header-cta"
                        onClick={() => setMobileOpen(false)}
                      >
                        {isLoading ? "..." : ctaLabel}
                      </Link>
                    </div>
                    <div className="legacy-mobile-nav-section legacy-mobile-nav-section--actions">
                      <p className="legacy-mobile-nav-label">Account</p>
                      <ul className="legacy-mobile-menu-list">
                        {accountItems.map((item) => (
                          <li key={`${item.href}-${item.label}`} className="nav-link">
                            <Link
                              href={item.href}
                              className={`legacy-mobile-menu-link ${isActive(pathname, item.href) ? "is-active" : ""}`}
                              onClick={closeMobileMenu}
                            >
                              <span className="legacy-mobile-menu-link__left">
                                <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                                <span>{item.label}</span>
                              </span>
                              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                            </Link>
                          </li>
                        ))}
                        {user ? (
                          <li className="nav-link">
                            <button
                              type="button"
                              className="legacy-mobile-menu-link legacy-mobile-menu-link--logout"
                              onClick={async () => {
                                closeMobileMenu();
                                await logout();
                              }}
                            >
                              <span className="legacy-mobile-menu-link__left">
                                <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                                <span>{t("nav_signout")}</span>
                              </span>
                              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    <div className="legacy-mobile-nav-section legacy-mobile-nav-section--contact">
                      <p className="legacy-mobile-nav-label">Contact</p>
                      <a href={`tel:${phone}`} className="legacy-mobile-contact-link" onClick={closeMobileMenu}>
                        <i className="fa-solid fa-phone" /> {phone}
                      </a>
                      <a href={`mailto:${email}`} className="legacy-mobile-contact-link" onClick={closeMobileMenu}>
                        <i className="fa-solid fa-envelope" /> {email}
                      </a>
                    </div>
                    <div className="legacy-mobile-nav-foot">
                      <span>{t("site_name")}</span>
                      <span>{isLoading ? "..." : ctaLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          </div>
        </div>
      </header>

      <main className={isAuth ? "legacy-site-main legacy-auth-main" : "legacy-site-main"}>
        {children}
      </main>

      {isHome ? null : (
        <SiteFooter settings={settings} />
      )}
    </div>
  );
}

/* ── Public entry point ─────────────────────────────────────────────── */
export function PublicShell({ children }: PropsWithChildren) {
  return <ShellContent>{children}</ShellContent>;
}
