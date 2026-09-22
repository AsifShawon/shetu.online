"use client";

import { useState } from "react";

type CountryChip = {
  name: string;
  image: string | null;
};

type ReviewItem = {
  id: number;
  student_name?: string;
  review_message: string;
  review_rating: number;
  created_at?: string;
};

type ConsultantProfileTabsProps = {
  consultantInfo: string;
  countries: CountryChip[];
  studyLevels: string[];
  subjects: string[];
  reviews: ReviewItem[];
};

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

export function ConsultantProfileTabs({
  consultantInfo,
  countries,
  studyLevels,
  subjects,
  reviews,
}: ConsultantProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");

  return (
    <section className="legacy-consultant-profile-tabs">
      <div className="legacy-consultant-profile-tabs__header">
        <button
          type="button"
          className={`legacy-consultant-profile-tabs__tab ${activeTab === "about" ? "is-active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
        <button
          type="button"
          className={`legacy-consultant-profile-tabs__tab ${activeTab === "reviews" ? "is-active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </button>
      </div>

      {activeTab === "about" ? (
        <div className="legacy-consultant-profile-tabs__body">
          <div className="legacy-consultant-profile-tabs__row legacy-consultant-profile-tabs__row--split">
            <div className="legacy-consultant-profile-tabs__block">
              <h3>Subjects</h3>
              <div className="legacy-consultant-profile-tabs__chips is-lilac">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
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
                {studyLevels.length > 0 ? (
                  studyLevels.map((level) => (
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

          {countries.length > 0 ? (
            <div className="legacy-consultant-profile-tabs__row">
              <div className="legacy-consultant-profile-tabs__block">
                <h3>Countries</h3>
                <div className="legacy-consultant-profile-tabs__countries">
                  {countries.map((country) => (
                    <span key={country.name} className="legacy-consultant-profile-tabs__country">
                      {country.image ? <img src={country.image} alt={country.name} /> : <i className="fa-solid fa-globe" />}
                      {country.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="legacy-consultant-profile-tabs__row">
            <div className="legacy-consultant-profile-tabs__block">
              <h3>Consultant Information</h3>
              <p className="legacy-consultant-profile-tabs__info">
                {consultantInfo || "This consultant has not added a profile summary yet."}
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
                      {review.created_at ? (
                        <span>{formatReviewDate(review.created_at)}</span>
                      ) : null}
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
  );
}
