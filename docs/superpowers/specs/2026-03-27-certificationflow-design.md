# CertificationFlow Design

## Goal

Build a production-oriented certificate processing system with a Django backend and the provided React frontend. All runtime data must come from the database or real uploaded files. The system must not use mock records in the UI or backend workflow.

The system supports four sub-projects:

1. Core data and certificate pipeline
2. Match and review
3. Delivery integrations
4. Operations layer

This document fully designs the whole system and defines the first implementation target as sub-project 1 while keeping stable interfaces for later phases.

## Core Constraints

- Backend: Django
- Runtime data source: database only
- Imported participant and result data come from Excel/CSV import or Google Sheets sync
- Each uploaded PDF belongs to exactly one competition
- The system must infer the competition name from the uploaded PDF and require user confirmation before batch processing continues
- Each PDF page is already one complete certificate
- The system only splits the source PDF into one-page PDFs; it does not generate new certificate designs
- The PDF pipeline must support both text PDFs and scanned/image PDFs

## Architecture

### Frontend

- Existing React/Vite UI becomes the operator console
- All screens load data from Django APIs
- No hardcoded statistics, recipients, matches, or certificate records remain in the app
- Polling is acceptable for long-running jobs in the first release

### Backend

- Django + Django REST Framework
- PostgreSQL as the primary production database
- Celery + Redis for background jobs
- Local file storage in the first implemented slice, with model fields reserved for Google Drive identifiers and URLs
- Service-layer modules for import, extraction, OCR, matching, and logging

### Background Processing

Use Celery tasks for:

- CSV/Excel import
- Google Sheets sync
- PDF splitting
- PDF text extraction
- OCR fallback
- competition inference
- certificate metadata extraction
- initial matching
- downstream Drive upload and email delivery in future phases

## Sub-Project Breakdown

### Sub-Project 1: Core Data and Certificate Pipeline

Scope:

- Competition management
- Excel/CSV import into database
- Google Sheets sync into database
- Upload source PDF batches
- Infer competition name from PDF
- User confirmation of competition
- Split source PDF into one-page certificates
- Extract text directly when available
- OCR fallback for scanned/image pages
- Store extracted metadata and raw text
- Generate initial automatic matches against database records

### Sub-Project 2: Match and Review

Scope:

- Review queue for low-confidence or unmatched certificates
- Manual correction of extracted metadata
- Manual linking to participants/results
- Approval workflow for matched certificates

### Sub-Project 3: Delivery Integrations

Scope:

- Google Drive upload
- Google Sheets write-back
- Email composition and send
- Delivery retries and failure tracking

### Sub-Project 4: Operations Layer

Scope:

- Dashboard summaries
- Logs and audit trails
- Settings and matching rules
- Integration health

## Data Model

### Competition

Represents one academic competition or contest.

Key fields:

- name
- slug
- academic_year
- competition_type
- subject
- email_template_subject
- email_template_body
- folder_naming_rule
- file_naming_rule
- source_kind_defaults
- is_active

### IntegrationConfig

Represents per-competition integration settings.

Key fields:

- competition
- sheets_spreadsheet_id
- sheets_worksheet_name
- sheets_credentials_json
- drive_folder_id
- drive_folder_url
- gmail_sender
- is_sheets_connected
- is_drive_connected
- is_email_connected
- last_sheets_sync_at
- last_drive_check_at
- last_email_check_at

### Participant

Represents a student or participant identity.

Key fields:

- external_student_id
- full_name
- normalized_name
- email
- school_name
- normalized_school_name
- grade

### CompetitionEnrollment

Represents a participant in one competition and stores competition-specific row mapping.

Key fields:

- competition
- participant
- source_row_number
- subject
- notes
- sheet_row_key

### CompetitionResult

Represents official result data imported into the database.

Key fields:

- competition_enrollment
- award
- certificate_code
- qualified_round
- imported_source
- import_job

### DataImportJob

Represents one import or sync run.

Key fields:

- competition
- source_type (`csv`, `xlsx`, `google_sheets`)
- source_filename
- status
- row_count
- created_count
- updated_count
- skipped_count
- error_count
- started_at
- finished_at
- error_summary

### SourcePdfBatch

Represents one uploaded source PDF file.

Key fields:

- competition
- uploaded_file
- original_filename
- page_count
- inferred_competition_name
- confirmed_competition_name
- competition_confirmation_status
- processing_mode
- status
- started_at
- finished_at

### CertificatePage

Represents one page from the uploaded source PDF. This is the core processing unit.

Key fields:

- source_batch
- page_number
- split_pdf_file
- preview_image_file
- output_filename
- processing_status
- drive_file_id
- drive_file_url
- sheet_write_status
- email_status

### CertificateExtraction

Represents parsed text and extracted fields for one certificate page.

Key fields:

- certificate_page
- extraction_method (`text`, `ocr`, `text_plus_ocr`)
- raw_text
- competition_name
- student_name
- normalized_student_name
- school_name
- normalized_school_name
- award
- subject
- certificate_code
- qualified_round
- warnings_json

