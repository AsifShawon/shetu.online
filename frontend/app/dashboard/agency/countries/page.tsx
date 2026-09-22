"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyCountries } from "@/components/dashboard/agency-countries";

export default function AgencyCountriesPage() {
  return (
    <DashboardShell role="agency" section="countries">
      <AgencyCountries />
    </DashboardShell>
  );
}
