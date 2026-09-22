"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DynamicPricingPackage = {
  id: number;
  name: string;
  level?: string;
  package_type?: BillingCycle | null;
  duration_days?: number | null;
  description?: string;
  price: string;
  features?: unknown;
  status?: string;
};

type BillingCycle = "monthly" | "annual";

type DisplayPlan = {
  id: number;
  name: string;
  audience: string;
  price: string;
  period: string;
  features: string[];
  href: "/login" | "/register";
  featured: boolean;
  badge: string;
  cycle: BillingCycle;
};

function normalizeFeatures(features: unknown, description?: string): string[] {
  if (Array.isArray(features)) {
    return features
      .map((feature) => String(feature ?? "").trim())
      .filter(Boolean);
  }

  if (typeof features === "string" && features.trim()) {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) {
        return parsed
          .map((feature) => String(feature ?? "").trim())
          .filter(Boolean);
      }
    } catch {
      return features
        .split(/\r?\n|,/)
        .map((feature) => feature.trim())
        .filter(Boolean);
    }
  }

  return description?.trim() ? [description.trim()] : [];
}

function formatPrice(price: string): string {
  const numeric = Number(price);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Free";
  return numeric % 1 === 0
    ? numeric.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDuration(days?: number | null): string {
  if (!days || days <= 0) return "";
  if (days === 30) return "/month";
  if (days === 365) return "/year";
  if (days % 365 === 0) {
    const years = days / 365;
    return `/${years} ${years === 1 ? "year" : "years"}`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    return `/${months} ${months === 1 ? "month" : "months"}`;
  }
  return `/${days} ${days === 1 ? "day" : "days"}`;
}

function getBadge(pkg: DynamicPricingPackage): string {
  const text = `${pkg.name} ${pkg.level ?? ""}`.toLowerCase();
  if (text.includes("best")) return "BEST PLAN";
  if (text.includes("premium")) return "PREMIUM PLAN";
  return "MOST POPULAR PLAN";
}

function isFeaturedPlan(pkg: DynamicPricingPackage, index: number, total: number): boolean {
  const text = `${pkg.name} ${pkg.level ?? ""}`.toLowerCase();
  if (/\b(popular|populer|best|premium|featured|professional)\b/.test(text)) return true;
  return total >= 3 && index === 1;
}

function toDisplayPlans(packages: DynamicPricingPackage[]): DisplayPlan[] {
  return packages.map((pkg, index) => {
    const price = formatPrice(pkg.price);
    const features = normalizeFeatures(pkg.features, pkg.description);
    const featured = isFeaturedPlan(pkg, index, packages.length);

    return {
      id: pkg.id,
      name: pkg.name,
      audience: pkg.level?.trim() || pkg.description?.trim() || "Pro Consultant package",
      price,
      period: price === "Free" ? "" : formatDuration(pkg.duration_days),
      features: features.length ? features : ["Package details can be managed from the admin dashboard."],
      href: price === "Free" ? "/register" : "/login",
      featured,
      badge: getBadge(pkg),
      cycle: pkg.package_type === "annual" ? "annual" : "monthly"
    };
  });
}

export function PricingClient({ packages }: { packages: DynamicPricingPackage[] }) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const plans = useMemo(() => toDisplayPlans(packages), [packages]);
  const visiblePlans = plans.filter((plan) => plan.cycle === cycle);
  const hasMonthlyPlans = plans.some((plan) => plan.cycle === "monthly");
  const hasAnnualPlans = plans.some((plan) => plan.cycle === "annual");

  return (
    <section className="legacy-pricing-page" aria-labelledby="pricing-heading">
      <div className="legacy-pricing-shell">
        <div className="legacy-pricing-intro">
          <h1 id="pricing-heading">Plans &amp; Pricing</h1>
          <p>
            Choose the right package to become a Pro Consultant and stand out in the study abroad consultation
            space. Reach more students, build trust, and grow your consultancy with premium features.
          </p>
        </div>

        <div className="legacy-pricing-toggle" role="group" aria-label="Billing cycle">
          <button
            type="button"
            className={cycle === "monthly" ? "is-active" : ""}
            onClick={() => setCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={cycle === "annual" ? "is-active" : ""}
            onClick={() => setCycle("annual")}
          >
            Annual
          </button>
        </div>

        {plans.length ? (
          visiblePlans.length ? (
            <div className="legacy-pricing-grid">
              {visiblePlans.map((plan) => (
                <article
                  className={`legacy-pricing-card ${plan.featured ? "is-featured" : ""}`}
                  key={plan.id}
                >
                  {plan.featured ? <div className="legacy-pricing-badge">{plan.badge}</div> : null}
                  <div className="legacy-pricing-card-body">
                    <h2>{plan.name}</h2>
                    <p className="legacy-pricing-audience">{plan.audience}</p>
                    <div className="legacy-pricing-price">
                      {plan.price === "Free" ? (
                        <span>Free</span>
                      ) : (
                        <>
                          <span className="legacy-pricing-currency">{"\u09F3"}</span>
                          <span>{plan.price}</span>
                          <small>{plan.period}</small>
                        </>
                      )}
                    </div>
                    <ul className="legacy-pricing-features">
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <i className="fa-regular fa-circle-check" aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.href}
                      className={`legacy-pricing-button ${plan.featured ? "is-primary" : ""}`}
                    >
                      {plan.price === "Free" ? "Try for free" : "Select plan"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="legacy-pricing-empty">
              <h2>No {cycle === "annual" ? "annual" : "monthly"} plans are active yet.</h2>
              <p>
                Add or activate {cycle === "annual" ? "annual" : "monthly"} pro packages from the admin dashboard.
              </p>
            </div>
          )
        ) : (
          <div className="legacy-pricing-empty">
            <h2>No active pricing plans found.</h2>
            <p>Create and activate Pro Packages from the admin dashboard to show them here.</p>
          </div>
        )}

        {plans.length ? (
          <p className="legacy-pricing-note">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
        ) : null}

        {!hasMonthlyPlans || !hasAnnualPlans ? (
          <p className="legacy-pricing-admin-hint">
            Pricing cards are loaded from Admin Dashboard &gt; Pro-Consultants &gt; Packages.
          </p>
        ) : null}
      </div>
    </section>
  );
}
