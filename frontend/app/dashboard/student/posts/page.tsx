"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { StudentPosts } from "@/components/dashboard/student-posts";

export default function StudentPostsDashboardPage() {
  return (
    <DashboardShell role="student" section="posts">
      <StudentPosts />
    </DashboardShell>
  );
}
