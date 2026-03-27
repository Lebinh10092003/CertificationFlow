# Batch Delivery Design

## Goal

Extend the current certificate workflow so operators can deliver certificates per uploaded PDF batch. Delivery includes Google Drive upload, public URL generation, Google Sheet write-back, Excel export, batch filtering across UI screens, and safe deletion of old uploaded batches.

## Scope

- Use `SourcePdfBatch` as the execution/run boundary for all delivery actions.
- Add Drive upload for matched certificate pages in a selected batch.
- Add public website links using `https://yourdomain.com/c/{slug}`.
- Add Google Sheet column discovery and write-back for Drive and public links.
- Add Excel export by batch with the same row structure as the matched output sheets plus two link columns.
- Add batch filters to prevent mixing old and new certificate runs.
- Add confirmed deletion of an uploaded batch and all derived certificate-processing records, without touching imported student data.

## Core Decisions

### Batch-Centric Delivery

- `SourcePdfBatch` remains the only execution record.
- Delivery actions always scope to one batch.
- All review, sync, export, and delete screens can filter by batch.

### Public Link Strategy

- Each delivered certificate page gets a stable `public_slug`.
- URL format: `https://yourdomain.com/c/{slug}`.
- Slug format: normalized `student_name + award + competition_code + grade`.
- If a collision still occurs, append a deterministic suffix based on the page id.

### Google Sheet Write-Back

- Read Sheet headers from the configured worksheet before write-back.
- Operators choose which columns receive `Drive Link` and `Public Link`.
- If the chosen column does not exist, backend can append it to the header row and then write values.
- Write-back only updates rows that are matched to the selected batch.

### Excel Export

- Export only matched records for the selected batch.
- Preserve the output-sheet shape used by workbook sheets like `ICO_OUTPUT` and `IAIO_OUTPUT`.
- Append `Drive Link` and `Public Link` columns.
- When a batch spans multiple competition codes, create one worksheet per competition code.

### Deletion Semantics

- Confirmed batch deletion removes:
  - `CertificatePage`
  - `CertificateExtraction`
  - `CertificateMatch`
  - derived local files for split PDFs and previews
  - the source uploaded PDF for that batch
- Deletion does not remove:
  - `Participant`
  - `CompetitionEnrollment`
  - `CompetitionResult`
  - `DataImportJob`
  - anything already uploaded to Drive
  - anything already written to Google Sheets

## Backend Changes

### Data Model

- Add `public_slug` and `public_url` to `CertificatePage`.
- Keep delivery status on `CertificatePage` using existing `drive_file_id`, `drive_file_url`, and `sheet_write_status`.

### New Services

- `apps/certificates/services/delivery.py`
  - generate stable slug and public URL
  - upload one page PDF to Drive
  - deliver an entire batch to Drive
  - discover Sheet columns
  - append missing Sheet columns
  - write links back to Google Sheet
- `apps/certificates/services/exporting.py`
  - build batch export workbooks
  - map matched rows into output sheet columns

### New API Endpoints

- `GET /api/competitions/{competition_id}/sheet-columns/`
- `POST /api/certificate-batches/{batch_id}/deliver/drive/`
- `POST /api/certificate-batches/{batch_id}/deliver/sheet/`
- `GET /api/certificate-batches/{batch_id}/export/`
- `DELETE /api/certificate-batches/{batch_id}/`
- `GET /api/public-certificates/{slug}/`

### Matching/Data Rules Needed for Export

- Importer must accept workbook formats such as:
  - `Candidate's Name`
  - `School/ Institution Name`
  - `Award Status`
  - `Qualification Status`
  - `Parent Email`
  - `Teacher Email`
  - `Competition`
- Export mapping should include enough participant/result metadata to recreate rows similar to `ICO_OUTPUT` and `IAIO_OUTPUT`.

## Frontend Changes

### Certificate Processing

- Show batch filter and batch actions directly in uploaded files list.
- Add delete action with confirmation modal.

### Match & Review

- Add batch filter to keep tables scoped to one uploaded file.

### Drive Sync / Delivery

- Convert current status-only page into a working delivery console.
- Controls:
  - batch picker
  - load Sheet columns
  - choose Drive Link column
  - choose Public Link column
  - upload batch to Drive
  - write links to Sheet
  - export Excel
- Show page-level delivery statuses and link previews.

### Public Certificate Page

- Add `/c/:slug` route.
- Show certificate details and a download/open action for the matched PDF.

## Error Handling

- Missing credentials or config return actionable API errors.
- Batch actions report partial successes at page level.
- Sheet write-back does not block Excel export.
- Delete batch rejects removal while the batch is actively processing.

## Verification

- Backend tests for slug generation, Drive upload service, Sheet column discovery, Sheet write-back, export workbook shape, and batch deletion.
- Frontend build verification plus interaction checks for filters and actions.
- Local end-to-end validation on a sample batch.

## Constraints

- Current repo is not a git repository, so spec/plan files can be written but not committed in this workspace.
