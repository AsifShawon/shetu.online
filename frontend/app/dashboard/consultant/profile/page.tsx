"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantProfile } from "@/components/dashboard/consultant-profile";

export default function ConsultantProfilePage() {
  return (
    <DashboardShell role="consultant" section="profile">
      <ConsultantProfile />
    </DashboardShell>
  );
}
