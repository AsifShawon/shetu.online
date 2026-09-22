"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";

import { CatalogSearchResults } from "@/components/legacy/catalog-search-results";
import { ConsultantSearchResults } from "@/components/legacy/consultant-search-results";

const CONSULTANT_ROUTES = new Set([
  "/your-consultants-search-result",
  "/search-consultant-country",
  "/search-consultant-service",
]);

function SearchResultSwitcher() {
  const pathname = usePathname();

  if (CONSULTANT_ROUTES.has(pathname)) {
    return <ConsultantSearchResults />;
  }

  return <CatalogSearchResults />;
}

export default function SearchResultPage() {
  return (
    <Suspense fallback={<div className="legacy-site"><p className="legacy-loading">Loading results...</p></div>}>
      <SearchResultSwitcher />
    </Suspense>
  );
}
