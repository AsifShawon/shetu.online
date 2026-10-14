"use client";

import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import {
  getCountries,
  getServices,
  getStudyLevels,
  type Country,
  type ServiceCategory,
  type StudyLevel,
} from "@/lib/api/catalog";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";
import { getConsultantServices, type ConsultantService } from "@/lib/api/consultants";
import { getStudentChoices, type StudentChoice } from "@/lib/api/students";
import { getCountrySuggestionList } from "@/lib/shared-suggestion-catalog";
import { getCountryFlagUrl } from "@/lib/country-flags";
import { formatDurationDays } from "@/lib/formatters";

function normalizeText(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function tokenize(value?: string | null) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function getDisplayTags(ids: number[], map: Map<number, string>, limit: number): string[] {
  const names = ids.map((id) => map.get(id)).filter((name): name is string => Boolean(name));
  return names.slice(0, limit);
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

function formatPrice(value: string | null | undefined) {
  const numeric = Number(value ?? "");
  if (!Number.isFinite(numeric) || numeric <= 0) return "Free / N/A";
  return `BDT ${numeric.toLocaleString("en-US")}`;
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

function getServiceLabel(service: ConsultantService) {
  return service.service_category_names?.[0] || service.title || "Consulting";
}

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function formatBudget(value?: string | number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Not specified";
  return `${amount.toLocaleString("en-BD")} BDT`;
}

function formatChoiceValue(value?: string | null) {
  const cleaned = (value ?? "").trim();
  return cleaned || "Not specified";
}

function getChoiceHref(choiceId: number) {
  return `/dashboard/consultants-of-eduwise?choice_id=${choiceId}` as Route;
}

function getChoiceSortValue(choice: StudentChoice) {
  if (!choice.created_at) return 0;
  const parsed = new Date(choice.created_at);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function buildSearchBlob(
  item: ConsultantService,
  countryName: string,
  categoryTags: string[],
  subjectTags: string[],
  levelTags: string[],
) {
  return [
    item.consultant_name ?? "",
    item.title,
    item.description,
    countryName,
    ...categoryTags,
    ...subjectTags,
    ...levelTags,
  ]
    .join(" ")
    .toLowerCase();
}

function getRecommendationReasons(
  item: ConsultantService,
  choice: StudentChoice | null,
  countryName: string,
  categoryTags: string[],
  subjectTags: string[],
) {
  if (!choice) return [];

  const reasons: string[] = [];
  if (item.country_id === choice.country_id) reasons.push("Country match");
  if (item.service_categories.includes(choice.service_id)) reasons.push("Service match");

  const choiceSubjectTokens = tokenize(choice.subject);
  if (
    choiceSubjectTokens.length > 0 &&
    choiceSubjectTokens.some((token) =>
      [item.title, item.description, ...subjectTags, ...categoryTags].some((value) =>
        normalizeText(value).includes(token),
      ),
    )
  ) {
    reasons.push("Subject match");
  }

  if (choice.institute && normalizeText(countryName).includes(normalizeText(choice.country_name))) {
    reasons.push("Destination aligned");
  }

  return reasons;
}

function getRecommendationScore(
  item: ConsultantService,
  choice: StudentChoice | null,
  countryName: string,
  categoryTags: string[],
  subjectTags: string[],
) {
  if (!choice) return 0;

  let score = 0;

  if (item.country_id === choice.country_id) score += 6;
  if (item.service_categories.includes(choice.service_id)) score += 5;

  const choiceSubjectTokens = tokenize(choice.subject);
  if (choiceSubjectTokens.length > 0) {
    const subjectBlob = [item.title, item.description, ...subjectTags, ...categoryTags].join(" ").toLowerCase();
    const matches = choiceSubjectTokens.filter((token) => subjectBlob.includes(token)).length;
    score += Math.min(matches, 3) * 2;
  }

  if (choice.institute && normalizeText(countryName).includes(normalizeText(choice.country_name))) {
    score += 1;
  }

  return score;
}

export function StudentConsultantsOfEduWise() {
  const searchParams = useSearchParams();
  const choiceIdParam = searchParams.get("choice_id");
  const { lang, t } = useLang();
  const { showToast } = useToast();

  const [choices, setChoices] = useState<StudentChoice[]>([]);
  const [services, setServices] = useState<ConsultantService[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");

  useEffect(() => {
    Promise.allSettled([
      getStudentChoices(),
      getConsultantServices({ scope: "public" }),
      getCountries(),
      getServices(),
      getStudyLevels(),
    ])
      .then(([choiceResult, serviceResult, countryResult, categoryResult, levelResult]) => {
        const choiceList = takeFulfilledValue(choiceResult) ?? [];
        const serviceList = takeFulfilledValue(serviceResult) ?? [];
        const countryList = takeFulfilledValue(countryResult) ?? [];
        const categoryList = takeFulfilledValue(categoryResult) ?? [];
        const levelList = takeFulfilledValue(levelResult) ?? [];

        setChoices(choiceList);
        setServices(serviceList.filter((item) => item.status === "active"));
        setCountries(countryList.filter((item) => item.status === "active"));
        setServiceCategories(categoryList.filter((item) => item.status === "active"));
        setStudyLevels(levelList.filter((item) => item.status === "active"));

        const failedKeys = [
          choiceResult.status === "rejected" ? "choices" : null,
          serviceResult.status === "rejected" ? "consultants" : null,
          countryResult.status === "rejected" ? "countries" : null,
          categoryResult.status === "rejected" ? "services" : null,
          levelResult.status === "rejected" ? "study levels" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some consultant data could not sync",
            message: `The recommendation page loaded with partial data while ${failedKeys.join(", ")} were unavailable.`,
          });
        }
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Unable to load consultant recommendations",
          message: getApiErrorMessage(error, "Please try again in a moment."),
        });
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const sortedChoices = useMemo(
    () => [...choices].sort((left, right) => getChoiceSortValue(right) - getChoiceSortValue(left)),
    [choices],
  );

  const selectedChoice = useMemo(() => {
    if (sortedChoices.length === 0) return null;
    if (!choiceIdParam) return sortedChoices[0];
    return sortedChoices.find((choice) => String(choice.id) === choiceIdParam) ?? sortedChoices[0];
  }, [choiceIdParam, sortedChoices]);

  useEffect(() => {
    if (!selectedChoice) {
      setServiceQuery("");
      setCountryQuery("");
      setKeywordQuery("");
      return;
    }

    setServiceQuery(selectedChoice.service_name ?? "");
    setCountryQuery(selectedChoice.country_name ?? "");
    setKeywordQuery(selectedChoice.subject ?? "");
  }, [selectedChoice]);

  const countryMap = useMemo(
    () => new Map(countries.map((item) => [item.id, item.name])),
    [countries],
  );
  const serviceCategoryMap = useMemo(
    () => new Map(serviceCategories.map((item) => [item.id, item.name])),
    [serviceCategories],
  );
  const studyLevelMap = useMemo(
    () => new Map(studyLevels.map((item) => [item.id, item.name])),
    [studyLevels],
  );
  const countryOptions = useMemo(
    () => getCountrySuggestionList(countries.map((item) => item.name), { authoritativeOnly: true }),
    [countries],
  );
  const serviceOptions = useMemo(
    () => serviceCategories.map((item) => item.name),
    [serviceCategories],
  );

  const rankedServices = useMemo(() => {
    const ranked = services.map((item) => {
      const categoryTags = item.service_category_names ?? getDisplayTags(item.service_categories, serviceCategoryMap, 8);
      const subjectTags = item.subject_names ?? [];
      const countryName = item.country_name ?? countryMap.get(item.country_id) ?? "Country";

      return {
        item,
        categoryTags,
        subjectTags,
        countryName,
        score: getRecommendationScore(item, selectedChoice, countryName, categoryTags, subjectTags),
        reasons: getRecommendationReasons(item, selectedChoice, countryName, categoryTags, subjectTags),
      };
    });

    const positiveMatches = selectedChoice ? ranked.filter((entry) => entry.score > 0) : ranked;
    const pool = positiveMatches.length > 0 ? positiveMatches : ranked;

    return pool.sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) return scoreDelta;

      const ratingDelta = (right.item.consultant_rating ?? 0) - (left.item.consultant_rating ?? 0);
      if (ratingDelta !== 0) return ratingDelta;

      const reviewDelta = (right.item.consultant_review_count ?? 0) - (left.item.consultant_review_count ?? 0);
      if (reviewDelta !== 0) return reviewDelta;

      return left.item.title.localeCompare(right.item.title);
    });
  }, [countryMap, selectedChoice, serviceCategoryMap, services]);

  const filteredServices = useMemo(() => {
    const serviceText = normalizeText(serviceQuery);
    const countryText = normalizeText(countryQuery);
    const keywordText = normalizeText(keywordQuery);

    return rankedServices.filter(({ item, categoryTags, subjectTags, countryName }) => {
      const levelTags = item.study_level_names ?? getDisplayTags(item.study_levels, studyLevelMap, 8);
      const searchableBlob = buildSearchBlob(item, countryName, categoryTags, subjectTags, levelTags);
      const serviceBlob = [item.title, ...categoryTags].join(" ").toLowerCase();

      const matchesService = !serviceText || serviceBlob.includes(serviceText);
      const matchesCountry = !countryText || countryName.toLowerCase().includes(countryText);
      const matchesKeyword = !keywordText || searchableBlob.includes(keywordText);

      return matchesService && matchesCountry && matchesKeyword;
    });
  }, [countryQuery, keywordQuery, rankedServices, serviceQuery, studyLevelMap]);

  const groupedFilteredConsultants = useMemo(() => {
    const groups = new Map<string, {
      consultantId: number;
      consultantName: string;
      consultantImage: string | null;
      rating: number;
      reviewCount: number;
      subscriptionStatus: string;
      verificationStatus: string;
      joinedAt: string | null;
      countryName: string;
      countryImage: string | null;
      services: ConsultantService[];
      subjectTags: string[];
      levelTags: string[];
      score: number;
      reasons: string[];
    }>();

    for (const entry of filteredServices) {
      const { item, categoryTags, subjectTags, countryName, score, reasons } = entry;
      const key = `${item.consultant_id}:${item.country_id}`;
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          consultantId: item.consultant_id,
          consultantName: item.consultant_name ?? "Shetu Consultant",
          consultantImage: item.consultant_image ?? null,
          rating: item.consultant_rating ?? 0,
          reviewCount: item.consultant_review_count ?? 0,
          subscriptionStatus: item.consultant_subscription_status ?? "none",
          verificationStatus: item.consultant_verification_status ?? "pending",
          joinedAt: item.consultant_joined_at ?? null,
          countryName,
          countryImage: item.country_image ?? null,
          services: [item],
          subjectTags: [...subjectTags],
          levelTags: item.study_level_names ?? getDisplayTags(item.study_levels, studyLevelMap, 8),
          score,
          reasons: [...reasons],
        });
      } else {
        existing.services.push(item);
        existing.subjectTags = [...new Set([...existing.subjectTags, ...subjectTags])];
        if (score > existing.score) {
          existing.score = score;
        }
        existing.reasons = [...new Set([...existing.reasons, ...reasons])];
      }
    }

    return [...groups.values()];
  }, [filteredServices, studyLevelMap]);

  const choiceSummaryCards = selectedChoice
    ? [
        { label: t("choice_col_country"), value: formatChoiceValue(selectedChoice.country_name), tone: "blue" },
        { label: t("choice_col_institute"), value: formatChoiceValue(selectedChoice.institute), tone: "green" },
        { label: "Subject / Course", value: formatChoiceValue(selectedChoice.subject), tone: "purple" },
        { label: "Session / Year", value: formatChoiceValue(selectedChoice.session), tone: "amber" },
        { label: t("choice_col_budget"), value: formatBudget(selectedChoice.budget), tone: "red" },
      ]
    : [];

  return (
    <div className="sd-section-stack">
      <section className="sd-consultants-hero">
        <div className="sd-consultants-hero-icon" aria-hidden="true">
          <i className="fa-solid fa-clipboard-check" />
        </div>
        <div>
          <h2>Consultant recommendations for your selected choice</h2>
          <p>
            This follows the V2 handoff: once a choice is created, you land here and see consultant matches based on the
            chosen destination, service, and subject.
          </p>
        </div>
      </section>

      {sortedChoices.length > 0 ? (
        <section className="sd-consultant-choice-panel">
          <div className="sd-consultant-choice-panel-head">
            <div>
              <h3>{t("dash_your_choice")}</h3>
              <p>Use a saved choice to narrow the consultant list and surface the strongest matches first.</p>
            </div>

            <div className="sd-consultant-choice-actions">
              <Link href={"/dashboard/student/choices" as Route} className="sd-btn-outline sd-btn-sm">
                View all choices
              </Link>
              <Link href={"/dashboard/student/choices/create" as Route} className="sd-btn-primary sd-btn-sm">
                {t("choice_create_btn")}
              </Link>
            </div>
          </div>

          <div className="sd-choice-switcher" aria-label="Saved study choices">
            {sortedChoices.map((choice) => {
              const isActive = selectedChoice?.id === choice.id;
              return (
                <Link
                  key={choice.id}
                  href={getChoiceHref(choice.id)}
                  className={`sd-choice-switcher-item ${isActive ? "is-active" : ""}`}
                >
                  <strong>{choice.country_name ?? "Choice"}</strong>
                  <span>{choice.subject || choice.service_name || "General support"}</span>
                </Link>
              );
            })}
          </div>

          {selectedChoice && (
            <div className="sd-selected-choice-grid">
              {choiceSummaryCards.map((card) => (
                <article key={card.label} className={`sd-selected-choice-card sd-selected-choice-card--${card.tone}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : !loading ? (
        <div className="sd-empty-state sd-empty-state--consultants">
          <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="No choices" />
          <p className="sd-empty-title">No saved choices found yet.</p>
          <p className="sd-empty-help">Create a study choice first so consultant recommendations can be tailored to it.</p>
          <Link href={"/dashboard/student/choices/create" as Route} className="sd-btn-primary">
            {t("choice_create_btn")}
          </Link>
        </div>
      ) : null}

      <section className="sd-consultants-filter-row" aria-label="Consultant filters">
        <label className="sd-consultants-filter">
          <span>Search by service</span>
          <div className="sd-consultants-filter-input">
            <input
              type="text"
              value={serviceQuery}
              onChange={(event) => setServiceQuery(event.target.value)}
              placeholder="Visa processing, assessment, admissions"
              list="sd-service-filter-options"
            />
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </div>
        </label>

        <label className="sd-consultants-filter">
          <span>Search by country</span>
          <div className="sd-consultants-filter-input">
            <input
              type="text"
              value={countryQuery}
              onChange={(event) => setCountryQuery(event.target.value)}
              placeholder="United Kingdom, Canada, Australia"
              list="sd-country-filter-options"
            />
            <i className="fa-solid fa-earth-americas" aria-hidden="true" />
          </div>
        </label>

        <label className="sd-consultants-filter">
          <span>Search with keywords</span>
          <div className="sd-consultants-filter-input">
            <input
              type="text"
              value={keywordQuery}
              onChange={(event) => setKeywordQuery(event.target.value)}
              placeholder="Computer science, scholarship, SOP"
            />
            <i className="fa-solid fa-sliders" aria-hidden="true" />
          </div>
        </label>

        <datalist id="sd-country-filter-options">
          {countryOptions.map((country) => (
            <option key={country} value={country} />
          ))}
        </datalist>

        <datalist id="sd-service-filter-options">
          {serviceOptions.map((service) => (
            <option key={service} value={service} />
          ))}
        </datalist>
      </section>

      <div className="sd-consultants-title-row">
        <i className="fa-solid fa-user-graduate" aria-hidden="true" />
        <div>
          <h3>{t("choice_choose_consultant")}</h3>
          <p>{groupedFilteredConsultants.length} consultants matched your current choice and filters.</p>
        </div>
      </div>

      {loading ? (
        <div className="sd-loading">Loading consultants...</div>
      ) : groupedFilteredConsultants.length === 0 ? (
        <div className="sd-empty-state sd-empty-state--consultants">
          <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="No consultants" />
          <p className="sd-empty-title">No consultants found for this choice.</p>
          <p className="sd-empty-help">Try changing the service, country, or keyword filters to widen the match.</p>
        </div>
      ) : (
        <div className="legacy-site">
          <section className="legacy-consultants-grid">
            {groupedFilteredConsultants.map((consultant) => {
              const joinedDate = formatJoinedDate(consultant.joinedAt, lang);
              const experience = formatExperience(consultant.joinedAt);
              const delivery = getDeliveryLabel(consultant.services);
              const isPro = consultant.subscriptionStatus === "pro";
              const isVerified = consultant.verificationStatus === "accepted";
              const summary = consultant.services[0]?.description || "Personalized guidance for study abroad planning.";

              return (
                <article
                  key={`${consultant.consultantId}:${consultant.countryName}`}
                  className="legacy-consultant-card-v2"
                >
                  <div className="legacy-consultant-card-v2__top">
                    <div className="legacy-consultant-card-v2__identity">
                      <div className="legacy-consultant-card-v2__avatar-wrap">
                        <img
                          src={getMediaUrl(consultant.consultantImage) ?? "/legacy/no-profile-img.png"}
                          alt={consultant.consultantName}
                          className="legacy-consultant-card-v2__avatar"
                        />
                        {isPro && (
                          <span className="legacy-consultant-card-v2__badge">Pro</span>
                        )}
                      </div>

                      <div className="legacy-consultant-card-v2__meta">
                        <div className="legacy-consultant-card-v2__name-row">
                          <h3>{consultant.consultantName}</h3>
                          {isVerified && <i className="fa-solid fa-circle-check" aria-hidden="true" />}
                          {consultant.score > 0 && (
                            <span className="sd-chip sd-chip--match" style={{ padding: "2px 6px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              <i className="fa-solid fa-bolt" /> Match score {consultant.score}
                            </span>
                          )}
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

                    <div className="legacy-consultant-card-v2__flag" aria-label={consultant.countryName}>
                      <img
                        src={getMediaUrl(consultant.countryImage) ?? getCountryFlagUrl(consultant.countryName)}
                        alt={consultant.countryName}
                      />
                      <span>{consultant.countryName}</span>
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

                  {consultant.reasons.length > 0 && (
                    <div style={{ marginTop: "0.2rem" }}>
                      <div className="legacy-consultant-card-v2__tag-row">
                        {consultant.reasons.map((reason) => (
                          <span key={reason} className="sd-chip sd-chip--match-soft">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="legacy-consultant-card-v2__details">
                    <div className="legacy-consultant-card-v2__tags">
                      <div className="legacy-consultant-card-v2__tag-group">
                        <strong>
                          <i className="fa-solid fa-layer-group" /> Study Level:
                        </strong>
                        <div className="legacy-consultant-card-v2__tag-row">
                          {consultant.levelTags.length > 0 ? (
                            consultant.levelTags.slice(0, 4).map((level) => (
                              <span key={level} className="legacy-study-badge">
                                {level}
                              </span>
                            ))
                          ) : (
                            <span className="legacy-consultant-card-v2__empty-chip">General guidance</span>
                          )}
                        </div>
                      </div>

                      {consultant.subjectTags.length > 0 && (
                        <div className="legacy-consultant-card-v2__tag-group">
                          <strong>
                            <i className="fa-solid fa-book-open" /> Subjects:
                          </strong>
                          <div className="legacy-consultant-card-v2__tag-row">
                            {consultant.subjectTags.slice(0, 4).map((subject) => (
                              <span key={subject} className="legacy-mini-tag">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="legacy-consultant-card-v2__services" style={{ marginTop: "0.8rem" }}>
                      <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#475569", marginBottom: "0.4rem" }}>Services to send request</p>
                      {consultant.services.slice(0, 3).map((service) => (
                        <div key={service.id} className="legacy-consultant-card-v2__service-row">
                          <div className="legacy-consultant-card-v2__service-meta">
                            <span>{getServiceLabel(service)}</span>
                            <strong>{formatPrice(service.price)}</strong>
                          </div>
                          <Link
                            href={`/dashboard/student/direct-request?service_id=${service.id}${selectedChoice ? `&choice_id=${selectedChoice.id}` : ""}` as Route}
                            className="legacy-request-btn"
                          >
                            {t("consultants_request_btn")}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
