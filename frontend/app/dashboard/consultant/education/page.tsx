"use client";

import { ConsultantEducation } from "@/components/dashboard/consultant-education";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function ConsultantEducationPage() {
  return (
    <DashboardShell role="consultant" section="education">
      <ConsultantEducation />
    </DashboardShell>
  );
}
