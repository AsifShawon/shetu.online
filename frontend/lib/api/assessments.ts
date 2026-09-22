import { apiDownload, apiRequest, apiUpload } from "./client";

export type AssessmentStatus =
  | "draft"
  | "pending"
  | "proposal_pending"
  | "accepted"
  | "rejected"
  | "revision_requested"
  | "submitted"
  | "approved"
  | "completed";

export interface Assessment {
  id: number;
  student_id: number;
  student_name?: string;
  choice?: number;
  choice_id?: number;
  consultant_id: number;
  consultant_name?: string;
  consultant_service_id: number;
  service_title?: string;
  assessment_country_id?: number;
  country_name?: string;
  assessment_charge: string;
  assessment_duration: string;
  assessment_title: string;
  assessment_description: string;
  preferred_country_id?: number;
  preferred_institute?: string;
  preferred_subject?: string;
  preferred_session?: string;
  student_budget?: string;
  requested_service_categories?: string[];
  report_template_key?: string;
  report_module_keys?: string[];
  status: AssessmentStatus;
  attachment?: string | null;
  accepted_at?: string | null;
  deadline_at?: string | null;
  submitted_at?: string;
  proposals?: AssessmentProposal[];
  review_requests?: ReviewRequest[];
  report_id?: number | null;
  report_submission_status?: string;
  admin_approval_status?: string;
  order_id?: number | null;
  created_at?: string;
}

export interface AssessmentReport {
  id: number;
  assessment_id: number;
  student_id: number;
  consultant_id: number;
  template_key?: string;
  schema_version?: number;
  module_keys?: string[];
  content?: ReportContent;
  ielts_score?: string;
  other_tests?: string;
  english_preparation?: string;
  health_insurance?: string;
  insurance_options?: string;
  additional_health?: string;
  visa_type?: string;
  visa_requirements?: string;
  visa_processing?: string;
  visa_interview?: string;
  university_processing?: string;
  admission_notification?: string;
  visa_application?: string;
  final_confirmation?: string;
  step_ielts?: string;
  step_documents?: string;
  step_apply?: string;
  step_scholarships?: string;
  step_visa?: string;
  step_interview?: string;
  additional_comments?: string;
  submission_status: "draft" | "submitted" | "revision_requested";
  admin_approval_status?: "pending" | "approved" | "rejected";
  approved_by_id?: number | null;
  approved_at?: string | null;
  rejection_reason?: string;
  student_accepted_at?: string | null;
  deadline_at?: string | null;
  assessment_title?: string;
  student_name?: string;
  consultant_name?: string;
  content_preview?: string;
  module_definitions?: ReportModuleDefinition[];
  show_recommended_universities?: boolean;
  recommended_universities?: RecommendedUniversity[];
  current_version?: number;
  report_number?: string;
  validation?: ReportValidation;
  snapshots?: AssessmentReportSnapshot[];
  created_at?: string;
  updated_at?: string;
}

export interface RecommendedUniversity {
  id: number;
  assessment_id: number;
  student_id: number;
  consultant_id: number;
  university_name: string;
  course_name: string;
  country: string;
  program_level: string;
  intake: string;
  duration: string;
  application_deadline?: string | null;
  currency: string;
  fit_category: string;
  fit_score?: number | null;
  official_program_url: string;
  entry_requirements: string;
  key_strengths: string;
  key_risks: string;
  tuition_fees: string;
  living_expenses: string;
  total_estimated_budget: string;
  ielts: string;
  scholarships: string;
  visa_type: string;
  visa_processing_time: string;
  application_processing_time: string;
  admission_notification_time: string;
}

export interface Review {
  id: number;
  assessment_id: number;
  student_id: number;
  student_name?: string;
  consultant_id: number;
  consultant_service_id: number;
  review_message: string;
  review_rating: number;
  created_at?: string;
}

export interface AssessmentProposal {
  id: number;
  assessment_id: number;
  consultant_id: number;
  proposed_charge: string;
  proposed_duration: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  created_at?: string;
}

export interface ReviewRequest {
  id: number;
  assessment_id: number;
  student_id: number;
  consultant_id: number;
  reason: string;
  status: "open" | "approved" | "rejected" | "resolved";
  admin_notes?: string;
  created_at?: string;
}

export interface ReportFieldDefinition {
  key: string;
  label: string;
  kind: "text" | "textarea" | "short_text" | "long_text" | "select" | "date" | "url" | "score" | "checklist" | "repeater";
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: Array<{ value: string; label: string }>;
  columns?: ReportFieldColumn[];
  min_rows?: number;
}

export interface ReportFieldColumn {
  key: string;
  label: string;
  kind: "short_text" | "long_text" | "select" | "date" | "url" | "score";
  required?: boolean;
}

export type ReportScalar = string | number | boolean | null;
export type ReportRow = Record<string, ReportScalar>;
export type ReportValue = ReportScalar | string[] | ReportRow[];
export type ReportContent = Record<string, Record<string, ReportValue>>;

export interface ReportValidation {
  valid: boolean;
  errors: Record<string, string>;
  required_fields: number;
  completed_fields: number;
  completion_percentage: number;
}

