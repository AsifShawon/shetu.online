"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { StudentProfileForm } from "@/components/dashboard/student-profile-form";

export default function StudentProfilePage() {
  return (
    <DashboardShell role="student" section="profile">
      <StudentProfileForm />
    </DashboardShell>
  );
}
