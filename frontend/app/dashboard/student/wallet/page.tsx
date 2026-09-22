"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { WalletTable } from "@/components/dashboard/wallet-table";

export default function StudentWalletPage() {
  return (
    <DashboardShell role="student" section="wallet">
      <WalletTable />
    </DashboardShell>
  );
}