export interface AssessmentReportSnapshot {
  id: number;
  version: number;
  schema_version: number;
  template_key: string;
  module_keys: string[];
  content: ReportContent;
  recommended_universities: RecommendedUniversity[];
  submitted_by_name: string;
  submitted_at: string;
  admin_approval_status: "pending" | "approved" | "rejected";
  reviewed_by_name?: string;
  reviewed_at?: string | null;
  qa_checks: Record<string, boolean>;
  review_notes: Record<string, string>;
}

export interface ReportSectionDefinition {
  key: string;
  title: string;
  description?: string;
  fields: ReportFieldDefinition[];
}

export interface ReportModuleDefinition {
  key: string;
  title: string;
  description?: string;
  sections: ReportSectionDefinition[];
}

export interface StudentProfileSummary {
  academic_track?: string;
  ielts_score?: string;
  last_education_title?: string;
  last_education_department?: string;
  last_education_result?: string;
  last_education_duration?: string;
}

export interface AssessmentReportWorkspace {
  assessment: Assessment;
  report: AssessmentReport | null;
  recommended_universities: RecommendedUniversity[];
  module_definitions: ReportModuleDefinition[];
  content: ReportContent;
  report_preview: string;
  schema_version: number;
  current_version: number;
  can_view_report: boolean;
  validation: ReportValidation;
  show_recommended_universities: boolean;
  can_edit: boolean;
  can_submit: boolean;
  report_locked: boolean;
  student_profile?: StudentProfileSummary | null;
}

export interface AssessmentReportExport {
  filename: string;
  title: string;
  html: string;
}

export async function getAssessments(): Promise<Assessment[]> {
  return apiRequest<Assessment[]>("/api/assessments/");
}

export async function getAssessment(id: number): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${id}/`);
}

export async function createAssessment(data: Partial<Assessment>): Promise<Assessment> {
  return apiRequest<Assessment>("/api/assessments/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function acceptAssessment(id: number): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${id}/accept/`, {
    method: "POST"
  });
}

export async function rejectAssessment(id: number): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${id}/reject/`, {
    method: "POST"
  });
}

export async function getAssessmentReportWorkspace(id: number): Promise<AssessmentReportWorkspace> {
  return apiRequest<AssessmentReportWorkspace>(`/api/assessments/${id}/report-workspace/`);
}

export async function getAssessmentReportExport(id: number): Promise<AssessmentReportExport> {
  return apiRequest<AssessmentReportExport>(`/api/assessments/${id}/report-export/`);
}

export async function getAssessmentReportPdf(id: number): Promise<{ blob: Blob; filename?: string }> {
  return apiDownload(`/api/assessments/${id}/report-pdf/`);
}

export async function getAssessmentReports(): Promise<AssessmentReport[]> {
  return apiRequest<AssessmentReport[]>("/api/assessments/reports/");
}

export async function createAssessmentReport(data: Partial<AssessmentReport>): Promise<AssessmentReport> {
  return apiRequest<AssessmentReport>("/api/assessments/reports/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateAssessmentReport(id: number, data: Partial<AssessmentReport>): Promise<AssessmentReport> {
  return apiRequest<AssessmentReport>(`/api/assessments/reports/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function submitAssessmentReport(id: number): Promise<AssessmentReport> {
  return apiRequest<AssessmentReport>(`/api/assessments/reports/${id}/submit/`, {
    method: "POST"
  });
}

export async function getRecommendedUniversities(): Promise<RecommendedUniversity[]> {
  return apiRequest<RecommendedUniversity[]>("/api/assessments/recommended-universities/");
}

export async function createRecommendedUniversity(data: Partial<RecommendedUniversity>): Promise<RecommendedUniversity> {
  return apiRequest<RecommendedUniversity>("/api/assessments/recommended-universities/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function updateRecommendedUniversity(id: number, data: Partial<RecommendedUniversity>): Promise<RecommendedUniversity> {
  return apiRequest<RecommendedUniversity>(`/api/assessments/recommended-universities/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data)
  });
}

export async function deleteRecommendedUniversity(id: number): Promise<void> {
  return apiRequest<void>(`/api/assessments/recommended-universities/${id}/`, {
    method: "DELETE"
  });
}

export async function getReviews(): Promise<Review[]> {
  return apiRequest<Review[]>("/api/assessments/reviews/");
}

export async function createReview(data: Partial<Review>): Promise<Review> {
  return apiRequest<Review>("/api/assessments/reviews/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function createAssessmentProposal(assessmentId: number, data: Partial<AssessmentProposal>): Promise<AssessmentProposal> {
  return apiRequest<AssessmentProposal>(`/api/assessments/${assessmentId}/proposals/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function acceptAssessmentProposal(assessmentId: number, proposalId: number): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${assessmentId}/proposals/${proposalId}/accept/`, {
    method: "POST"
  });
}

export async function acceptAssessmentReport(assessmentId: number): Promise<Assessment> {
  return apiRequest<Assessment>(`/api/assessments/${assessmentId}/accept-report/`, {
    method: "POST"
  });
}

export async function createAssessmentReviewRequest(assessmentId: number, reason: string): Promise<ReviewRequest> {
  return apiRequest<ReviewRequest>(`/api/assessments/${assessmentId}/review-requests/`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}
