"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkMinus, ExternalLink, MapPin, ShieldCheck, Star } from "lucide-react";

import { useToast } from "@/components/layout/toast-provider";
import {
  getSavedConsultants,
  removeSavedConsultant,
  type SavedConsultant,
} from "@/lib/api/saved-consultants";
import { getApiErrorMessage } from "@/lib/api/client";
import { getCountryFlagUrl } from "@/lib/country-flags";

export function SavedConsultants() {
  const { showToast } = useToast();
  const [items, setItems] = useState<SavedConsultant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    getSavedConsultants()
      .then((saved) => {
        if (!isMounted) return;
        setItems(saved);
      })
      .catch((error) => {
        if (!isMounted) return;
        showToast({
          title: "Could not load saved consultants",
          message: getApiErrorMessage(error, "Please try again in a moment."),
          variant: "error",
        });
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleUnsave = async (item: SavedConsultant) => {
    setPendingId(item.id);
    try {
      await removeSavedConsultant(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      showToast({
        title: "Consultant removed",
        message: `${item.consultant_name} was removed from your saved consultants.`,
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Could not remove consultant",
        message: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="sd-section-stack">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Saved consultants</p>
          <h1 className="text-2xl font-extrabold text-slate-900">Your saved consultant list</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Keep consultant profiles here for later review, then open the full profile or remove them when you no longer
            need them.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-sm font-medium text-slate-500">Loading saved consultants...</div>
        ) : items.length === 0 ? (
          <div className="py-12">
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-900">No saved consultants yet</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Save consultant cards from the homepage or consultant listings to keep them here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {items.map((item) => {
              const href = `/consultants-profile-details-view/${item.consultant_id}` as Route;
              const isPending = pendingId === item.id;
              const countryFlag = item.consultant_country_image || getCountryFlagUrl(item.consultant_country_name);

              return (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8ff_100%)] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      {item.consultant_image ? (
                        <img
                          src={item.consultant_image}
                          alt={item.consultant_name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#173b88] text-lg font-extrabold text-white">
                          {item.consultant_name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() ?? "")
                            .join("") || "EW"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate text-lg font-extrabold text-slate-900">{item.consultant_name}</h2>
                          {item.consultant_verification_status === "accepted" ? (
                            <ShieldCheck size={16} className="text-[#173b88]" />
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Star size={15} className="fill-[#f6b500] text-[#f6b500]" />
                            {item.consultant_rating.toFixed(1)}
                            <span className="text-slate-400">({item.consultant_review_count})</span>
                          </span>
                          {item.consultant_country_name ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={15} className="text-slate-400" />
                              {item.consultant_country_name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {item.consultant_country_name ? (
                      <div className="flex flex-col items-center gap-1 text-center">
                        <img
                          src={countryFlag}
                          alt={`${item.consultant_country_name} flag`}
                          className="h-10 w-10 rounded-full border-2 border-white object-cover shadow"
                        />
                        <span className="max-w-20 text-[11px] font-bold leading-4 text-slate-500">
                          {item.consultant_country_name}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={href}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#173b88] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#14316f]"
                    >
                      View profile
                      <ExternalLink size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnsave(item)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <BookmarkMinus size={16} />
                      {isPending ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
