export type IntegrationConfig = {
  sheets_spreadsheet_id: string;
  sheets_worksheet_name: string;
  sheets_credentials_json?: string;
  has_sheets_credentials?: boolean;
  drive_folder_id: string;
  drive_folder_url: string;
  gmail_sender: string;
  is_sheets_connected: boolean;
  is_drive_connected: boolean;
  is_email_connected: boolean;
  last_sheets_sync_at: string | null;
  last_drive_check_at: string | null;
  last_email_check_at: string | null;
};

export type Competition = {
  id: number;
  name: string;
  slug: string;
  academic_year: string;
  competition_type: string;
  subject: string;
  email_template_subject: string;
  email_template_body: string;
  folder_naming_rule: string;
  file_naming_rule: string;
  is_active: boolean;
  integration_config?: IntegrationConfig;
};

export type DashboardSummary = {
  competition: Competition | null;
  stats: {
    total_students: number;
    certificates_processed: number;
    emails_sent: number;
    public_links: number;
  };
  recent_activities: Array<{
    id: number;
    action: string;
    status: string;
    message: string;
    timestamp: string;
  }>;
  pending_tasks: Array<{
    task: string;
    count: number;
    priority: string;
    link: string;
  }>;
};

export type StudentRow = {
  id: number;
  source_row_number: number | null;
  subject: string;
  notes: string;
  certificate_url: string;
  mail_status: string;
  participant: {
    id: number;
    external_student_id: string;
    full_name: string;
    email: string;
    school_name: string;
    grade: string;
  };
  results: Array<{
    id: number;
    award: string;
    certificate_code: string;
    qualified_round: string;
  }>;
};

export type ImportJob = {
  id: number;
  competition: number;
  source_type: string;
  source_filename: string;
  status: string;
  row_count: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  details_json?: Record<string, unknown>;
  error_summary: string;
  created_at: string;
  finished_at: string | null;
};

export type InspectedWorkbookSheet = {
  name: string;
  row_count: number;
  column_count: number;
  detected_has_header: boolean;
  columns: string[];
  header_columns: string[];
  positional_columns: string[];
  preview_matrix: string[][];
};

export type ImportInspection = {
  import_job: ImportJob;
  inspection: {
    file_type: string;
    sheet_count: number;
    sheets: InspectedWorkbookSheet[];
  };
};

export type ImportExecutionPayload = {
  import_job_id: number;
  selected_sheets: string[];
  has_header: boolean;
  mapping: Record<string, string>;
};

export type SourcePdfBatch = {
  id: number;
  competition: Competition | null;
  uploaded_file_url: string;
  original_filename: string;
  page_count: number;
  page_total: number;
  inferred_competition_name: string;
  confirmed_competition_name: string;
  competition_confirmation_status: string;
  processing_mode: string;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type CertificateExtraction = {
  student_name: string;
  school_name: string;
  award: string;
  subject: string;
  grade: string;
  certificate_code: string;
  qualified_round: string;
  raw_text: string;
  warnings_json: string[];
};

export type CertificateMatch = {
  id: number;
  confidence_score: number;
  confidence_label: string;
  matched_by: string;
  requires_review: boolean;
  is_approved: boolean;
  matched_student_name: string;
  matched_email: string;
  matched_student_id: string;
  competition_enrollment: number | null;
  competition_result: number | null;
  rationale: string;
};

export type CertificatePage = {
  id: number;
  source_batch: number;
  page_number: number;
  split_pdf_url: string;
  preview_image_url: string;
  output_filename: string;
  processing_status: string;
  has_text_layer: boolean;
  public_slug: string | null;
  public_url: string;
  review_status: string;
  export_ready: boolean;
  email_status: string;
  extraction?: CertificateExtraction;
  match?: CertificateMatch;
};

export type AuditLog = {
  id: number;
  action: string;
  status: string;
  message: string;
  object_type: string;
  object_id: string;
  created_at: string;
};

export type ExportColumnOption = {
  key: string;
  label: string;
  source_type: "source" | "system";
};

export type ExportColumnInspection = {
  source_columns: ExportColumnOption[];
  system_columns: ExportColumnOption[];
  default_columns: ExportColumnOption[];
  sheet_modes: string[];
  format_modes: string[];
};

export type PublicCertificate = {
  id: number;
  page_number: number;
  output_filename: string;
  public_slug: string;
  public_url: string;
  split_pdf_url: string;
  student_name: string;
  school_name: string;
  grade: string;
  award: string;
  competition_name: string;
  competition_code: string;
  certificate_code: string;
  qualified_round: string;
  competition: {
    id: number;
    name: string;
    slug: string;
    academic_year: string;
    subject: string;
  } | null;
};

export type BulkReviewResponse = {
  match_ids: number[];
  approved: boolean;
  processed_count: number;
};
