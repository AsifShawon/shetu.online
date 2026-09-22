"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyOverview } from "@/components/dashboard/agency-overview";

export default function AgencyDashboardPage() {
  return (
    <DashboardShell role="agency" section="overview">
      <AgencyOverview />
    </DashboardShell>
  );
}
