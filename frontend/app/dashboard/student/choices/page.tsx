"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { StudentChoices } from "@/components/dashboard/student-choices";

export default function StudentChoicesPage() {
  return (
    <DashboardShell role="student" section="choices">
      <StudentChoices />
    </DashboardShell>
  );
}
