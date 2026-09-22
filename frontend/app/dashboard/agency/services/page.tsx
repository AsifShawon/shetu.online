"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyServices } from "@/components/dashboard/agency-services";

export default function AgencyServicesPage() {
  return (
    <DashboardShell role="agency" section="services">
      <AgencyServices />
    </DashboardShell>
  );
}
