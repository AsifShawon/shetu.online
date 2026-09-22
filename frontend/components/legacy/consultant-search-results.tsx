"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { getConsultantServices, type ConsultantService } from "@/lib/api/consultants";
import { getCountries, getStudyLevels, type Country, type StudyLevel } from "@/lib/api/catalog";
import {
  getCountrySuggestionList,
  getServiceSuggestionList,
  getStudyLevelSuggestionList,
  getSubjectSuggestionList,
  mergeSuggestionSources,
} from "@/lib/shared-suggestion-catalog";
import { formatDurationDays } from "@/lib/formatters";

const CONSULTANTS_PER_PAGE = 6;

const RESULT_TAB_ROUTES = {
  courses: "/your-selected-result-courses",
  countries: "/your-selected-result",
  scholarships: "/your-selected-result-scholarship",
  universities: "/your-selected-result-university",
  budget: "/your-selected-result-Budget",
} as const;

type ResultTab = keyof typeof RESULT_TAB_ROUTES;

type ConsultantCountry = {
  id: number;
  name: string;
  image: string | null;
};

type ConsultantGroup = {
  consultantId: number;
  consultantName: string;
  consultantImage: string | null;
  verificationStatus: string;
  subscriptionStatus: string;
  joinedAt: string | null;
  rating: number;
  reviewCount: number;
  countries: ConsultantCountry[];
  services: ConsultantService[];
  subjectNames: string[];
  studyLevelNames: string[];
  searchBlob: string;
};

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function includeCurrentOption(options: string[], current: string) {
  if (!current.trim() || options.includes(current.trim())) return options;
  return [current.trim(), ...options];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function renderStars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from({ length: 5 }, (_, index) => (
    <i
      key={index}
      className={`fa-solid fa-star ${index < rounded ? "is-active" : ""}`}
      aria-hidden="true"
    />
  ));
}

function formatPrice(value: string | null | undefined, lang: "en" | "bn") {
  const numeric = Number(value ?? "");
  if (!Number.isFinite(numeric) || numeric <= 0) return lang === "bn" ? "à¦«à§à¦°à¦¿ / à¦ªà§à¦°à¦¯à§‹à¦œà§à¦¯ à¦¨à¦¯à¦¼" : "Free / N/A";
  return `${lang === "bn" ? "à§³" : "à§³"} ${numeric.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}`;
}

