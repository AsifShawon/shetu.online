"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyConsultants } from "@/components/dashboard/agency-consultants";

export default function AgencyConsultantsPage() {
  return (
    <DashboardShell role="agency" section="consultants">
      <AgencyConsultants />
    </DashboardShell>
  );
}
