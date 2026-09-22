"use client";

import { ConsultantTraining } from "@/components/dashboard/consultant-training";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function ConsultantTrainingPage() {
  return (
    <DashboardShell role="consultant" section="training">
      <ConsultantTraining />
    </DashboardShell>
  );
}
