"use client";

import { SavedConsultants } from "@/components/dashboard/saved-consultants";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function AgencySavedConsultantsPage() {
  return (
    <DashboardShell role="agency" section="saved">
      <SavedConsultants />
    </DashboardShell>
  );
}
