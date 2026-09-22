"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantOverview } from "@/components/dashboard/consultant-overview";

export default function ConsultantDashboardPage() {
  return (
    <DashboardShell role="consultant" section="overview">
      <ConsultantOverview />
    </DashboardShell>
  );
}
