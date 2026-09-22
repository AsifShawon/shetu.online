"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { WalletTable } from "@/components/dashboard/wallet-table";

export default function AgencyTransactionsPage() {
  return (
    <DashboardShell role="agency" section="transactions">
      <WalletTable />
    </DashboardShell>
  );
}
