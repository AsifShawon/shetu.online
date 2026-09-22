"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AssessmentsTable } from "@/components/dashboard/assessments-table";

export default function StudentAssessmentsPage() {
  return (
    <DashboardShell role="student" section="assessments">
      <AssessmentsTable viewAs="student" />
    </DashboardShell>
  );
}
