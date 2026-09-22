import type { Route } from "next";
import Link from "next/link";

import type { LegacyConsultant } from "@/lib/legacy-data";

export function ConsultantCard({ consultant }: { consultant: LegacyConsultant }) {
  const profileHref = `/consultants-profile-details-view/${consultant.id}` as Route;

  return (
    <div className="legacy-panel p-6">
      <div className="flex items-start gap-4">
        <img
          src={consultant.image}
          alt={consultant.name}
          className="h-20 w-20 rounded-full border border-slate-200 object-cover"
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold">{consultant.name}</h3>
            {consultant.badge ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {consultant.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--legacy-primary)]">{consultant.title}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--legacy-muted)]">
            <span className="legacy-star">
              <i className="fa-solid fa-star" />
            </span>
            {consultant.rating} ({consultant.reviewCount} reviews)
          </div>
        </div>
      </div>
      <p className="mt-4 text-[15px] leading-7 text-[var(--legacy-muted)]">{consultant.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {consultant.services.map((service) => (
          <span key={service} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {service}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--legacy-muted)]">Starting From</p>
          <p className="text-xl font-extrabold text-[var(--legacy-primary)]">{consultant.price}</p>
        </div>
          <Link href={profileHref} className="legacy-primary-btn">
            View Profile
          </Link>
      </div>
    </div>
  );
}
