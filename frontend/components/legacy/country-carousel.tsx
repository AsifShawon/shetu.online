"use client";

import { useEffect, useRef, useState } from "react";

import { getCountries, type Country } from "@/lib/api/catalog";
import { countries as fallbackCountries } from "@/lib/legacy-data";

export function CountryCarousel() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCountries()
      .then((data) => setCountries(data.filter((c) => c.status === "active")))
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  function scrollByCard(direction: "left" | "right") {
    ref.current?.scrollBy({
      left: direction === "right" ? 320 : -320,
      behavior: "smooth"
    });
  }

  // Use API data if available, otherwise fall back to static list
  const items =
    !loading && countries.length > 0
      ? countries.map((c) => ({
          name: c.name,
          image: c.image ?? "/legacy/Frontend/assets/img/gallery/studentvisa.jpg"
        }))
      : loading
      ? []
      : fallbackCountries.map((c) => ({ name: c.name, image: c.image }));

  return (
    <div className="relative">
      <div className="absolute right-0 top-[-4.5rem] hidden gap-3 md:flex">
        <button
          type="button"
          onClick={() => scrollByCard("left")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[var(--legacy-primary)] shadow"
        >
          <i className="fa-solid fa-angle-left" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard("right")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-[var(--legacy-primary)] shadow"
        >
          <i className="fa-solid fa-angle-right" />
        </button>
      </div>
      <div ref={ref} className="flex snap-x gap-5 overflow-x-auto pb-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="legacy-panel min-w-[260px] snap-start overflow-hidden animate-pulse"
              >
                <div className="h-48 w-full bg-slate-200" />
                <div className="p-5">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="mt-2 h-6 w-32 rounded bg-slate-200" />
                </div>
              </div>
            ))
          : items.map((country) => (
              <form
                key={country.name}
                action="/your-search-result"
                className="legacy-panel min-w-[260px] snap-start overflow-hidden p-0"
              >
                <input type="hidden" name="keyword" value={country.name} />
                <button type="submit" className="w-full text-left">
                  <img src={country.image} alt={country.name} className="h-48 w-full object-cover" />
                  <div className="p-5">
                    <p className="text-sm font-semibold text-[var(--legacy-muted)]">
                      <i className="fa-solid fa-earth-americas mr-2" />
                      Study In
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold">{country.name}</h3>
                  </div>
                </button>
              </form>
            ))}
      </div>
    </div>
  );
}
