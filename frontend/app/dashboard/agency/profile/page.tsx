"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyProfileForm } from "@/components/dashboard/agency-profile-form";

export default function AgencyProfilePage() {
  return (
    <DashboardShell role="agency" section="profile">
      <AgencyProfileForm />
    </DashboardShell>
  );
}
