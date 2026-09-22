"use client";

import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { useToast } from "@/components/layout/toast-provider";
import { getAssessment, type Assessment } from "@/lib/api/assessments";
import { getApiErrorMessage } from "@/lib/api/client";
import { createOrder, getOrders, type Order } from "@/lib/api/payments";

function formatMoney(value?: string | number | null) {
  const amount = Number(value || 0);
  return `BDT ${amount.toLocaleString()}`;
}

export default function StudentAssessmentCheckoutPage() {
  const params = useParams<{ assessmentId: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const assessmentId = Number(params.assessmentId);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [assessmentData, orderData] = await Promise.all([getAssessment(assessmentId), getOrders()]);
        setAssessment(assessmentData);
        setOrders(orderData);
      } catch (error) {
        showToast({
          variant: "error",
          title: "Checkout load failed",
          message: getApiErrorMessage(error, "Unable to prepare the assessment checkout."),
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId, showToast]);

  const existingOrder = useMemo(
    () => orders.find((item) => item.assessment_id === assessmentId) ?? null,
    [assessmentId, orders]
  );

  if (loading) {
    return (
      <DashboardShell role="student" section="assessments">
        <p className="sd-loading">Loading checkout...</p>
      </DashboardShell>
    );
  }

  if (!assessment) {
    return (
      <DashboardShell role="student" section="assessments">
        <div className="rounded-[28px] bg-white p-4 text-sm text-slate-600 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          Assessment not found.
        </div>
      </DashboardShell>
    );
  }

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const order = await createOrder({
        assessment_id: assessment.id,
        subtotal: assessment.assessment_charge,
        total: assessment.assessment_charge,
      });
      showToast({
        variant: "success",
        title: "Checkout created",
        message: "Redirecting you to the payment gateway.",
      });
      if (order.checkout_url) {
        window.location.href = order.checkout_url;
        return;
      }
      router.push(`/dashboard/student/assessments/${assessment.id}` as Route);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Checkout failed",
        message: getApiErrorMessage(error, "Unable to create the assessment order."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell role="student" section="assessments">
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Assessment Checkout</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{assessment.assessment_title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Each paid assessment now has a dedicated order record. Once payment succeeds, the consultant can complete delivery and admin review can continue.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={`/dashboard/student/assessments/${assessment.id}` as Route} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                  Back to timeline
                </Link>
                {existingOrder?.payment_status === "success" ? (
                  <span className="rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                    Payment already completed
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Order Summary</p>
              <h3 className="mt-3 text-2xl font-black sm:text-3xl">{formatMoney(assessment.assessment_charge)}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Consultant: {assessment.consultant_name || "Assigned consultant"}
                <br />
                Duration: {assessment.assessment_duration || "Not specified"}
                <br />
                Country: {assessment.country_name || "Not specified"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">What you are paying for</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{assessment.service_title || "Assessment Service"}</p>
              </div>
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Assessment description</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{assessment.assessment_description || "No additional details were supplied."}</p>
              </div>
              <div className="rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current workflow status</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{assessment.status.replaceAll("_", " ")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">Payment action</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Use the dedicated order flow so the assessment, payment callback, refund review, and consultant settlement all stay linked.
            </p>

            {existingOrder ? (
              <div className="mt-5 rounded-[22px] border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">{existingOrder.order_number}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Payment status: {existingOrder.payment_status.replaceAll("_", " ")}
                  <br />
                  Total: {formatMoney(existingOrder.total)}
                  <br />
                  Method: {existingOrder.payment_method || "Pending callback"}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="mt-6 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting || assessment.status !== "accepted" || existingOrder?.payment_status === "success"}
              onClick={handleCheckout}
            >
              {submitting ? "Creating checkout..." : existingOrder?.payment_status === "success" ? "Already paid" : "Create order and continue"}
            </button>

            {assessment.status !== "accepted" ? (
              <p className="mt-3 text-sm text-amber-700">
                Checkout is only available after the consultant proposal is accepted.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
