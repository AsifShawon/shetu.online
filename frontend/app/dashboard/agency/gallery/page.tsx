"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { AgencyGallery } from "@/components/dashboard/agency-gallery";

export default function AgencyGalleryPage() {
  return (
    <DashboardShell role="agency" section="gallery">
      <AgencyGallery />
    </DashboardShell>
  );
}
