"use client";

import { ConsultantExperience } from "@/components/dashboard/consultant-experience";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function ConsultantExperiencePage() {
  return (
    <DashboardShell role="consultant" section="experience">
      <ConsultantExperience />
    </DashboardShell>
  );
}
