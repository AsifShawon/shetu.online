"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { StudentOverview } from "@/components/dashboard/student-overview";

export default function StudentDashboardPage() {
  return (
    <DashboardShell role="student" section="overview">
      <StudentOverview />
    </DashboardShell>
  );
}