function formatJoinedDate(value: string | null, lang: "en" | "bn") {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function getFirstParam(searchParams: ReadonlyURLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return "";
}

function resolveActiveTab(pathname: string): ResultTab {
  if (pathname === "/search-consultant-country") return "countries";
  if (pathname === "/search-consultant-service") return "courses";

  const match = (Object.entries(RESULT_TAB_ROUTES) as [ResultTab, string][])
    .find(([, route]) => route === pathname);

  return match?.[0] ?? "countries";
}

function buildUrl(
  pathname: string,
  filters: {
    keyword?: string;
    course?: string;
    studyLevel?: string;
    country?: string;
    budget?: string;
  },
  page = 1,
) {
  const params = new URLSearchParams();

  if (filters.keyword?.trim()) params.set("keyword", filters.keyword.trim());
  if (filters.course?.trim()) params.set("course", filters.course.trim());
  if (filters.studyLevel?.trim()) params.set("studyLevel", filters.studyLevel.trim());
  if (filters.country?.trim()) params.set("country", filters.country.trim());
  if (filters.budget?.trim()) params.set("budget", filters.budget.trim());
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function SearchResultContent() {
  const { lang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTab = resolveActiveTab(pathname);

  const qParam = searchParams.get("q") ?? "";
  const keyword = getFirstParam(searchParams, ["keyword"]) || (pathname === "/search-consultant-service" ? qParam : "");
  const courseFilter =
    getFirstParam(searchParams, ["course", "course[]"]) ||
    (pathname === "/search-consultant-service" ? qParam : "");
  const studyLevelFilter = getFirstParam(searchParams, ["studyLevel", "studyLevel[]"]);
  const countryFilter =
    getFirstParam(searchParams, ["country", "country[]"]) ||
    (pathname === "/search-consultant-country" ? qParam : "");
  const budgetFilter = getFirstParam(searchParams, ["budget"]);
  const page = Number(searchParams.get("page") ?? "1");

  const [services, setServices] = useState<ConsultantService[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [courseInput, setCourseInput] = useState(courseFilter);
  const [studyLevelInput, setStudyLevelInput] = useState(studyLevelFilter);
  const [countryInput, setCountryInput] = useState(countryFilter);
  const [budgetInput, setBudgetInput] = useState(budgetFilter);

  useEffect(() => {
    setKeywordInput(keyword);
    setCourseInput(courseFilter);
    setStudyLevelInput(studyLevelFilter);
    setCountryInput(countryFilter);
    setBudgetInput(budgetFilter);
  }, [budgetFilter, countryFilter, courseFilter, keyword, studyLevelFilter]);

  useEffect(() => {
    Promise.allSettled([
      getConsultantServices({ scope: "public" }),
      getCountries(),
      getStudyLevels(),
    ])
      .then(([serviceResult, countryResult, studyLevelResult]) => {
        const serviceList = takeFulfilledValue(serviceResult) ?? [];
        const countryList = takeFulfilledValue(countryResult) ?? [];
        const studyLevelList = takeFulfilledValue(studyLevelResult) ?? [];

        setServices(serviceList);
        setCountries(countryList.filter((item) => item.status === "active"));
        setStudyLevels(studyLevelList.filter((item) => item.status === "active"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const activeServices = useMemo(
    () => services.filter((service) => service.status === "active"),
    [services],
  );

  const groupedConsultants = useMemo(() => {
    const groups = new Map<number, ConsultantGroup>();

    for (const service of activeServices) {
      const existing = groups.get(service.consultant_id);
      const serviceCategoryNames = uniqueStrings(service.service_category_names ?? []);
      const subjectNames = uniqueStrings(
        (service.subject_names?.length ? service.subject_names : serviceCategoryNames) ?? [],
      );
      const studyLevelNames = uniqueStrings(service.study_level_names ?? []);
      const countryName = service.country_name ?? "";
      const countryImage = service.country_image ?? null;
      const countryId = service.country_id;

      if (!existing) {
        const reviewCount = service.consultant_review_count ?? 0;
        groups.set(service.consultant_id, {
          consultantId: service.consultant_id,
          consultantName: service.consultant_name || "Shetu Consultant",
          consultantImage: service.consultant_image ?? null,
          verificationStatus: service.consultant_verification_status ?? "pending",
          subscriptionStatus: service.consultant_subscription_status ?? "none",
          joinedAt: service.consultant_joined_at ?? null,
          rating: service.consultant_rating ?? 0,
          reviewCount,
          countries: countryName ? [{ id: countryId, name: countryName, image: countryImage }] : [],
          services: [service],
          subjectNames,
          studyLevelNames,
          searchBlob: [
            service.consultant_name ?? "",
            service.title,
            service.description,
            countryName,
            ...serviceCategoryNames,
            ...subjectNames,
            ...studyLevelNames,
          ].join(" ").toLowerCase(),
        });
        continue;
      }

      existing.services.push(service);
      if (countryName && !existing.countries.some((item) => item.id === countryId)) {
        existing.countries.push({ id: countryId, name: countryName, image: countryImage });
      }

      existing.subjectNames = uniqueStrings([...existing.subjectNames, ...subjectNames]);
      existing.studyLevelNames = uniqueStrings([...existing.studyLevelNames, ...studyLevelNames]);
      existing.searchBlob = [
        existing.searchBlob,
        service.title,
        service.description,
        countryName,
        ...serviceCategoryNames,
        ...subjectNames,
        ...studyLevelNames,
      ].join(" ").toLowerCase();

      const reviewCount = service.consultant_review_count ?? 0;
      const weightedReviews = existing.reviewCount + reviewCount;
      if (weightedReviews > 0) {
        existing.rating = Number(
          (
            ((existing.rating * existing.reviewCount) + ((service.consultant_rating ?? 0) * reviewCount)) /
            weightedReviews
          ).toFixed(1),
        );
        existing.reviewCount = weightedReviews;
      }
    }

    return [...groups.values()].sort((left, right) => {
      const leftScore = Number(left.subscriptionStatus === "pro") + Number(left.verificationStatus === "accepted");
      const rightScore = Number(right.subscriptionStatus === "pro") + Number(right.verificationStatus === "accepted");
      if (rightScore !== leftScore) return rightScore - leftScore;
      if (right.rating !== left.rating) return right.rating - left.rating;
      return left.consultantName.localeCompare(right.consultantName);
    });
  }, [activeServices]);

  const courseOptions = useMemo(() => {
    const subjectNames = activeServices.flatMap((service) =>
      service.subject_names?.length ? service.subject_names : (service.service_category_names ?? []),
    );
    const serviceNames = activeServices.flatMap((service) => service.service_category_names ?? []);
    const names = mergeSuggestionSources(
      getSubjectSuggestionList(subjectNames),
      getServiceSuggestionList(serviceNames),
    );

    return includeCurrentOption(names, courseFilter);
  }, [activeServices, courseFilter]);

  const studyLevelOptions = useMemo(() => {
    const names = getStudyLevelSuggestionList([
      ...studyLevels.map((item) => item.name),
      ...activeServices.flatMap((service) => service.study_level_names ?? []),
    ]);

    return includeCurrentOption(names, studyLevelFilter);
  }, [activeServices, studyLevelFilter, studyLevels]);

  const countryOptions = useMemo(() => {
    const names = getCountrySuggestionList([
      ...countries.map((item) => item.name),
      ...activeServices.map((service) => service.country_name ?? ""),
    ]);

    return includeCurrentOption(names, countryFilter);
  }, [activeServices, countries, countryFilter]);

  const filteredConsultants = useMemo(() => {
    const normalizedKeyword = normalize(keyword);
    const normalizedCourse = normalize(courseFilter);
    const normalizedStudyLevel = normalize(studyLevelFilter);
    const normalizedCountry = normalize(countryFilter);
    const maxBudget = Number(budgetFilter);
    const shouldFilterBudget = Number.isFinite(maxBudget) && maxBudget > 0;

    return groupedConsultants.filter((consultant) => {
      const matchesKeyword = !normalizedKeyword || consultant.searchBlob.includes(normalizedKeyword);
      const matchesCourse =
        !normalizedCourse ||
        consultant.subjectNames.some((subject) => normalize(subject).includes(normalizedCourse)) ||
        consultant.services.some((service) =>
          (service.service_category_names ?? []).some((name) => normalize(name).includes(normalizedCourse)),
        );
      const matchesStudyLevel =
        !normalizedStudyLevel ||
        consultant.studyLevelNames.some((level) => normalize(level).includes(normalizedStudyLevel));
      const matchesCountry =
        !normalizedCountry ||
        consultant.countries.some((country) => normalize(country.name).includes(normalizedCountry));
      const matchesBudget =
        !shouldFilterBudget ||
        consultant.services.some((service) => {
          const price = Number(service.price);
          return Number.isFinite(price) && price > 0 && price <= maxBudget;
        });

      return matchesKeyword && matchesCourse && matchesStudyLevel && matchesCountry && matchesBudget;
    });
  }, [budgetFilter, countryFilter, courseFilter, groupedConsultants, keyword, studyLevelFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConsultants.length / CONSULTANTS_PER_PAGE));
  const currentPage = Number.isFinite(page) && page > 0 ? Math.min(page, totalPages) : 1;

  const paginatedConsultants = useMemo(() => {
    const start = (currentPage - 1) * CONSULTANTS_PER_PAGE;
    return filteredConsultants.slice(start, start + CONSULTANTS_PER_PAGE);
  }, [currentPage, filteredConsultants]);

  const paginationItems = useMemo(() => {
    const items = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return [...items].filter((item) => item >= 1 && item <= totalPages).sort((left, right) => left - right);
  }, [currentPage, totalPages]);

  const selectedKeywords = useMemo(
    () => [keyword, courseFilter, studyLevelFilter, countryFilter, budgetFilter ? `${budgetFilter}` : ""].filter(Boolean),
    [budgetFilter, countryFilter, courseFilter, keyword, studyLevelFilter],
  );

  const navigateWithParams = (
    nextKeyword: string,
    nextCourse: string,
    nextStudyLevel: string,
    nextCountry: string,
    nextBudget: string,
    nextPage = 1,
  ) => {
    const nextUrl = buildUrl(
      pathname,
      {
        keyword: nextKeyword,
        course: nextCourse,
        studyLevel: nextStudyLevel,
        country: nextCountry,
        budget: nextBudget,
      },
      nextPage,
    );

    startTransition(() => {
      router.push(nextUrl as Route);
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithParams(keywordInput, courseInput, studyLevelInput, countryInput, budgetInput, 1);
  };

  const clearFilters = () => {
    setKeywordInput("");
    setCourseInput("");
    setStudyLevelInput("");
    setCountryInput("");
    setBudgetInput("");
    navigateWithParams("", "", "", "", "", 1);
  };

  const tabItems: Array<{ key: ResultTab; icon: string; label: string }> = [
    { key: "courses", icon: "fa-book", label: t("search_results_tab_courses") },
    { key: "countries", icon: "fa-globe", label: t("search_results_tab_countries") },
    { key: "scholarships", icon: "fa-hourglass-half", label: t("search_results_tab_scholarships") },
    { key: "universities", icon: "fa-building-columns", label: t("search_results_tab_universities") },
    { key: "budget", icon: "fa-sack-dollar", label: t("search_results_tab_budget") },
  ];

  return (
    <section className="legacy-consultants-list legacy-search-results-section">
      <div className="legacy-shell-container">
        <div className="legacy-search-results-grid">
          <aside className="legacy-search-results-sidebar">
            <div className="legacy-filter-card legacy-search-results-filter">
              <div className="legacy-filter-inner">
                <form onSubmit={handleSearch} className="legacy-search-results-form">
                  <div className="legacy-search-box">
                    <div className="legacy-search-field">
                      <input
                        name="keyword"
                        type="search"
                        value={keywordInput}
                        onChange={(event) => setKeywordInput(event.target.value)}
                        placeholder={t("consultants_search_placeholder")}
                      />
                      <button type="submit" aria-label={t("consultants_search_btn")}>
                        <i className="fa-solid fa-magnifying-glass" />
                      </button>
                    </div>
                  </div>

                  <p className="legacy-filter-headline">{t("search_results_filter_headline")}</p>

                  <div className="legacy-search-tab-grid">
                    {tabItems.map((item) => {
                      const href = buildUrl(
                        RESULT_TAB_ROUTES[item.key],
                        {
                          keyword,
                          course: courseFilter,
                          studyLevel: studyLevelFilter,
                          country: countryFilter,
                          budget: budgetFilter,
                        },
                        1,
                      );

                      return (
                        <Link
                          key={item.key}
                          href={href as Route}
                          className={`legacy-search-tab ${item.key === activeTab ? "is-active" : ""}`}
                        >
                          <i className={`fa-solid ${item.icon}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="legacy-filter-fields">
                    <div className="legacy-filter-field">
                      <label htmlFor="search-result-course">{t("search_results_course_label")}</label>
                      <input
                        id="search-result-course"
                        name="course"
                        type="text"
                        list="search-result-course-list"
                        value={courseInput}
                        onChange={(event) => setCourseInput(event.target.value)}
                        placeholder={t("search_results_any_option")}
                      />
                      <datalist id="search-result-course-list">
                        {courseOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="legacy-filter-field">
                      <label htmlFor="search-result-study-level">{t("search_results_study_level_label")}</label>
                      <input
                        id="search-result-study-level"
                        name="studyLevel"
                        type="text"
                        list="search-result-study-level-list"
                        value={studyLevelInput}
                        onChange={(event) => setStudyLevelInput(event.target.value)}
                        placeholder={t("search_results_any_option")}
                      />
                      <datalist id="search-result-study-level-list">
                        {studyLevelOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="legacy-filter-field">
                      <label htmlFor="search-result-country">{t("search_results_country_label")}</label>
                      <input
                        id="search-result-country"
                        name="country"
                        type="text"
                        list="search-result-country-list"
                        value={countryInput}
                        onChange={(event) => setCountryInput(event.target.value)}
                        placeholder={t("search_results_any_option")}
                      />
                      <datalist id="search-result-country-list">
                        {countryOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </datalist>
                    </div>

                    <div className="legacy-filter-field">
                      <label htmlFor="search-result-budget">{t("search_results_budget_label")}</label>
                      <input
                        id="search-result-budget"
                        name="budget"
                        type="number"
                        min="0"
                        value={budgetInput}
                        onChange={(event) => setBudgetInput(event.target.value)}
                        placeholder={t("search_results_budget_placeholder")}
                      />
                    </div>
                  </div>

                  <button type="submit" className="legacy-filter-submit">
                    {t("consultants_search_btn")} <i className="fa-solid fa-magnifying-glass" />
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <div className="legacy-search-results-content">
            <div className="legacy-search-results-header">
              <div>
                <h1>{t("search_results_title")}</h1>
                <div className="legacy-search-selected-keywords">
                  <span>{t("search_results_selected_keywords")}</span>
                  <div className="legacy-search-keyword-badges">
                    {selectedKeywords.length > 0 ? (
                      selectedKeywords.map((item) => (
                        <span key={item} className="legacy-search-keyword-badge">{item}</span>
                      ))
                    ) : (
                      <span className="legacy-search-keyword-badge muted">{t("search_results_all_consultants")}</span>
                    )}
                  </div>
                </div>
              </div>

              <h2>{t("search_results_consultant_services")}</h2>
            </div>

            <div className="legacy-consultants-results-bar">
              <p>{filteredConsultants.length} {t("consultants_results_count")}</p>
              {(keyword || courseFilter || studyLevelFilter || countryFilter || budgetFilter) ? (
                <button
                  type="button"
                  className="legacy-clear-btn"
                  onClick={clearFilters}
                >
                  {t("consultants_clear_filters")}
                </button>
              ) : null}
            </div>

            <div className="space-y-6">
              {isLoading || isPending ? (
                <div className="py-16 text-center text-[var(--legacy-muted)]">
                  <i className="fa-solid fa-spinner fa-spin text-3xl mb-4" />
                  <p className="text-xl font-bold">{t("consultants_loading")}</p>
                </div>
              ) : filteredConsultants.length === 0 ? (
                <div className="py-16 text-center text-[var(--legacy-muted)]">
                  <i className="fa-solid fa-user-slash text-4xl mb-4" />
                  <p className="text-xl font-bold">{t("consultants_no_results")}</p>
                  <button
                    type="button"
                    className="legacy-clear-link"
                    onClick={clearFilters}
                  >
                    {t("consultants_clear_filters")}
                  </button>
                </div>
              ) : (
                <>
                  {paginatedConsultants.map((consultant) => {
                    const primaryCountry = consultant.countries[0];
                    const consultantTitle = consultant.services[0]?.title ?? "Consultant Service";
                    const consultantSummary = consultant.services[0]?.description ?? "";
                    const isPro = consultant.subscriptionStatus === "pro";
                    const isVerified = consultant.verificationStatus === "accepted";
                    const joinedDate = formatJoinedDate(consultant.joinedAt, lang);

                    return (
                      <div key={consultant.consultantId} className="legacy-consult-card">
                        <div className="legacy-consult-profile">
                          <div className="legacy-consult-avatar">
                            <img
                              src={consultant.consultantImage ?? "/legacy/no-profile-img.png"}
                              alt={consultant.consultantName}
                            />
                            {isPro && (
                              <span className="legacy-pro-badge">
                                <i className="fa-solid fa-crown" /> {t("consultants_pro")}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="legacy-consult-name">{consultant.consultantName}</h3>
                            <p className="mt-2 text-lg text-[#6b7280]">{consultantTitle}</p>

                            <div className="legacy-rating-row">
                              <span className="legacy-rating-pill">
                                {consultant.rating.toFixed(1)} {renderStars(consultant.rating)}
                              </span>
                              <span className="legacy-meta-pill green">
                                {t("consultants_delivery")} {formatDurationDays(consultant.services[0]?.duration)}
                              </span>
                              <span className="legacy-meta-pill blue">
                                {consultant.reviewCount} {t("consultants_reviews")}
                              </span>
                              {isVerified && (
                                <span className="legacy-meta-pill blue">
                                  <i className="fa-solid fa-shield-halved mr-1" /> {t("consultants_verified")}
                                </span>
                              )}
                            </div>

                            <p className="legacy-consult-summary">{consultantSummary}</p>

                            {consultant.subjectNames.length > 0 && (
                              <div className="legacy-detail-group">
                                <strong>{t("consultants_subjects")}</strong>
                                <div className="legacy-tag-row">
                                  {consultant.subjectNames.slice(0, 4).map((subject) => (
                                    <span key={subject} className="legacy-mini-tag">{subject}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {consultant.studyLevelNames.length > 0 && (
                              <div className="legacy-detail-group">
                                <strong>{t("consultants_study_level")}</strong>
                                <div className="legacy-tag-row">
                                  {consultant.studyLevelNames.slice(0, 4).map((level) => (
                                    <span key={level} className="legacy-study-badge">{level}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="legacy-services-box">
                          <h4 className="text-lg font-extrabold text-[#374151]">{t("consultants_services_heading")}</h4>
                          {consultant.services.slice(0, 3).map((option) => (
                            <div key={option.id} className="legacy-service-option">
                              <div className="legacy-service-option-head">
                                <span>
                                  <i className="fa-solid fa-certificate mr-2 text-[#8b5cf6]" />
                                  {option.title}
                                </span>
                                <span className="legacy-service-price">{formatPrice(option.price, lang)}</span>
                              </div>
                              <Link
                                href={`/consultants-profile-details-view/${consultant.consultantId}` as Route}
                                className="legacy-request-btn"
                              >
                                {t("consultants_request_btn")}
                              </Link>
                            </div>
                          ))}
                        </div>

                        <div className="legacy-country-pane">
                          <div>
                            <img
                              src={primaryCountry?.image ?? "/legacy/img-preview.png"}
                              alt={primaryCountry?.name ?? ""}
                              className="legacy-country-flag"
                            />
                            <p className="legacy-country-name">{primaryCountry?.name ?? "Country"}</p>
                            <div className="legacy-country-meta">
                              {joinedDate ? (
                                <p>
                                  <i className="fa-regular fa-calendar mr-2" />
                                  {t("consultants_joined")} {joinedDate}
                                </p>
                              ) : null}
                              <p>
                                <i className="fa-solid fa-shield-halved mr-2" />
                                {isVerified ? t("consultants_verified_consultant") : t("consultants_background_check")}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/consultants-profile-details-view/${consultant.consultantId}` as Route}
                            className="legacy-view-profile"
                          >
                            {t("consultants_view_profile")}
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {totalPages > 1 && (
                    <nav className="legacy-pagination" aria-label="Search result pagination">
                      <button
                        type="button"
                        className="legacy-page-btn"
                        disabled={currentPage <= 1}
                        onClick={() =>
                          navigateWithParams(keyword, courseFilter, studyLevelFilter, countryFilter, budgetFilter, currentPage - 1)
                        }
                      >
                        Â«
                      </button>

                      {paginationItems.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`legacy-page-btn ${item === currentPage ? "is-active" : ""}`}
                          onClick={() =>
                            navigateWithParams(keyword, courseFilter, studyLevelFilter, countryFilter, budgetFilter, item)
                          }
                        >
                          {item}
                        </button>
                      ))}

                      <button
                        type="button"
                        className="legacy-page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                          navigateWithParams(keyword, courseFilter, studyLevelFilter, countryFilter, budgetFilter, currentPage + 1)
                        }
                      >
                        Â»
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ConsultantSearchResults() {
  return <SearchResultContent />;
}
