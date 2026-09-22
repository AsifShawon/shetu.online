"use client";

import { StudentDirectRequest } from "@/components/dashboard/student-direct-request";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function StudentDirectRequestPage() {
  return (
    <DashboardShell role="student" section="choices">
      <StudentDirectRequest />
    </DashboardShell>
  );
}
