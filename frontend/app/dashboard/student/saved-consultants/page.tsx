"use client";

import { SavedConsultants } from "@/components/dashboard/saved-consultants";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function StudentSavedConsultantsPage() {
  return (
    <DashboardShell role="student" section="saved">
      <SavedConsultants />
    </DashboardShell>
  );
}
