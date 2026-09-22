import { Suspense } from "react";

import { StudentConsultantsOfEduWise } from "@/components/dashboard/student-consultants-of-eduwise";
import { DashboardShell } from "@/components/legacy/live-dashboard-page";

export default function DashboardConsultantsOfEduWisePage() {
  return (
    <DashboardShell role="student" section="choices">
      <Suspense fallback={<p className="sd-loading">Loading consultants...</p>}>
        <StudentConsultantsOfEduWise />
      </Suspense>
    </DashboardShell>
  );
}
