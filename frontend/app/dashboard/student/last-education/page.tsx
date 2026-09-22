"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { StudentLastEducationForm } from "@/components/dashboard/student-last-education-form";

export default function StudentLastEducationPage() {
  return (
    <DashboardShell role="student" section="profile">
      <StudentLastEducationForm />
    </DashboardShell>
  );
}
