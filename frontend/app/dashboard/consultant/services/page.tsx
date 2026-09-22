"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantServices } from "@/components/dashboard/consultant-services";

export default function ConsultantServicesPage() {
  return (
    <DashboardShell role="consultant" section="services">
      <ConsultantServices />
    </DashboardShell>
  );
}
