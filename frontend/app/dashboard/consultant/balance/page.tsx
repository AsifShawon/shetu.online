"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantBalance } from "@/components/dashboard/consultant-balance";

export default function ConsultantBalancePage() {
  return (
    <DashboardShell role="consultant" section="balance">
      <ConsultantBalance />
    </DashboardShell>
  );
}
