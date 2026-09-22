"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

import { useLang } from "@/components/layout/lang-provider";
import type { SiteSetting } from "@/lib/api/content";
import { legacySite } from "@/lib/legacy-data";

import styles from "./site-footer.module.css";

const footerCopy = {
  en: {
    title: "Start your career with us",
    body: "Join as a consultant, publish services, and connect with students who already know what support they need.",
    name: "Your name",
    namePlaceholder: "Name",
    phone: "Your phone number",
    phonePlaceholder: "Your phone number",
    submit: "Send request",
    servicesLabel: "Services",
    informationLabel: "Information",
    contactLabel: "Contact us",
    servicesLinks: [
      { href: "/consultants", label: "Consultants" },
      { href: "/courses", label: "Countries" },
      { href: "/courses", label: "Universities" },
    ],
    informationLinks: [
      { href: "/about", label: "About us" },
      { href: "/student-post", label: "Testimonials" },
      { href: "/eduwise-terms-and-condition", label: "Guidelines" },
    ],
    copyright: "Copyright",
  },
  bn: {
    title: "Start your career with us",
    body: "Join as a consultant, publish services, and connect with students who already know what support they need.",
    name: "Your name",
    namePlaceholder: "Name",
    phone: "Your phone number",
    phonePlaceholder: "Your phone number",
    submit: "Send request",
    servicesLabel: "Services",
    informationLabel: "Information",
    contactLabel: "Contact us",
    servicesLinks: [
      { href: "/consultants", label: "Consultants" },
      { href: "/courses", label: "Countries" },
      { href: "/courses", label: "Universities" },
    ],
    informationLinks: [
      { href: "/about", label: "About us" },
      { href: "/student-post", label: "Testimonials" },
      { href: "/eduwise-terms-and-condition", label: "Guidelines" },
    ],
    copyright: "Copyright",
  },
} as const;

type SiteFooterProps = {
  settings?: SiteSetting | null;
};

const logoSrc = "/shetu_logo.jpeg";
const artworkSrc = "/legacy/Frontend/assets/img/page/footer_glove.png";

export function SiteFooter({ settings }: SiteFooterProps) {
  const { lang, t } = useLang();
  const copy = footerCopy[lang === "bn" ? "bn" : "en"];
  const email = settings?.email ?? legacySite.email;
  const phone = settings?.phone ?? legacySite.phone;
  const address = settings?.address ?? legacySite.address;

  return (
    <footer className={styles.footerSection}>
      <div className={styles.container}>
        <div className={styles.footerTop}>
          <div className={styles.footerIntro}>
            <img src={logoSrc} alt={t("site_name")} className={styles.footerLogo} />
            <h2>{copy.title}</h2>
            <p>{copy.body}</p>
          </div>

          <form className={styles.footerForm} onSubmit={(event) => event.preventDefault()}>
            <label className={styles.footerField}>
              <span>{copy.name}</span>
              <input type="text" placeholder={copy.namePlaceholder} />
            </label>
            <label className={styles.footerField}>
              <span>{copy.phone}</span>
              <input type="tel" placeholder={copy.phonePlaceholder} />
            </label>
            <button type="submit" className={styles.footerSubmit}>
              {copy.submit}
            </button>
          </form>
        </div>

        <div className={styles.footerColumns}>
          <div className={styles.footerColumn}>
            <h3>{copy.servicesLabel}</h3>
            {copy.servicesLinks.map((item) => (
              <Link key={item.href + item.label} href={item.href as Route}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <h3>{copy.informationLabel}</h3>
            {copy.informationLinks.map((item) => (
              <Link key={item.href + item.label} href={item.href as Route}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.footerColumn}>
            <h3>{copy.contactLabel}</h3>
            <span>{email}</span>
            <span>{phone}</span>
            <span>{address}</span>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>
            {copy.copyright} {new Date().getFullYear()}
          </span>

          <div className={styles.footerSocials}>
            <a href="#" aria-label="LinkedIn">
              <Linkedin size={16} />
            </a>
            <a href={settings?.facebook || "#"} aria-label="Facebook">
              <Facebook size={16} />
            </a>
            <a href={settings?.instagram || "#"} aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href={settings?.twitter || "#"} aria-label="Twitter">
              <Twitter size={16} />
            </a>
          </div>

          <button type="button" className={styles.scrollTop} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <img src={artworkSrc} alt="" className={styles.footerArtwork} />
    </footer>
  );
}
