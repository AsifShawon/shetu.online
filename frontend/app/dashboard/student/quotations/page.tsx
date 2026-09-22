"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { QuotationsTable } from "@/components/dashboard/quotations-table";

export default function StudentQuotationsPage() {
  return (
    <DashboardShell role="student" section="quotations">
      <QuotationsTable />
    </DashboardShell>
  );
}
