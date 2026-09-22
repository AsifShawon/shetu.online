"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ConsultantServiceForm } from "@/components/dashboard/consultant-service-form";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

function ConsultantServiceCreateContent() {
  const searchParams = useSearchParams();
  const rawEditId = searchParams.get("edit");
  const parsedEditId = rawEditId ? Number(rawEditId) : null;
  const editId = Number.isFinite(parsedEditId) ? parsedEditId : null;

  return (
    <DashboardShell role="consultant" section="services">
      <ConsultantServiceForm editId={editId} />
    </DashboardShell>
  );
}

export default function ConsultantServiceCreatePage() {
  return (
    <Suspense fallback={<p className="sd-loading">Loading service form...</p>}>
      <ConsultantServiceCreateContent />
    </Suspense>
  );
}
