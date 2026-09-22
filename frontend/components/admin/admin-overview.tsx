"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api/client";
import {
  getAdminDashboard,
  type AdminDashboardBox,
  type AdminDashboardOverview,
} from "@/lib/api/admin";

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim()) return value;
  return "0";
}

const accentStyles: Record<
  NonNullable<AdminDashboardBox["accent"]>,
  { card: string; footer: string; text: string }
> = {
  info: {
    card: "bg-[#17a2b8]",
    footer: "bg-[#1497ad]",
    text: "text-white",
  },
  success: {
    card: "bg-[#28a745]",
    footer: "bg-[#23923d]",
    text: "text-white",
  },
  warning: {
    card: "bg-[#ffc107]",
    footer: "bg-[#ecb100]",
    text: "text-slate-900",
  },
  danger: {
    card: "bg-[#dc3545]",
    footer: "bg-[#c92f3f]",
    text: "text-white",
  },
};

const emptyOverview: AdminDashboardOverview = {
  dashboard_boxes: [
    { title: "Message Request", value: 0, accent: "info", icon: "fa-solid fa-envelope-open-text", href: "/admin/contact" },
    { title: "Testimonials", value: 0, accent: "success", icon: "fa-solid fa-handshake", href: "/admin/testimonials" },
    { title: "Services", value: 0, accent: "warning", icon: "fa-solid fa-briefcase", href: "/admin/services" },
    { title: "Portfolios", value: 0, accent: "danger", icon: "fa-solid fa-address-card", href: "/admin/company-details" },
    { title: "All Blogs", value: 0, accent: "info", icon: "fa-solid fa-blog", href: "/admin/eduinfo" },
    { title: "All Brands", value: 0, accent: "success", icon: "fa-brands fa-artstation", href: "/admin/country" },
    { title: "Teams", value: 0, accent: "warning", icon: "fa-solid fa-user-group", href: "/admin/user" },
    { title: "All Slider", value: 0, accent: "danger", icon: "fa-brands fa-slideshare", href: "/admin/slider" },
  ],
  chart_data: {
    labels: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    contact_requests: Array(12).fill(0),
    testimonials: Array(12).fill(0),
  },
  summary_cards: [],
  ops_cards: [],
  catalog_snapshot: {},
  financial_snapshot: {},
  recent_contacts: [],
  recent_verifications: [],
  recent_withdrawals: [],
};

function DashboardChart({
  values,
  labels,
  legend,
}: {
  values: number[];
  labels: string[];
  legend: string;
}) {
  const safeValues = values.length ? values : Array(12).fill(0);
  const maxValue = Math.max(1, ...safeValues);
  const ticks = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <span className="h-3 w-8 rounded border border-[#58abef] bg-[#d9ecfd]" />
        <span>{legend}</span>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex">
          <div className="flex w-12 flex-col justify-between pr-3 text-xs text-slate-500">
            {ticks.map((tick) => (
              <span className="leading-none" key={tick}>
                {tick === 0 ? "0" : tick.toFixed(1)}
              </span>
            ))}
          </div>

          <div className="flex-1">
            <div className="relative h-[310px] border-b border-l border-slate-300">
              <div className="pointer-events-none absolute inset-0">
                {ticks.slice(0, -1).map((tick) => (
                  <div
                    className="absolute left-0 right-0 border-t border-slate-200"
                    key={tick}
                    style={{ top: `${(1 - tick) * 100}%` }}
                  />
                ))}
              </div>

              <div className="absolute inset-0 flex items-end px-2 pb-1">
                {safeValues.map((value, index) => (
                  <div className="flex h-full flex-1 items-end justify-center" key={`${labels[index]}-${index}`}>
                    <div
                      className="w-[58%] rounded-t-sm border border-[#58abef] bg-[#d9ecfd]"
                      style={{ height: `${(value / maxValue) * 100}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-6 gap-y-3 text-center text-xs text-slate-500 sm:grid-cols-12">
              {labels.map((label) => (
                <span className="rotate-[-18deg] whitespace-nowrap" key={label}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminOverview() {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const overview = await getAdminDashboard();
        if (!cancelled) {
          setData(overview);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError((err.body as { detail?: string })?.detail ?? "Failed to load admin dashboard.");
          } else {
            setError("Failed to load admin dashboard.");
          }
          setData(emptyOverview);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const overview = useMemo(() => data ?? emptyOverview, [data]);
  const dashboardBoxes = overview.dashboard_boxes?.length
    ? overview.dashboard_boxes
    : emptyOverview.dashboard_boxes!;
  const chartData = overview.chart_data ?? emptyOverview.chart_data!;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
          Loading dashboard...
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {dashboardBoxes.map((card) => {
          const palette = accentStyles[card.accent] ?? accentStyles.info;
          return (
            <Link
              className={`block overflow-hidden rounded-[4px] shadow-sm transition hover:translate-y-[-1px] ${palette.card} ${palette.text}`}
              href={card.href as Route}
              key={card.title}
            >
              <div className="relative min-h-[127px] p-4">
                <div className="pr-20">
                  <h3 className="text-[46px] font-bold leading-none">{formatValue(card.value)}</h3>
                  <p className="mt-4 text-[15px]">{card.title}</p>
                </div>
                <i className={`${card.icon} pointer-events-none absolute right-5 top-5 text-[84px] opacity-20`} />
              </div>
              <div className={`flex items-center justify-center gap-2 px-4 py-2 text-[14px] ${palette.footer}`}>
                <span>More info</span>
                <i className="fa-solid fa-arrow-circle-right" />
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 text-[18px] font-medium text-slate-900">
            Contact Request
          </div>
          <div className="p-5">
            <DashboardChart
              labels={chartData.labels}
              legend="Contact Request"
              values={chartData.contact_requests}
            />
          </div>
        </div>

        <div className="rounded-[4px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 text-[18px] font-medium text-slate-900">
            Testimonials
          </div>
          <div className="p-5">
            <DashboardChart
              labels={chartData.labels}
              legend="Testimonials"
              values={chartData.testimonials}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
