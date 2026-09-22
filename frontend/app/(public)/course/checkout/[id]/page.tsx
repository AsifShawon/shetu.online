"use client";

import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { getTraining, type Training } from "@/lib/api/catalog";
import { createCourseOrder } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";

export default function CourseCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [course, setCourse] = useState<Training | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTraining(Number(params.id))
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setFetching(false));
  }, [params.id]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login" as Route);
      return;
    }
    if (!course) return;
    setError(null);
    setSubmitting(true);
    try {
      await createCourseOrder({
        training_id: course.id,
        price: course.price,
        payment_method: "surjopay"
      });
      router.push("/course/payment/success" as Route);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Failed to place order. Please try again.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return (
      <section className="py-16 md:py-20">
        <div className="legacy-container">
          <div className="animate-pulse h-64 rounded-2xl bg-slate-200" />
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="py-16 md:py-20">
        <div className="legacy-container text-center">
          <p className="text-[var(--legacy-muted)]">Course not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20">
      <div className="legacy-container grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="legacy-panel p-8">
          <h1 className="text-4xl font-extrabold text-[var(--legacy-primary)]">Course Checkout</h1>
          <p className="mt-4 text-base text-[var(--legacy-muted)]">
            Complete your enrollment for <strong>{course.title}</strong>.
          </p>
          {!user && !isLoading && (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Please <a href="/login" className="underline">sign in</a> to complete enrollment.
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
          )}
          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleOrder}>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">Full Name</label>
              <input
                className="legacy-form-field"
                placeholder="Full Name"
                defaultValue={user ? `${user.first_name} ${user.last_name}`.trim() : ""}
                readOnly={!!user}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Phone</label>
              <input
                className="legacy-form-field"
                placeholder="Phone"
                defaultValue={user?.phone ?? ""}
                readOnly={!!user}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
              <input
                className="legacy-form-field"
                type="email"
                placeholder="Email"
                defaultValue={user?.email ?? ""}
                readOnly={!!user}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">Payment Method</label>
              <select className="legacy-form-field">
                <option value="surjopay">SurjoPay</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </div>
            <button
              type="submit"
              className="legacy-primary-btn md:col-span-2"
              disabled={submitting || !user}
            >
              {submitting ? "Processing…" : `Confirm Order — BDT ${course.price}`}
            </button>
          </form>
        </div>
        <div className="legacy-panel p-8">
          <img
            src={course.thumbnail ?? "/legacy/Frontend/assets/img/page/training_banner.png"}
            alt={course.title}
            className="h-56 w-full rounded-2xl object-cover"
          />
          <h2 className="mt-5 text-2xl font-extrabold text-[var(--legacy-primary)]">{course.title}</h2>
          <p className="mt-3 text-[var(--legacy-muted)]">{course.description}</p>
          <div className="mt-6 space-y-2 text-sm text-[var(--legacy-muted)]">
            <p>Organization: {course.organization}</p>
            <p>Duration: {course.duration}</p>
          </div>
          <p className="mt-4 text-xl font-extrabold text-[var(--legacy-primary)]">
            Total: BDT {course.price}
          </p>
        </div>
      </div>
    </section>
  );
}
