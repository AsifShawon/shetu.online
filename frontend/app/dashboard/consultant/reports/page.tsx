"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantReports } from "@/components/dashboard/consultant-reports";

export default function ConsultantReportsPage() {
  return (
    <DashboardShell role="consultant" section="reports">
      <ConsultantReports />
    </DashboardShell>
  );
}
