"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ConsultantPersonalTrainingManager } from "@/components/dashboard/consultant-personal-training-manager";
import { useToast } from "@/components/layout/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import { getTrainings, type Training } from "@/lib/api/catalog";
import { getMySubscriptions, type ProSubscription } from "@/lib/api/consultants";
import { getCourseOrders, getEnrollments, type CourseEnrollment, type CourseOrder } from "@/lib/api/payments";

export function ConsultantTraining() {
  const { showToast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [orders, setOrders] = useState<CourseOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<ProSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrainings(), getEnrollments(), getCourseOrders(), getMySubscriptions()])
      .then(([trainingData, enrollmentData, orderData, subscriptionData]) => {
        setTrainings(trainingData.filter((item) => item.status === "active"));
        setEnrollments(enrollmentData);
        setOrders(orderData);
        setSubscriptions(subscriptionData);
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Training failed to load",
          message: getApiErrorMessage(error, "Unable to load consultant training data."),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const activeSubscription = subscriptions.find((item) => item.active);

  return (
    <div className="sd-section-stack sd-consultant-content-stack">
      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Training and Growth</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Keep your consulting edge current</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Track the courses you bought, the training you enrolled in, and the consultant plan that controls your premium visibility.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={"/courses" as Route} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Browse all trainings
              </Link>
              <Link href={"/dashboard/consultant/services" as Route} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                Return to services
              </Link>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Subscription</p>
            <h3 className="mt-3 text-3xl font-black">
              {activeSubscription ? "Active Pro Plan" : "No active plan"}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {activeSubscription
                ? `Your current pro access runs until ${new Date(activeSubscription.ends_at).toLocaleDateString()}.`
                : "Upgrade to a pro plan to improve discovery, trust, and service visibility."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">Orders</p>
                <strong className="mt-1 block text-2xl">{orders.length}</strong>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">Enrollments</p>
                <strong className="mt-1 block text-2xl">{enrollments.length}</strong>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-slate-400">Available trainings</p>
                <strong className="mt-1 block text-2xl">{trainings.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">My enrollments</h3>
              <p className="mt-1 text-sm text-slate-500">Training access already granted to this account.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{enrollments.length}</span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading training data...</p>
          ) : enrollments.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
              No training enrollment has been created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <article key={enrollment.id} className="rounded-[22px] border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900">{enrollment.training_title}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Type: {enrollment.enrollment_type} {enrollment.deadline ? `• Deadline ${new Date(enrollment.deadline).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${enrollment.access_enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {enrollment.access_enabled ? "Access enabled" : "Paused"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Purchase history</h3>
              <p className="mt-1 text-sm text-slate-500">Course payments already placed by this consultant.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{orders.length}</span>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
              No course purchases have been recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">Training</th>
                    <th className="pb-3 pr-4">Order</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="py-4 pr-4 font-semibold text-slate-900">{order.training_title}</td>
                      <td className="py-4 pr-4 text-slate-600">{order.order_number}</td>
                      <td className="py-4 pr-4 text-slate-600">৳ {Number(order.price).toLocaleString()}</td>
                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold capitalize text-sky-700">
                          {order.payment_status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="sd-consultant-content-card rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Available training catalogue</h3>
            <p className="mt-1 text-sm text-slate-500">Useful programs you can join to improve service quality and marketability.</p>
          </div>
          <Link href={"/courses" as Route} className="text-sm font-semibold text-sky-700">
            Open catalogue
          </Link>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading catalogue...</p>
        ) : trainings.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-500">
            No active trainings are currently published.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {trainings.slice(0, 6).map((training) => (
              <Link
                key={training.id}
                href={`/course/details/${training.id}` as Route}
                className="overflow-hidden rounded-[24px] border border-slate-100 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  <img
                    src={training.thumbnail ?? "/legacy/Frontend/assets/img/page/training_banner.png"}
                    alt={training.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">{training.training_type || "Training"}</p>
                  <h4 className="mt-2 text-lg font-black text-slate-900">{training.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{training.description || training.overview || "Structured training for stronger consultant delivery."}</p>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>{training.duration || "Self-paced"}</span>
                    <span>{training.price ? `৳ ${Number(training.price).toLocaleString()}` : "Free"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <ConsultantPersonalTrainingManager />
    </div>
  );
}
