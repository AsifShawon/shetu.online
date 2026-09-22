"use client";

import { DashboardShell } from "@/components/legacy/live-dashboard-page";
import { ConsultantReviews } from "@/components/dashboard/consultant-reviews";

export default function ConsultantReviewsPage() {
  return (
    <DashboardShell role="consultant" section="reviews">
      <ConsultantReviews />
    </DashboardShell>
  );
}
