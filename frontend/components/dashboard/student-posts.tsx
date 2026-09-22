"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ChangeEvent, FormEvent } from "react";
import { useDeferredValue, useEffect, useState } from "react";

import { SuggestionInput } from "@/components/form/suggestion-fields";
import { Combobox } from "@/components/form/education-fields";

import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getCountries,
  getCourses,
  getServices,
  getStudyLevels,
  getUniversities,
  type Country,
  type Course,
  type ServiceCategory,
  type StudyLevel,
  type University,
} from "@/lib/api/catalog";
import {
  createPost,
  deletePost,
  getMyPosts,
  getQuotations,
  type StudentPost,
  type StudentPostPayload,
  updatePost,
} from "@/lib/api/marketplace";
import { getStudentProfile, hasValidLastEducation, type StudentProfile } from "@/lib/api/students";
import { buildSuggestionList, normalizeText } from "@/lib/suggestions";
import {
  getCountrySuggestionList,
  getServiceSuggestionList,
  getStudyLevelSuggestionList,
  getSubjectSuggestionList,
} from "@/lib/shared-suggestion-catalog";

type PostFormState = {
  title: string;
  description: string;
  countryInput: string;
  serviceInput: string;
  studyLevelInput: string;
  subject: string;
  institute: string;
  session: string;
  budget: string;
};

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function createBlankForm(): PostFormState {
  return {
    title: "",
    description: "",
    countryInput: "",
    serviceInput: "",
    studyLevelInput: "",
    subject: "",
    institute: "",
    session: "",
    budget: "",
  };
}

