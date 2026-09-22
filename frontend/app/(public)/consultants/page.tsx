"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
  Suspense,
  type FormEvent,
  type MouseEvent,
} from "react";

import { useLang } from "@/components/layout/lang-provider";
import { getConsultantServices, type ConsultantService } from "@/lib/api/consultants";
import { getCountries, type Country } from "@/lib/api/catalog";
import { getCountryFlagUrl } from "@/lib/country-flags";
import { getCountrySuggestionList } from "@/lib/shared-suggestion-catalog";
import { formatDurationDays } from "@/lib/formatters";

const CONSULTANTS_PER_PAGE = 6;

type ConsultantCountry = {
  id: number;
  name: string;
  image: string | null;
};

type ConsultantGroup = {
  groupKey: string;
  consultantId: number;
  consultantName: string;
  consultantImage: string | null;
  verificationStatus: string;
  subscriptionStatus: string;
  joinedAt: string | null;
  rating: number;
  reviewCount: number;
  totalCountryCount: number;
  countries: ConsultantCountry[];
  services: ConsultantService[];
  subjectNames: string[];
  studyLevelNames: string[];
  searchBlob: string;
};

function uniqueStrings(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
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

function formatPrice(value: string | null | undefined) {
  const numeric = Number(value ?? "");
  if (!Number.isFinite(numeric) || numeric <= 0) return "Free / N/A";
  return `BDT ${numeric.toLocaleString("en-US")}`;
}

function formatJoinedDate(value: string | null, lang: "en" | "bn") {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatExperience(value: string | null) {
  if (!value) return "0 yrs";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "0 yrs";
  const diffMs = Date.now() - parsed.getTime();
  const years = Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 1) return "<1 yr";
  return `${Math.floor(years)} yrs`;
}

function getServiceLabel(service: ConsultantService) {
  return service.service_category_names?.[0] || service.title || "Consulting";
}

function getPrimarySummary(service: ConsultantService | undefined) {
  if (!service?.description) return "Personalized guidance for admissions, documentation, and study abroad planning.";
  return service.description;
}

function getDeliveryLabel(services: ConsultantService[]) {
  const values = services
    .map((service) => service.duration?.trim())
    .filter(Boolean);

  if (values.length === 0) return "N/A";

  return values.reduce((best, current) => {
    const bestNumber = Number.parseFloat(best);
    const currentNumber = Number.parseFloat(current);
    if (!Number.isFinite(bestNumber) || !Number.isFinite(currentNumber)) return best;
    return currentNumber < bestNumber ? current : best;
  });
}

function isInteractiveElement(target: HTMLElement | null) {
  if (!target) return false;
  return Boolean(
    target.closest('a, button, input, select, textarea, summary, [role="button"], [role="link"]'),
  );
}

function ConsultantsContent() {
  const { lang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [services, setServices] = useState<ConsultantService[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const legacyCountryFilter = searchParams.get("country") ?? "";
  const keyword = searchParams.get("keyword") ?? legacyCountryFilter;
  const page = Number(searchParams.get("page") ?? "1");

  const [keywordInput, setKeywordInput] = useState(keyword);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const deferredKeywordInput = useDeferredValue(keywordInput);

  const keepCardSurfaceInert = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveElement(event.target as HTMLElement | null)) {
      return;
    }

    event.stopPropagation();
  };

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  useEffect(() => {
    Promise.allSettled([getConsultantServices({ scope: "public" }), getCountries()])
      .then(([serviceResult, countryResult]) => {
        const serviceList = takeFulfilledValue(serviceResult) ?? [];
        const countryList = takeFulfilledValue(countryResult) ?? [];

        setServices(serviceList);
        setCountries(countryList);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const countryOptions = useMemo(
    () => getCountrySuggestionList(countries.map((item) => item.name)),
    [countries],
  );

  const activeServices = useMemo(
    () => services.filter((service) => service.status === "active"),
    [services],
  );

  const groupedConsultants = useMemo(() => {
    const groups = new Map<string, ConsultantGroup>();
    const countryCounts = new Map<number, Set<number>>();

    for (const service of activeServices) {
      if (!countryCounts.has(service.consultant_id)) {
        countryCounts.set(service.consultant_id, new Set<number>());
      }
      countryCounts.get(service.consultant_id)?.add(service.country_id);
    }

    for (const service of activeServices) {
      const countryName = service.country_name ?? "";
      const countryImage = countryName ? service.country_image ?? getCountryFlagUrl(countryName) : null;
      const countryId = service.country_id;
      const groupKey = `${service.consultant_id}:${countryId}`;
      const existing = groups.get(groupKey);
      const serviceCategoryNames = uniqueStrings(service.service_category_names ?? []);
      const collectedSubjectNames = uniqueStrings([
        ...(service.subject_names ?? []),
        ...(service.subject_names_input ?? []),
      ]);
      const subjectNames = collectedSubjectNames.length > 0 ? collectedSubjectNames : serviceCategoryNames;
      const studyLevelNames = uniqueStrings(service.study_level_names ?? []);

      if (!existing) {
        const reviewCount = service.consultant_review_count ?? 0;
        groups.set(groupKey, {
          groupKey,
          consultantId: service.consultant_id,
          consultantName: service.consultant_name || "Shetu Consultant",
          consultantImage: service.consultant_image ?? null,
          verificationStatus: service.consultant_verification_status ?? "pending",
          subscriptionStatus: service.consultant_subscription_status ?? "none",
          joinedAt: service.consultant_joined_at ?? null,
          rating: service.consultant_rating ?? 0,
          reviewCount,
          totalCountryCount: countryCounts.get(service.consultant_id)?.size ?? 1,
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

  const filteredConsultants = useMemo(() => {
    const searchTerms = tokenize(keyword);

    return groupedConsultants.filter((consultant) => {
      if (searchTerms.length === 0) return true;
      return searchTerms.every((term) => consultant.searchBlob.includes(term));
    });
  }, [groupedConsultants, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredConsultants.length / CONSULTANTS_PER_PAGE));
  const currentPage = Number.isFinite(page) && page > 0 ? Math.min(page, totalPages) : 1;

  const paginatedConsultants = useMemo(() => {
    const start = (currentPage - 1) * CONSULTANTS_PER_PAGE;
    return filteredConsultants.slice(start, start + CONSULTANTS_PER_PAGE);
  }, [currentPage, filteredConsultants]);

  const topCountryChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const consultant of groupedConsultants) {
      for (const country of consultant.countries) {
        counts.set(country.name, (counts.get(country.name) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 8);
  }, [groupedConsultants]);

  const latestServicesCount = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    return activeServices.filter((service) => {
      const createdAt = Date.parse(service.created_at);
      return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
    }).length;
  }, [activeServices]);

  const coveredCountriesCount = useMemo(() => {
    const covered = new Set<string>();
    groupedConsultants.forEach((consultant) => {
      consultant.countries.forEach((country) => covered.add(country.name));
    });
    return covered.size;
  }, [groupedConsultants]);

  const totalConsultantsCount = useMemo(() => {
    const consultantIds = new Set<number>();
    groupedConsultants.forEach((consultant) => {
      consultantIds.add(consultant.consultantId);
    });
    return consultantIds.size;
  }, [groupedConsultants]);

  const topStats = [
    {
      value: String(coveredCountriesCount),
      title: "Countries",
      subtitle: "Total Countries",
      icon: "fa-flag",
    },
    {
      value: String(totalConsultantsCount),
      title: "Consultants",
      subtitle: "Total Consultants",
      icon: "fa-users",
    },
    {
      value: String(activeServices.length),
      title: "Services",
      subtitle: "Total Services",
      icon: "fa-list-check",
    },
    {
      value: String(latestServicesCount),
      title: "Latest",
      subtitle: "Services in last 7 days",
      icon: "fa-download",
    },
  ];

  const paginationItems = useMemo(() => {
    const items = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return [...items].filter((item) => item >= 1 && item <= totalPages).sort((left, right) => left - right);
  }, [currentPage, totalPages]);

  const searchSuggestions = useMemo(() => {
    const serviceNames = uniqueStrings(
      activeServices.flatMap((service) => [
        service.title,
        ...(service.service_category_names ?? []),
      ]),
    );
    const subjectNames = uniqueStrings(
      activeServices.flatMap((service) => [
        ...(service.subject_names ?? []),
        ...(service.subject_names_input ?? []),
      ]),
    );

    return uniqueStrings([
      ...topCountryChips.map(([name]) => name),
      ...countryOptions.slice(0, 24),
      ...serviceNames.slice(0, 18),
      ...subjectNames.slice(0, 18),
      "Scholarship",
      "Scholarships",
      "Course",
      "Admission",
      "Application Review",
      "Visa Processing",
      "Bachelor's Degree",
      "Master's Degree",
    ]).slice(0, 60);
  }, [activeServices, countryOptions, topCountryChips]);

  const typedSuggestions = useMemo(() => {
    const terms = tokenize(deferredKeywordInput);
    if (terms.length === 0) return [];

    return searchSuggestions
      .filter((option) => {
        const normalizedOption = normalize(option);
        return terms.every((term) => normalizedOption.includes(term));
      })
      .filter((option) => normalize(option) !== normalize(deferredKeywordInput))
      .slice(0, 8);
  }, [deferredKeywordInput, searchSuggestions]);

  const navigateWithParams = (nextKeyword: string, nextPage = 1) => {
    const params = new URLSearchParams();
    if (nextKeyword.trim()) params.set("keyword", nextKeyword.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

    startTransition(() => {
      router.push(nextUrl as Route);
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithParams(keywordInput, 1);
  };

  const renderPagination = (placement: "top" | "bottom" = "top") => {
    if (totalPages <= 1) return null;

    return (
      <nav
        className={`legacy-pagination legacy-pagination--consultants ${placement === "bottom" ? "is-bottom" : "is-top"}`}
        aria-label="Consultants pagination"
      >
        <button
          type="button"
          className="legacy-page-btn"
          disabled={currentPage <= 1}
          onClick={() => navigateWithParams(keyword, currentPage - 1)}
        >
          <i className="fa-solid fa-angle-left" /> Back
        </button>

        {paginationItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`legacy-page-btn ${item === currentPage ? "is-active" : ""}`}
            onClick={() => navigateWithParams(keyword, item)}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          className="legacy-page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => navigateWithParams(keyword, currentPage + 1)}
        >
          Next <i className="fa-solid fa-angle-right" />
        </button>
      </nav>
    );
  };

  return (
    <div className="legacy-consultants-page-v2">
      <section className="legacy-consultants-hero">
        <div className="legacy-consultants-hero__globe" aria-hidden="true" />
        <div className="legacy-shell-container">
          <div className="legacy-consultants-hero__stats">
            {topStats.map((item) => (
              <article key={item.subtitle} className="legacy-consultants-hero__stat">
                <div className="legacy-consultants-hero__stat-icon">
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <strong>{item.value} {item.title}</strong>
                <span>{item.subtitle}</span>
              </article>
            ))}
          </div>

          <div className="legacy-consultants-hero__search-panel">
            <form className="legacy-consultants-hero__search-form" onSubmit={handleSearch}>
              <div className="legacy-consultants-hero__search-shell">
                <label className="legacy-consultants-hero__keyword">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    name="keyword"
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    onFocus={() => setIsSuggestionOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setIsSuggestionOpen(false), 120);
                    }}
                    placeholder="Search with any keywords (subject, scholarship, course, country)"
                  />
                  <span className="legacy-consultants-hero__keyword-action" aria-hidden="true">
                    <i className="fa-solid fa-microphone-lines" />
                  </span>
                </label>

                {isSuggestionOpen && typedSuggestions.length > 0 ? (
                  <div className="legacy-consultants-hero__suggestions" role="listbox" aria-label="Search suggestions">
                    {typedSuggestions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="legacy-consultants-hero__suggestion"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setKeywordInput(option);
                          setIsSuggestionOpen(false);
                          navigateWithParams(option, 1);
                        }}
                      >
                        <i className="fa-solid fa-clock-rotate-left" />
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button type="submit" className="legacy-consultants-hero__submit">
                <i className="fa-solid fa-magnifying-glass" />
                {t("consultants_search_btn")}
              </button>
            </form>

            <div className="legacy-consultants-hero__countries">
              <span>Search by country</span>
              <div className="legacy-consultants-hero__chips">
                {topCountryChips.map(([name]) => (
                  <button
                    key={name}
                    type="button"
                    className={`legacy-consultants-hero__chip ${normalize(keyword) === normalize(name) ? "is-active" : ""}`}
                    onClick={() => {
                      setKeywordInput(name);
                      navigateWithParams(name, 1);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="legacy-consultants-showcase">
        <div className="legacy-shell-container">
          <div className="legacy-consultants-showcase__header">
            <div>
              <h2>See country-wise top Consultants for your higher study</h2>
              <p>
                Our experts offer tailored advice to help you navigate every step of your academic journey,
                from choosing institutions to preparing documents and visa applications.
              </p>
            </div>

            <div className="legacy-consultants-showcase__actions">
              {renderPagination("top")}
              {keyword ? (
                <button
                  type="button"
                  className="legacy-clear-btn"
                  onClick={() => {
                    setKeywordInput("");
                    navigateWithParams("", 1);
                  }}
                >
                  {t("consultants_clear_filters")}
                </button>
              ) : null}
            </div>
          </div>

          {isLoading || isPending ? (
            <div className="legacy-consultants-showcase__state">
              <i className="fa-solid fa-spinner fa-spin" />
              <p>{t("consultants_loading")}</p>
            </div>
          ) : filteredConsultants.length === 0 ? (
            <div className="legacy-consultants-showcase__state">
              <i className="fa-solid fa-user-slash" />
              <p>{t("consultants_no_results")}</p>
              {keyword ? (
                <button
                  type="button"
                  className="legacy-clear-btn"
                  onClick={() => {
                    setKeywordInput("");
                    navigateWithParams("", 1);
                  }}
                >
                  {t("consultants_clear_filters")}
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="legacy-consultants-grid">
                {paginatedConsultants.map((consultant) => {
                  const primaryCountry = consultant.countries[0];
                  const joinedDate = formatJoinedDate(consultant.joinedAt, lang);
                  const experience = formatExperience(consultant.joinedAt);
                  const delivery = getDeliveryLabel(consultant.services);
                  const isPro = consultant.subscriptionStatus === "pro";
                  const isVerified = consultant.verificationStatus === "accepted";
                  const summary = getPrimarySummary(consultant.services[0]);

                  return (
                    <article
                      key={consultant.groupKey}
                      className="legacy-consultant-card-v2"
                      onClickCapture={keepCardSurfaceInert}
                    >
                      <div className="legacy-consultant-card-v2__top">
                        <div className="legacy-consultant-card-v2__identity">
                          <div className="legacy-consultant-card-v2__avatar-wrap">
                            <img
                              src={consultant.consultantImage ?? "/legacy/no-profile-img.png"}
                              alt={consultant.consultantName}
                              className="legacy-consultant-card-v2__avatar"
                            />
                            {isPro ? (
                              <span className="legacy-consultant-card-v2__badge">Pro</span>
                            ) : null}
                          </div>

                          <div className="legacy-consultant-card-v2__meta">
                            <div className="legacy-consultant-card-v2__name-row">
                              <h3>{consultant.consultantName}</h3>
                              {isVerified ? <i className="fa-solid fa-circle-check" aria-hidden="true" /> : null}
                            </div>
                            <p className="legacy-consultant-card-v2__subtitle">
                              {consultant.services[0]?.title || "Study abroad consultant"}
                            </p>
                            <div className="legacy-consultant-card-v2__rating">
                              <span className="legacy-consultant-card-v2__stars">{renderStars(consultant.rating)}</span>
                              <strong>{consultant.rating.toFixed(1)}</strong>
                              <span>({consultant.reviewCount} reviews)</span>
                            </div>
                            <p className="legacy-consultant-card-v2__summary">{summary}</p>
                          </div>
                        </div>

                        <div className="legacy-consultant-card-v2__flag" aria-label={primaryCountry?.name || "Global consultant coverage"}>
                          {primaryCountry?.image || primaryCountry?.name ? (
                            <img
                              src={primaryCountry?.image ?? getCountryFlagUrl(primaryCountry?.name ?? "")}
                              alt={primaryCountry?.name || "Country flag"}
                            />
                          ) : (
                            <i className="fa-solid fa-globe" aria-hidden="true" />
                          )}
                          <span>{primaryCountry?.name || "Global"}</span>
                        </div>
                      </div>

                      <div className="legacy-consultant-card-v2__metrics">
                        <div>
                          <strong>{joinedDate}</strong>
                          <span>Joining Date</span>
                        </div>
                        <div>
                          <strong>{experience}</strong>
                          <span>Experience</span>
                        </div>
                        <div>
                          <strong>{formatDurationDays(delivery)}</strong>
                          <span>Standard Delivery</span>
                        </div>
                        <div>
                          <strong>{consultant.services.length} types</strong>
                          <span>Available Services</span>
                        </div>
                      </div>

                      <div className="legacy-consultant-card-v2__details">
                        <div className="legacy-consultant-card-v2__tags">
                          <div className="legacy-consultant-card-v2__tag-group">
                            <strong>
                              <i className="fa-solid fa-layer-group" /> Study Level:
                            </strong>
                            <div className="legacy-consultant-card-v2__tag-row">
                              {consultant.studyLevelNames.length > 0 ? (
                                consultant.studyLevelNames.slice(0, 4).map((level) => (
                                  <span key={level} className="legacy-study-badge">
                                    {level}
                                  </span>
                                ))
                              ) : (
                                <span className="legacy-consultant-card-v2__empty-chip">General guidance</span>
                              )}
                            </div>
                          </div>

                          {consultant.subjectNames.length > 0 ? (
                            <div className="legacy-consultant-card-v2__tag-group">
                              <strong>
                                <i className="fa-solid fa-book-open" /> Subjects:
                              </strong>
                              <div className="legacy-consultant-card-v2__tag-row">
                                {consultant.subjectNames.slice(0, 4).map((subject) => (
                                  <span key={subject} className="legacy-mini-tag">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="legacy-consultant-card-v2__services">
                          <p>Services to send request</p>
                          {consultant.services.slice(0, 3).map((service) => (
                            <div key={service.id} className="legacy-consultant-card-v2__service-row">
                              <div className="legacy-consultant-card-v2__service-meta">
                                <span>{getServiceLabel(service)}</span>
                                <strong>{formatPrice(service.price)}</strong>
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
                      </div>

                      <div className="legacy-consultant-card-v2__footer">
                        <span>
                          {consultant.totalCountryCount > 1
                            ? `Also serves ${consultant.totalCountryCount - 1} more countr${consultant.totalCountryCount - 1 > 1 ? "ies" : "y"}`
                            : "Country-wise consultant support"}
                        </span>
                        <Link
                          href={`/consultants-profile-details-view/${consultant.consultantId}` as Route}
                          className="legacy-view-profile"
                        >
                          {t("consultants_view_profile")}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="legacy-consultants-showcase__pagination-bottom">
                {renderPagination("bottom")}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ConsultantsPage() {
  return (
    <Suspense fallback={<div className="legacy-site"><p className="legacy-loading">Loading consultants...</p></div>}>
      <ConsultantsContent />
    </Suspense>
  );
}
