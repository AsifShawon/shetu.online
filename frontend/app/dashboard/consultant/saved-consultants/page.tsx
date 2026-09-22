"use client";

import { SavedConsultants } from "@/components/dashboard/saved-consultants";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function ConsultantSavedConsultantsPage() {
  return (
    <DashboardShell role="consultant" section="saved">
      <SavedConsultants />
    </DashboardShell>
  );
}