export function StudentPosts() {
  const { t } = useLang();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<StudentPost[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [quotationCounts, setQuotationCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<PostFormState>(createBlankForm());
  const deferredSearch = useDeferredValue(search);

  const load = () => {
    Promise.allSettled([
      getMyPosts(),
      getCountries(),
      getServices(),
      getStudyLevels(),
      getCourses(),
      getUniversities(),
      getQuotations(),
      getStudentProfile(),
    ])
      .then(([postResult, countryResult, serviceResult, studyLevelResult, courseResult, universityResult, quoteResult, profileResult]) => {
        const postData = takeFulfilledValue(postResult) ?? [];
        const countryData = takeFulfilledValue(countryResult) ?? [];
        const serviceData = takeFulfilledValue(serviceResult) ?? [];
        const studyLevelData = takeFulfilledValue(studyLevelResult) ?? [];
        const courseData = takeFulfilledValue(courseResult) ?? [];
        const universityData = takeFulfilledValue(universityResult) ?? [];
        const quotes = takeFulfilledValue(quoteResult) ?? [];
        const profiles = takeFulfilledValue(profileResult) ?? [];

        setPosts(postData);
        setProfile(profiles[0] ?? null);
        setCountries(countryData.filter((item) => item.status === "active"));
        setServices(serviceData.filter((item) => item.status === "active"));
        setStudyLevels(studyLevelData.filter((item) => item.status === "active"));
        setCourses(courseData.filter((item) => item.status === "active"));
        setUniversities(universityData.filter((item) => item.status === "active"));

        const counts: Record<number, number> = {};
        quotes.forEach((quote) => {
          if (quote.post_id) {
            counts[quote.post_id] = (counts[quote.post_id] ?? 0) + 1;
          }
        });
        setQuotationCounts(counts);

        const failedKeys = [
          postResult.status === "rejected" ? "posts" : null,
          countryResult.status === "rejected" ? "countries" : null,
          serviceResult.status === "rejected" ? "services" : null,
          studyLevelResult.status === "rejected" ? "study levels" : null,
          courseResult.status === "rejected" ? "subjects" : null,
          universityResult.status === "rejected" ? "institutions" : null,
          quoteResult.status === "rejected" ? "quotations" : null,
          profileResult.status === "rejected" ? "profile" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some suggestion data could not sync",
            message: `Using shared fallback suggestions while ${failedKeys.join(", ")} are unavailable from the API.`,
          });
        }
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Posts failed to load",
          message: getApiErrorMessage(error, "Unable to load your posts right now."),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const hasLastEducation = hasValidLastEducation(profile);
  const countrySuggestions = getCountrySuggestionList(countries.map((item) => item.name));
  const serviceSuggestions = getServiceSuggestionList(services.map((item) => item.name));
  const studyLevelSuggestions = getStudyLevelSuggestionList(studyLevels.map((item) => item.name));
  const subjectSuggestions = getSubjectSuggestionList(courses.map((item) => item.name));
  const instituteSuggestions = buildSuggestionList(universities.map((item) => item.name));
  const sessionSuggestions = buildSuggestionList(
    [
      ...posts.map((item) => item.session),
      ...Array.from({ length: 5 }, (_, index) => {
        const year = new Date().getFullYear() + index;
        return [`Spring ${year}`, `Summer ${year}`, `Fall ${year}`, `Winter ${year}`];
      }).flat(),
    ],
    { sort: false },
  );

  const openCreate = () => {
    if (!hasLastEducation) {
      return;
    }

    setEditId(null);
    setForm(createBlankForm());
    setShowForm(true);
  };

  const openEdit = (post: StudentPost) => {
    setEditId(post.id);
    setForm({
      title: post.title,
      description: post.description,
      countryInput: post.country_name ?? "",
      serviceInput: post.service_name ?? "",
      studyLevelInput: post.study_level_name ?? "",
      subject: post.subject ?? "",
      institute: post.institute ?? "",
      session: post.session ?? "",
      budget: post.budget ?? "",
    });
    setShowForm(true);
  };

  const updateForm =
    (field: keyof PostFormState) =>
    (value: string | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = typeof value === "string" ? value : value.target.value;
      setForm((previous) => ({ ...previous, [field]: nextValue }));
    };

  const findCountryMatch = (value: string) =>
    countries.find((item) => item.name.toLowerCase() === normalizeText(value).toLowerCase());

  const findServiceMatch = (value: string) =>
    services.find((item) => item.name.toLowerCase() === normalizeText(value).toLowerCase());

  const findStudyLevelMatch = (value: string) =>
    studyLevels.find((item) => item.name.toLowerCase() === normalizeText(value).toLowerCase());

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedCountry = normalizeText(form.countryInput);
    const normalizedService = normalizeText(form.serviceInput);
    const normalizedStudyLevel = normalizeText(form.studyLevelInput);
    const matchedCountry = findCountryMatch(normalizedCountry);
    const matchedService = findServiceMatch(normalizedService);
    const matchedStudyLevel = findStudyLevelMatch(normalizedStudyLevel);

    const payload: StudentPostPayload = {
      title: normalizeText(form.title),
      description: form.description.trim(),
      country_id: matchedCountry?.id ?? null,
      custom_country_name: matchedCountry ? "" : normalizedCountry,
      service_category_id: matchedService?.id ?? null,
      custom_service_name: matchedService ? "" : normalizedService,
      subject: normalizeText(form.subject),
      institute: normalizeText(form.institute),
      session: normalizeText(form.session),
      study_level_id: matchedStudyLevel?.id ?? null,
      custom_study_level_name: matchedStudyLevel ? "" : normalizedStudyLevel,
      budget: normalizeText(form.budget) || null,
    };

    setSubmitting(true);
    try {
      if (editId) {
        await updatePost(editId, payload);
      } else {
        await createPost(payload);
      }

      setShowForm(false);
      setEditId(null);
      setForm(createBlankForm());
      showToast({
        variant: "success",
        title: editId ? "Post updated" : "Post created",
        message: editId ? "Your post changes were saved." : "Your new post was published successfully.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Post save failed",
        message: getApiErrorMessage(error, "Unable to save your post."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("post_delete_confirm"))) {
      return;
    }

    try {
      await deletePost(id);
      showToast({
        variant: "success",
        title: "Post deleted",
        message: "The selected post was removed.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this post."),
      });
    }
  };

  const filtered = posts.filter((post) => {
    const query = deferredSearch.trim().toLowerCase();
    return (
      !query ||
      post.title.toLowerCase().includes(query) ||
      post.subject.toLowerCase().includes(query) ||
      (post.country_name ?? "").toLowerCase().includes(query) ||
      (post.service_name ?? "").toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query)
    );
  });

  const countryOf = (id: number | null) => countries.find((country) => country.id === id);
  const titleCount = form.title.length;
  const descriptionCount = form.description.length;

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href="/dashboard/student">{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>{t("post_dashboard_title")}</span>
      </div>

      <div className="sd-card sd-card--allow-overflow">
        <div className="sd-card-header">
          <h3>{t("post_dashboard_title")}</h3>
          <div className="sd-card-header-right">
            <div className="sd-search-wrap">
              <i className="fa-solid fa-magnifying-glass sd-search-icon" />
              <input
                type="text"
                className="sd-search-input"
                placeholder={t("post_dashboard_search")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {hasLastEducation ? (
              <button type="button" className="sd-btn-primary" onClick={openCreate}>
                {t("post_dashboard_create_btn")}
              </button>
            ) : (
              <Link href={"/dashboard/student/last-education" as Route} className="sd-btn-outline">
                Add Qualification
              </Link>
            )}
          </div>
        </div>

        {!hasLastEducation && (
          <div className="sd-panel-head">
            <div>
              <h2>Last Education</h2>
              <p>Your last education information has not been added yet. To create a post, update your qualification first.</p>
            </div>
            <Link href={"/dashboard/student/last-education" as Route} className="sd-btn-outline">
              Add Qualification
            </Link>
          </div>
        )}

        {showForm && (editId !== null || hasLastEducation) && (
          <div className="sd-form-section">
            <div className="sd-form-copy">
              <h4 className="sd-form-title">{editId ? "Update your post" : "Create your post"}</h4>
              <p>Search from the suggested country, service, study level, subject, or institution lists. If nothing matches, keep typing and save your own custom value.</p>
            </div>

            <form className="sd-form-grid sd-form-grid--posts" onSubmit={handleSubmit}>
              <Combobox
                label="Select Country"
                placeholder="Search or type a country"
                value={form.countryInput}
                suggestions={countrySuggestions}
                required
                helper="Choose a catalog country or enter your own preferred destination."
                onChange={updateForm("countryInput")}
              />

              <Combobox
                label="Select Subject"
                placeholder="Search or type a subject"
                value={form.subject}
                suggestions={subjectSuggestions}
                required
                helper="Suggestions come from the course catalog, but you can add a custom subject."
                onChange={updateForm("subject")}
              />

              <Combobox
                label="Select Study Level"
                placeholder="Search or type a study level"
                value={form.studyLevelInput}
                suggestions={studyLevelSuggestions}
                helper="Pick a standard level or enter a custom one."
                onChange={updateForm("studyLevelInput")}
              />

              <Combobox
                label="Select Service"
                placeholder="Search or type a service"
                value={form.serviceInput}
                suggestions={serviceSuggestions}
                required
                helper="Consultants will use this service need to respond with quotations."
                onChange={updateForm("serviceInput")}
              />

              <Combobox
                label="Your Preferred Institution"
                placeholder="Search or type an institution"
                value={form.institute}
                suggestions={instituteSuggestions}
                helper="University suggestions are optional. Custom institution names are allowed."
                onChange={updateForm("institute")}
              />

              <Combobox
                label="Passing Year / Session"
                placeholder="e.g. Fall 2027"
                value={form.session}
                suggestions={sessionSuggestions}
                helper="Use a known intake/session or type your own."
                onChange={updateForm("session")}
              />

              <div className="sd-form-full">
                <label className="sd-label" htmlFor="student-post-title">Title</label>
                <input
                  id="student-post-title"
                  className="sd-field"
                  required
                  maxLength={250}
                  placeholder="Write a concise title for your study requirement"
                  value={form.title}
                  onChange={updateForm("title")}
                />
                <div className="sd-field-meta">
                  <span className="sd-form-helper">Keep the title specific so consultants can understand your need quickly.</span>
                  <span className="sd-field-counter">{titleCount} / 250</span>
                </div>
              </div>

              <div>
                <label className="sd-label" htmlFor="student-post-budget">Budget (BDT)</label>
                <input
                  id="student-post-budget"
                  className="sd-field"
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Your budget"
                  value={form.budget}
                  onChange={updateForm("budget")}
                />
              </div>

              <div className="sd-form-full">
                <label className="sd-label" htmlFor="student-post-description">Description</label>
                <textarea
                  id="student-post-description"
                  className="sd-field"
                  required
                  rows={8}
                  maxLength={1000}
                  placeholder="Write down the details of your requirement"
                  value={form.description}
                  onChange={updateForm("description")}
                />
                <div className="sd-field-meta">
                  <span className="sd-form-helper">Include preferences, expectations, and anything consultants should know before quoting.</span>
                  <span className="sd-field-counter">{descriptionCount} / 1000</span>
                </div>
              </div>

              <div className="sd-form-actions">
                <button type="submit" className="sd-btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : editId ? "Update Post" : "Create Post"}
                </button>
                <button
                  type="button"
                  className="sd-btn-outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setForm(createBlankForm());
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="sd-loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="sd-empty-state">
            <img
              src="/legacy/Frontend/assets/img/icon/no-data.png"
              alt="No data"
              onError={(event) => {
                (event.target as HTMLImageElement).src = "/legacy/Frontend/assets/img/icon/login.png";
              }}
            />
            <p className="sd-empty-title">{t("post_dashboard_no_data")}</p>
            <p className="sd-empty-help">{t("post_dashboard_no_data_help")}</p>
            {hasLastEducation ? (
              <button type="button" className="sd-btn-primary mt-4" onClick={openCreate}>
                {t("post_dashboard_create_btn")}
              </button>
            ) : (
              <Link href={"/dashboard/student/last-education" as Route} className="sd-btn-outline mt-4">
                Add Qualification
              </Link>
            )}
          </div>
        ) : (
          <div className="sd-table-wrap">
            <table className="sd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("post_col_country")}</th>
                  <th>{t("post_col_title")}</th>
                  <th>{t("post_col_desc")}</th>
                  <th>{t("post_col_subject")}</th>
                  <th>{t("post_col_level")}</th>
                  <th>{t("post_col_status")}</th>
                  <th>{t("post_col_action")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post, index) => {
                  const country = countryOf(post.country_id);
                  const quotationCount = quotationCounts[post.id] ?? 0;
                  const isActive = post.status === "active";

                  return (
                    <tr key={post.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="sd-country-cell">
                          {country?.image ? (
                            <img src={country.image} alt={post.country_name ?? country.name} className="sd-country-flag" />
                          ) : (
                            <div className="sd-country-flag-placeholder">
                              <i className="fa-solid fa-earth-americas" />
                            </div>
                          )}
                          <span>{post.country_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="sd-truncate">{post.title.length > 30 ? `${post.title.slice(0, 30)}...` : post.title}</td>
                      <td className="sd-truncate">{post.description.length > 40 ? `${post.description.slice(0, 40)}...` : post.description}</td>
                      <td>{post.subject || "—"}</td>
                      <td>{post.study_level_name ?? "—"}</td>
                      <td>
                        <span className={`sd-status-pill ${isActive ? "sd-status-pill--green" : "sd-status-pill--gray"}`}>
                          {isActive ? t("post_published") : post.status}
                        </span>
                      </td>
                      <td>
                        <div className="sd-post-actions">
                          <button
                            type="button"
                            className="sd-action-icon sd-action-icon--blue"
                            title="Edit"
                            onClick={() => openEdit(post)}
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </button>
                          <button
                            type="button"
                            className="sd-action-icon sd-action-icon--gray"
                            title={isActive ? "Published" : "Not published"}
                            disabled
                          >
                            <i className={`fa-solid ${isActive ? "fa-eye" : "fa-eye-slash"}`} />
                          </button>
                          <button
                            type="button"
                            className="sd-action-icon sd-action-icon--red"
                            title="Delete"
                            onClick={() => handleDelete(post.id)}
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                        {quotationCount > 0 && (
                          <Link href={`/dashboard/student/quotations?post_id=${post.id}`} className="sd-quotation-link">
                            {t("post_see_quotations")} ({quotationCount})
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
