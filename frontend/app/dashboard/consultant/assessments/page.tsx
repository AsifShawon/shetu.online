"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AssessmentsTable } from "@/components/dashboard/assessments-table";

export default function ConsultantAssessmentsPage() {
  return (
    <DashboardShell role="consultant" section="requests">
      <AssessmentsTable viewAs="consultant" />
    </DashboardShell>
  );
}
