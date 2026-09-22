"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SuggestionInput } from "@/components/form/suggestion-fields";
import { Combobox, InstitutionCombobox } from "@/components/form/education-fields";

import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getCountries, getServices, type Country, type ServiceCategory } from "@/lib/api/catalog";
import { getApiErrorMessage } from "@/lib/api/client";
import { createStudentChoice, getStudentProfile, hasValidLastEducation, type StudentProfile } from "@/lib/api/students";
import { getSubjectSuggestionList } from "@/lib/shared-suggestion-catalog";

const blankForm = {
  country_id: "",
  service_id: "",
  institute: "",
  subject: "",
  session: "",
  budget: ""
};

function formatDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  }).format(parsed);
}

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

export function StudentChoiceCreate() {
  const { t } = useLang();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [infoClosed, setInfoClosed] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const subjectSuggestions = useMemo(() => getSubjectSuggestionList(), []);

  useEffect(() => {
    Promise.allSettled([getStudentProfile(), getCountries(), getServices()])
      .then(([profileResult, countryResult, serviceResult]) => {
        const profiles = takeFulfilledValue(profileResult) ?? [];
        const countryList = takeFulfilledValue(countryResult) ?? [];
        const serviceList = takeFulfilledValue(serviceResult) ?? [];

        setProfile(profiles[0] ?? null);
        setCountries(countryList.filter((country) => country.status === "active"));
        setServices(serviceList.filter((service) => service.status === "active"));

        const failedKeys = [
          profileResult.status === "rejected" ? "profile" : null,
          countryResult.status === "rejected" ? "countries" : null,
          serviceResult.status === "rejected" ? "services" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some choice data could not sync",
            message: `The page loaded with partial data while ${failedKeys.join(", ")} were unavailable.`,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleChange = (field: keyof typeof blankForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleClear = () => {
    setForm(blankForm);
  };

  const hasLastEducation = hasValidLastEducation(profile);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const choice = await createStudentChoice({
        country_id: Number(form.country_id),
        service_id: Number(form.service_id),
        institute: form.institute,
        subject: form.subject,
        session: form.session,
        budget: form.budget
      });
      showToast({
        variant: "success",
        title: "Choice created",
        message: "Your preferred study choice was saved successfully.",
      });
      router.push(`/dashboard/consultants-of-eduwise?choice_id=${choice.id}` as Route);
      router.refresh();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Choice save failed",
        message: getApiErrorMessage(error, "Unable to save your choice right now."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href="/dashboard/student">{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <Link href="/dashboard/student/choices">{t("choice_page_title")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>{t("choice_create_btn")}</span>
      </div>

      {!infoClosed && (
        <div className="sd-info-banner">
          <button type="button" className="sd-info-close" onClick={() => setInfoClosed(true)}>
            <i className="fa-solid fa-xmark" />
          </button>
          <h3>{t("choice_info_heading")}</h3>
          <p>{t("choice_info_text")}</p>
        </div>
      )}

      <div className="sd-card">
        <div className="sd-card-header">
          <div className="sd-card-header-left">
            <img src="/legacy/Frontend/assets/icons/edit.png" alt="" className="sd-card-icon" />
            <h3>{t("choice_page_title")}</h3>
          </div>
          <Link href="/dashboard/student/choices" className="sd-btn-outline">
            Back to Choices
          </Link>
        </div>

        {loading ? (
          <p className="sd-loading">Loading...</p>
        ) : (
          <div className="sd-choice-create-shell">
            <section className="sd-choice-education-section">
              <button
                type="button"
                className="sd-choice-education-toggle"
                onClick={() => setEducationOpen((value) => !value)}
                aria-expanded={educationOpen}
              >
                <span>{t("dash_last_education")}</span>
                <i className={`fa-solid fa-chevron-down ${educationOpen ? "is-open" : ""}`} />
              </button>

              {educationOpen && (
                hasLastEducation ? (
                  <div className="sd-choice-education-grid">
                    <div className="sd-choice-field">
                      <label className="sd-label">Title</label>
                      <input className="sd-field sd-field--readonly" value={profile?.last_education_title ?? ""} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-field">
                      <label className="sd-label">Group/Department</label>
                      <input className="sd-field sd-field--readonly" value={profile?.last_education_department ?? ""} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-field">
                      <label className="sd-label">Duration</label>
                      <input className="sd-field sd-field--readonly" value={profile?.last_education_duration ?? ""} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-field">
                      <label className="sd-label">Result (GPA/CGPA)</label>
                      <input className="sd-field sd-field--readonly" value={profile?.last_education_result ?? ""} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-field">
                      <label className="sd-label">Session Start</label>
                      <input className="sd-field sd-field--readonly" value={formatDate(profile?.last_education_start)} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-field">
                      <label className="sd-label">Session End</label>
                      <input className="sd-field sd-field--readonly" value={formatDate(profile?.last_education_end)} placeholder="Not added" readOnly />
                    </div>
                    <div className="sd-choice-education-footer">
                      <Link href={"/dashboard/student/last-education" as Route} className="sd-btn-outline">
                        Update Education
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="sd-choice-education-empty">
                    <p>Your last education information has not been added yet.</p>
                    <Link href={"/dashboard/student/last-education" as Route} className="sd-btn-outline">
                      Add Qualification
                    </Link>
                  </div>
                )
              )}
            </section>

            {hasLastEducation && (
              <section className="sd-choice-form-block">
                <h4 className="sd-form-title">{t("choice_info_heading")}</h4>
                <form className="sd-choice-form-grid" onSubmit={handleSubmit}>
                  <div className="sd-choice-field">
                    <label className="sd-label">{t("choice_service_label")}</label>
                    <select className="sd-field" required value={form.service_id} onChange={handleChange("service_id")}>
                      <option value="">Select a Service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Combobox
                    label={t("choice_subject_label")}
                    placeholder="Search or type a subject"
                    value={form.subject}
                    suggestions={subjectSuggestions}
                    helper="Common subjects are suggested, and you can still enter your own."
                    onChange={(value) => setForm((prev) => ({ ...prev, subject: value }))}
                  />

                  <div className="sd-choice-field">
                    <label className="sd-label">{t("choice_col_country")}</label>
                    <select className="sd-field" required value={form.country_id} onChange={handleChange("country_id")}>
                      <option value="">Select a Country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sd-choice-field">
                    <label className="sd-label">Your Preferred Session/Year</label>
                    <input
                      className="sd-field"
                      value={form.session}
                      onChange={handleChange("session")}
                      placeholder="e.g. Fall 2027"
                    />
                  </div>

                  <InstitutionCombobox
                    label={t("choice_col_institute")}
                    placeholder="Write Institution/University Name"
                    value={form.institute}
                    onChange={(value) => setForm((prev) => ({ ...prev, institute: value }))}
                  />

                  <div className="sd-choice-field">
                    <label className="sd-label">{t("choice_col_budget")}</label>
                    <input
                      className="sd-field"
                      value={form.budget}
                      onChange={handleChange("budget")}
                      placeholder="Write Your Budget (BDT)"
                    />
                  </div>

                  <div className="sd-choice-form-actions">
                    <button type="button" className="sd-btn-outline" onClick={handleClear}>
                      Clear
                    </button>
                    <button type="submit" className="sd-btn-primary" disabled={submitting}>
                      {submitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
