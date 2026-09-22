"use client";

import { useEffect, useState } from "react";

import { getReviews, type Review } from "@/lib/api/assessments";

export function ConsultantReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.review_rating, 0) / reviews.length).toFixed(1)
    : "—";

  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-slate-200"}>★</span>
    ));

  return (
    <section className="legacy-dashboard-panel">
      <div className="legacy-dashboard-panel-head">
        <div>
          <h2>Student Reviews</h2>
          <p>Feedback from students who completed assessments with you.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-[var(--legacy-primary)]">{avgRating}</span>
          <span className="text-sm text-[var(--legacy-muted)]">/ 5 avg ({reviews.length} reviews)</span>
        </div>
      </div>
      <div className="legacy-dashboard-table-wrap">
        {loading ? (
          <p className="p-6 text-center text-[var(--legacy-muted)]">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="p-8 text-center text-[var(--legacy-muted)]">No reviews yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r.id} className="p-5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold text-[var(--legacy-primary)]">{r.student_name ?? "Student"}</span>
                  <div className="flex items-center gap-1 text-base">
                    {stars(r.review_rating)}
                    <span className="ml-1 text-sm font-bold text-slate-500">{r.review_rating}/5</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{r.review_message}</p>
                {r.created_at && (
                  <p className="mt-1 text-xs text-[var(--legacy-muted)]">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
