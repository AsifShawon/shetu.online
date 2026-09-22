"use client";

import { StudentChoiceCreate } from "@/components/dashboard/student-choice-create";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function StudentChoiceCreatePage() {
  return (
    <DashboardShell role="student" section="choices">
      <StudentChoiceCreate />
    </DashboardShell>
  );
}