### CertificateMatch

Represents an automatic or manual link between a certificate page and database records.

Key fields:

- certificate_page
- competition_enrollment
- competition_result
- confidence_score
- confidence_label
- matched_by
- requires_review
- is_approved
- reviewed_by
- reviewed_at
- rationale

### AuditLog

Generic operational log entry.

Key fields:

- competition
- actor
- object_type
- object_id
- action
- status
- message
- details_json
- created_at

## Pipeline Design

### Data Ingestion

1. Operator selects a competition or creates one
2. Operator imports Excel/CSV or triggers Google Sheets sync
3. Backend normalizes source columns into `Participant`, `CompetitionEnrollment`, and `CompetitionResult`
4. Import is idempotent per competition and source row when a stable row key is available
5. Import job results are stored and exposed to the UI

### PDF Intake

1. Operator uploads one source PDF
2. Backend creates `SourcePdfBatch`
3. Backend inspects the PDF page count and stores it
4. Backend extracts text from the first pages and the full document where practical
5. Backend infers the competition name from the extracted text
6. Frontend shows the inferred name and requires explicit user confirmation or correction
7. Processing only continues after confirmation

### Splitting

1. Each page is exported as a one-page PDF
2. Each page becomes one `CertificatePage`
3. A preview image is generated for fast UI display
4. Output file name is derived from current naming rules and later corrected when extracted metadata improves

### Extraction

1. Attempt direct text extraction with PyMuPDF
2. If text is too sparse or empty, render the page to an image and run OCR
3. Parse fields from raw text
4. Normalize Vietnamese names and school names for matching
5. Save warnings such as missing code, duplicate code, empty name, or parse ambiguity

### Matching

1. First try exact certificate code match within the selected competition
2. Then try exact student ID match when the source text includes it
3. Then fuzzy name match within the same competition using subject and award as supporting constraints
4. Mark low-confidence or ambiguous results as `requires_review`

## API Design

### Read APIs

- competitions list/detail
- dashboard summary
- students list
- import jobs list
- pdf batches list/detail
- certificate pages list/detail
- match review queue
- logs list
- settings detail

### Write APIs

- create/update competition
- import Excel/CSV
- trigger Google Sheets sync
- upload source PDF
- confirm inferred competition
- trigger batch processing
- update extraction corrections
- approve/reject match
- update settings

## Frontend Behavior

### Dashboard

- Loads summary counts from DB
- Shows recent audit logs
- Shows pending review counts

### Competition Setup

- Creates and edits competitions
- Shows integration status from `IntegrationConfig`

### Student Data

- Lists `CompetitionEnrollment` joined with `Participant` and `CompetitionResult`
- Filters by name, email, award, mail status
- Highlights missing email and missing certificate links based on DB values

### Certificate Processing

- Uploads source PDF
- Shows source batch records and real progress
- Displays inferred competition name and requires confirmation
- Starts processing modes stored on the backend

### Match and Review

- Lists records from `CertificateMatch`
- Opens certificate preview and extracted fields from DB
- Allows manual correction and approval

### Drive Sync, Email, Logs, Settings

- Must render only DB/API data
- In the first implementation slice, Drive and Email may show empty-state records and integration readiness instead of completed delivery features

## OCR and Parsing Rules

### Text Detection

- A PDF page is considered text-readable when extracted text length crosses a minimum threshold and contains letter density above a configured ratio
- Otherwise OCR is attempted

### Competition Name Inference

Order of signals:

1. Repeated high-frequency title-like line across early pages
2. Exact or fuzzy match against existing competition names in DB
3. User correction at confirmation step

### Field Extraction

Heuristics parse:

- student name
- school name
- award
- certificate code
- subject
- qualified round

The system stores raw text and warnings even when parsing is partial.

## Matching Rules

1. Search only inside the confirmed competition
2. Exact certificate code match wins
3. Exact participant ID match wins when present
4. Fuzzy name match needs supporting agreement on award or subject
5. Multiple candidate ties always require review

## Error Handling

- All background jobs write structured `AuditLog` entries
- Import and batch status remain queryable after failure
- Partial progress is preserved; already split pages are not discarded on later extraction failure
- OCR missing dependency is reported as actionable infrastructure error, not silent failure

## Security and Operations

- Secrets come from environment variables, not committed settings
- Uploaded files stay inside managed media directories
- API endpoints should be ready for authentication middleware even if the first implementation uses open local access
- Long-running tasks are isolated from HTTP requests

## First Implementation Target

Implement sub-project 1 end to end with these production-facing guarantees:

- no mock runtime data
- real database-backed competition and participant records
- real file upload and split pipeline
- real text extraction and OCR fallback code path
- real batch/job statuses exposed to the frontend
- real match records stored in the database

Deferred features for later phases:

- final Google Drive upload execution
- final Google Sheets write-back execution
- final email send execution
- advanced dashboard analytics

