"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDurationDays } from "@/lib/formatters";

type Review = {
  id: number;
  student_name?: string;
  review_message: string;
  review_rating: number;
  created_at?: string;
};

type CountryService = {
  id: number;
  label: string;
  price: string;
  duration: string;
  description: string;
};

type CountryGroup = {
  key: string;
  countryName: string;
  countryImage: string | null;
  services: CountryService[];
  studyLevels: string[];
  subjects: string[];
  consultantInfo: string;
};

type ConsultantProfileShellProps = {
  name: string;
  image: string;
  isPro: boolean;
  isVerified: boolean;
  avgRating: number;
  reviewCount: number;
  experience: string;
  countryGroups: CountryGroup[];
  reviews: Review[];
};

function formatPrice(value: string | null | undefined) {
  const numeric = Number(value ?? "");
  if (!Number.isFinite(numeric) || numeric <= 0) return "Free / N/A";
  return `BDT ${numeric.toLocaleString("en-US")}`;
}

function formatReviewDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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

function getDeliveryLabel(services: CountryService[]) {
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

export function ConsultantProfileShell({
  name,
  image,
  isPro,
  isVerified,
  avgRating,
  reviewCount,
  experience,
  countryGroups,
  reviews,
}: ConsultantProfileShellProps) {
  const [activeCountryKey, setActiveCountryKey] = useState(countryGroups[0]?.key ?? "");
  const [activeInfoTab, setActiveInfoTab] = useState<"about" | "reviews">("about");

  const activeCountry = useMemo(
    () => countryGroups.find((group) => group.key === activeCountryKey) ?? countryGroups[0],
    [activeCountryKey, countryGroups],
  );

  if (!activeCountry) {
    return null;
  }

  return (
    <div className="legacy-consultant-profile-page__grid">
      <aside className="legacy-consultant-profile-page__sidebar">
        <div className="legacy-consultant-profile-page__identity">
          <div className="legacy-consultant-profile-page__avatar-ring">
            <img src={image} alt={name} />
          </div>
          {isPro ? <span className="legacy-consultant-profile-page__pro">PRO</span> : null}
          <h2>{name}</h2>
          {isVerified ? (
            <p className="legacy-consultant-profile-page__verified">
              <i className="fa-solid fa-circle-check" /> Verified Consultant
            </p>
          ) : null}
          <div className="legacy-consultant-profile-page__stars">
            {renderStars(avgRating)}
          </div>
          <p className="legacy-consultant-profile-page__review-total">
            {avgRating.toFixed(1)} ({reviewCount} Reviews)
          </p>

          <div className="legacy-consultant-profile-page__summary-cards">
            <article className="legacy-consultant-profile-page__summary-card is-blue">
              <i className="fa-regular fa-clock" />
              <span>Delivery</span>
              <strong>{getDeliveryLabel(activeCountry.services)}</strong>
            </article>
            <article className="legacy-consultant-profile-page__summary-card is-green">
              <i className="fa-solid fa-award" />
              <span>Experience</span>
              <strong>{experience}</strong>
            </article>
          </div>

          <div className="legacy-consultant-profile-page__country-list">
            {countryGroups.map((country) => (
              <button
                key={country.key}
                type="button"
                className={`legacy-consultant-profile-page__country-item ${country.key === activeCountry.key ? "is-active" : ""}`}
                onClick={() => setActiveCountryKey(country.key)}
              >
                {country.countryImage ? (
                  <img src={country.countryImage} alt={country.countryName} />
                ) : (
                  <i className="fa-solid fa-globe" />
                )}
                <span>{country.countryName}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="legacy-consultant-profile-page__main">
        <section className="legacy-consultant-profile-page__services">
          <div className="legacy-consultant-profile-page__section-head">
            <h3>
              <i className="fa-solid fa-bell-concierge" /> Services
            </h3>
            <p>{activeCountry.services.length} service{activeCountry.services.length > 1 ? "s" : ""} available</p>
          </div>

          {countryGroups.length > 1 ? (
            <div className="legacy-consultant-profile-page__country-tabs" role="tablist" aria-label="Country services">
              {countryGroups.map((country) => (
                <button
                  key={country.key}
                  type="button"
                  role="tab"
                  aria-selected={country.key === activeCountry.key}
                  className={`legacy-consultant-profile-page__country-tab ${country.key === activeCountry.key ? "is-active" : ""}`}
                  onClick={() => setActiveCountryKey(country.key)}
                >
                  {country.countryImage ? <img src={country.countryImage} alt={country.countryName} /> : <i className="fa-solid fa-globe" />}
                  <span>{country.countryName}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="legacy-consultant-profile-page__service-grid">
            {activeCountry.services.map((service) => (
              <article key={service.id} className="legacy-consultant-profile-page__service-card">
                <div className="legacy-consultant-profile-page__service-meta">
                  <div>
                    <strong>{service.label}</strong>
                    <span>{service.description || formatDurationDays(service.duration)}</span>
                  </div>
                  <em>{formatPrice(service.price)}</em>
                </div>
                <div className="legacy-consultant-profile-page__service-footer">
                  <small>{formatDurationDays(service.duration)}</small>
                  <Link href="/login" className="legacy-request-btn">
                    Request
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="legacy-consultant-profile-tabs">
          <div className="legacy-consultant-profile-tabs__header">
            <button
              type="button"
              className={`legacy-consultant-profile-tabs__tab ${activeInfoTab === "about" ? "is-active" : ""}`}
              onClick={() => setActiveInfoTab("about")}
            >
              About
            </button>
            <button
              type="button"
              className={`legacy-consultant-profile-tabs__tab ${activeInfoTab === "reviews" ? "is-active" : ""}`}
              onClick={() => setActiveInfoTab("reviews")}
            >
              Reviews
            </button>
          </div>

          {activeInfoTab === "about" ? (
            <div className="legacy-consultant-profile-tabs__body">
              <div className="legacy-consultant-profile-tabs__row legacy-consultant-profile-tabs__row--split">
                <div className="legacy-consultant-profile-tabs__block">
                  <h3>Subjects</h3>
                  <div className="legacy-consultant-profile-tabs__chips is-lilac">
                    {activeCountry.subjects.length > 0 ? (
                      activeCountry.subjects.map((subject) => (
                        <span key={subject} className="legacy-consultant-profile-tabs__chip">
                          {subject}
                        </span>
                      ))
                    ) : (
                      <p className="legacy-consultant-profile-tabs__empty">No subjects added yet.</p>
                    )}
                  </div>
                </div>

                <div className="legacy-consultant-profile-tabs__block">
                  <h3>Study Levels</h3>
                  <div className="legacy-consultant-profile-tabs__chips is-blue">
                    {activeCountry.studyLevels.length > 0 ? (
                      activeCountry.studyLevels.map((level) => (
                        <span key={level} className="legacy-consultant-profile-tabs__chip">
                          {level}
                        </span>
                      ))
                    ) : (
                      <p className="legacy-consultant-profile-tabs__empty">No study levels added yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="legacy-consultant-profile-tabs__row">
                <div className="legacy-consultant-profile-tabs__block">
                  <h3>Consultant Information</h3>
                  <p className="legacy-consultant-profile-tabs__info">
                    {activeCountry.consultantInfo || "This consultant has not added a profile summary yet."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="legacy-consultant-profile-tabs__body">
              {reviews.length > 0 ? (
                <div className="legacy-consultant-profile-tabs__reviews">
                  {reviews.map((review) => (
                    <article key={review.id} className="legacy-consultant-profile-tabs__review">
                      <div className="legacy-consultant-profile-tabs__review-head">
                        <div>
                          <strong>{review.student_name?.trim() || "Student"}</strong>
                          {review.created_at ? <span>{formatReviewDate(review.created_at)}</span> : null}
                        </div>
                        <div className="legacy-consultant-profile-tabs__stars">
                          {renderStars(review.review_rating)}
                        </div>
                      </div>
                      <p>{review.review_message}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="legacy-consultant-profile-tabs__empty-review">
                  <i className="fa-regular fa-message" />
                  <p>No reviews have been published yet.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
