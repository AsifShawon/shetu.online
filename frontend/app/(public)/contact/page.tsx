"use client";

import { useEffect, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { PageBanner } from "@/components/legacy/page-banner";
import { getSiteSettings, submitContact, type SiteSetting, type ContactPayload } from "@/lib/api/content";
import { getServices as getCatalogServices } from "@/lib/api/catalog";

export default function ContactPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState<SiteSetting | null>(null);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [form, setForm] = useState<ContactPayload>({
    name: "",
    phone: "",
    email: "",
    service_interest: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSiteSettings().then((list) => { if (list.length) setSettings(list[0]); }).catch(() => null);
    getCatalogServices().then((list) => setServiceOptions(list.map((s) => s.name))).catch(() => null);
  }, []);

  const phone = settings?.phone ?? "+8801712345678";
  const email = settings?.email ?? "contact@shetu.com.bd";

  const handleChange = (field: keyof ContactPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitContact(form);
      setSuccess(true);
      setForm({ name: "", phone: "", email: "", service_interest: "", subject: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBanner
        title={t("contact_page_heading")}
        description={t("contact_page_desc")}
        image="/legacy/Frontend/assets/img/contact/contact-04.jpg"
      />
      <section className="py-16 md:py-20">
        <div className="legacy-container grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
          <div className="legacy-panel p-8">
            <h2 className="text-3xl font-extrabold text-[var(--legacy-primary)]">{t("contact_send_email_heading")}</h2>
            {success && (
              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {t("contact_success")}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {t("contact_error")}
              </div>
            )}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className="legacy-form-field"
                  value={form.service_interest}
                  onChange={handleChange("service_interest")}
                >
                  <option value="">Select Service</option>
                  {serviceOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input
                  className="legacy-form-field"
                  placeholder="Name"
                  required
                  value={form.name}
                  onChange={handleChange("name")}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="legacy-form-field"
                  placeholder="Phone"
                  required
                  value={form.phone}
                  onChange={handleChange("phone")}
                />
                <input
                  className="legacy-form-field"
                  type="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={handleChange("email")}
                />
              </div>
              <input
                className="legacy-form-field"
                placeholder="Subject"
                required
                value={form.subject}
                onChange={handleChange("subject")}
              />
              <textarea
                className="legacy-form-field min-h-40"
                placeholder="Message"
                required
                value={form.message}
                onChange={handleChange("message")}
              />
              <button type="submit" className="legacy-primary-btn" disabled={loading}>
                {loading ? "…" : t("contact_send_btn")}
              </button>
            </form>
          </div>
          <div className="space-y-6">
            <div className="legacy-panel grid gap-4 p-6">
              {[
                { icon: "fa-phone", label: t("contact_call_us_bn"), sub: t("contact_call_us"), value: phone, href: `tel:${phone}` },
                { icon: "fa-whatsapp", label: t("contact_message_us_bn"), sub: t("contact_message_us"), value: phone, href: `https://wa.me/${phone.replace(/\D/g, "")}` },
                { icon: "fa-envelope", label: t("contact_email_us_bn"), sub: t("contact_email_us"), value: email, href: `mailto:${email}` }
              ].map(({ icon, label, sub, value, href }) => (
                <a key={label} href={href} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 hover:bg-slate-100 transition-colors" style={{ textDecoration: "none" }}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--legacy-primary)] text-white flex-shrink-0">
                    <i className={`fa-${icon === "fa-whatsapp" ? "brands" : "solid"} ${icon}`} />
                  </div>
                  <div>
                    <p className="font-extrabold text-[var(--legacy-primary)]">{label}</p>
                    <p className="text-xs text-[var(--legacy-muted)]">{sub}</p>
                    <p className="text-sm text-[var(--legacy-muted)]">{value}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="legacy-panel p-5">
              <h3 className="text-lg font-extrabold text-[var(--legacy-primary)] mb-3">
                <i className="fa-solid fa-location-dot mr-2" /> {t("contact_address_heading")}
              </h3>
              <p className="text-sm text-[var(--legacy-muted)] mb-4">
                House # 6/20 (12th Floor), Block # E, A/k Link Road, Boshundhara, Dhaka - 1212
              </p>
              <a
                href="https://maps.google.com/?q=Fleek+Bangladesh+Boshundhara+Dhaka"
                target="_blank"
                rel="noopener noreferrer"
                className="legacy-outline-btn text-sm"
              >
                <i className="fa-solid fa-map-location-dot" /> {t("contact_find_map")}
              </a>
            </div>
            <div className="legacy-panel overflow-hidden p-0">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3046.5692448137693!2d90.41059887439367!3d23.812208586402495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7007a8a065b%3A0xc736bf6b1228538a!2sFleek%20Bangladesh!5e1!3m2!1sen!2sbd!4v1745060034206!5m2!1sen!2sbd"
                width="100%"
                height="300"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
