# Drive Folder Export Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the operator provide one public Google Drive folder link, upload all approved split certificates there, and export a merged student list with the corresponding Drive certificate link.

**Architecture:** Keep Google credentials as one backend-level setup, not per customer. The UI stores only a Drive folder URL/ID on the competition, the backend parses the folder ID, uploads approved certificate PDFs, sets each file to anyone-with-link viewer, stores `drive_file_url`, and uses that URL as the primary export link. Existing internal public URLs remain as fallback/admin preview, but exported delivery lists should prefer Drive links.

**Tech Stack:** Django, Django REST Framework, Google Drive API v3, React, TypeScript, openpyxl.

---

## Operating Model

- Operator prepares a Google Drive folder before running the workflow.
- Folder must be writable by the backend uploader. To avoid customer-specific setup, the practical option is either:
  - share the folder with the backend service account once as Editor, or
  - temporarily make the folder public/editor while the upload runs.
- The app accepts only the folder URL from the operator.
- The app uploads only approved certificate pages.
- Uploaded files receive an explicit `anyone` + `reader` permission.
- The operator may manually lock the folder afterward.
- Important Google Drive behavior: if the parent folder is temporarily public/editor, files may inherit broader edit access from the folder until the folder is locked. The app can set file-level viewer permission, but it cannot override inherited folder editor access while the folder stays editor-public.

## File Map

- Modify: `backend/apps/competitions/models.py`
  - Keep using `IntegrationConfig.drive_folder_id` and `drive_folder_url`.
  - No new model should be needed unless we want a delivery setting later.

- Modify: `backend/apps/competitions/serializers.py`
  - Expose `drive_folder_url` and `drive_folder_id` through the existing competition/settings payload if not already exposed.

- Modify: `backend/apps/certificates/services/delivery.py`
  - Add folder URL parsing and validation helpers.
  - Harden Drive upload to use folder URL/ID, create uploaded files, set `anyone reader`, and store Drive links.
  - Return page-level success/failure details.

- Modify: `backend/apps/certificates/services/exporting.py`
  - Add `drive_link` as a system export column.
  - Prefer `drive_file_url` for the default link column.
  - Keep `public_link` available as fallback/optional column.

- Modify: `backend/apps/certificates/serializers.py`
  - Expose `drive_file_url` and Drive readiness on certificate pages.
  - Avoid generating internal public URLs for unapproved/unmatched pages.

- Modify: `backend/apps/certificates/views.py`
  - Add endpoints to save/validate Drive folder URL and upload selected batch certificates to Drive.
  - Optionally add a competition-level upload endpoint for multiple selected batches.

- Modify: `backend/apps/certificates/urls.py`
  - Wire the new Drive upload/folder endpoints.

- Modify: `frontend/src/lib/api.ts`
  - Add API calls for Drive folder save/validate and batch upload.

- Modify: `frontend/src/lib/types.ts`
  - Add `drive_file_url`, `drive_upload_status`, and any backend eligibility fields.

- Modify: `frontend/src/app/pages/DriveSync.tsx`
  - Add one Drive folder URL input.
  - Add upload action for approved pages.
  - Show uploaded/failed counts.
  - Show Drive links in readiness table.
  - Make export builder default to `Drive Link`.

- Test: `backend/apps/certificates/tests.py`
  - Add service/view/export regression tests for Drive upload and export.

---

## Chunk 1: Backend Drive Folder URL And Upload Service

### Task 1: Parse And Store Drive Folder URL

**Files:**
- Modify: `backend/apps/certificates/services/delivery.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing tests for folder URL parsing**

Cover these accepted inputs:

```text
https://drive.google.com/drive/folders/<folder_id>
https://drive.google.com/drive/u/0/folders/<folder_id>
https://drive.google.com/open?id=<folder_id>
<folder_id>
```

Expected: helper returns the same folder ID for all valid inputs and raises `ValidationError` for empty/invalid input.

- [ ] **Step 2: Implement `parse_drive_folder_id(value: str) -> str`**

Keep it small and pure in `delivery.py`.

- [ ] **Step 3: Run targeted test**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: new parsing tests pass.

### Task 2: Upload Approved Certificates To The Folder

**Files:**
- Modify: `backend/apps/certificates/services/delivery.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing tests with mocked Drive API**

Test cases:

- approved page with `split_pdf_file` uploads to configured folder
- created Drive permission body is `{"role": "reader", "type": "anyone"}`
- `drive_file_id` and `drive_file_url` are persisted
- already-uploaded pages are skipped unless overwrite mode is later added
- unapproved pages are not uploaded

- [ ] **Step 2: Update `deliver_batch_to_drive`**

Expected behavior:

- read `IntegrationConfig.drive_folder_url`
- parse and persist `drive_folder_id` if missing or changed
- upload only `batch_delivery_pages(batch)`
- create Drive file under that folder
- set `anyone reader`
- store `https://drive.google.com/file/d/{file_id}/view`
- return summary counts

- [ ] **Step 3: Preserve low-configuration UX**

Backend still uses existing `GOOGLE_SERVICE_ACCOUNT_JSON` or competition credentials. The operator only enters the Drive folder URL.

- [ ] **Step 4: Run targeted tests**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: Drive upload tests pass.

---

## Chunk 2: API Endpoints

### Task 3: Add Save/Validate Folder Endpoint

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing API test**

POST payload:

```json
{
  "drive_folder_url": "https://drive.google.com/drive/folders/folder123"
}
```

Expected:

- saves `drive_folder_url`
- saves parsed `drive_folder_id`
- returns current integration config or a small success payload

- [ ] **Step 2: Implement endpoint**

Suggested route:

```text
POST /api/competitions/<competition_id>/drive-folder/
```

- [ ] **Step 3: Run API test**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: endpoint test passes.

### Task 4: Add Upload-To-Drive Endpoint

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing API test**

POST:

```text
POST /api/certificate-batches/<batch_id>/upload-drive/
```

Expected:

- rejects batches without competition
- rejects missing Drive folder URL/ID
- calls delivery service
- returns `{total_pages, processed_pages, failed_pages}`

- [ ] **Step 2: Implement endpoint**

Use `deliver_batch_to_drive(batch)` and return `BatchDeliverySummary`.

- [ ] **Step 3: Run API test**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: endpoint test passes.

---

## Chunk 3: Export Uses Drive Link

### Task 5: Add Drive Link System Column

**Files:**
- Modify: `backend/apps/certificates/services/exporting.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing export tests**

Expected:

- `get_batch_export_columns()` includes `drive_link`
- default columns include `Drive Link`
- workbook writes `page.drive_file_url` in the Drive Link column
- Drive Link cell is a hyperlink
- Public Link remains selectable but is no longer the default primary link

- [ ] **Step 2: Implement export column**

Add to `SYSTEM_EXPORT_COLUMNS`:

```python
{"key": "drive_link", "label": "Drive Link"}
```

Add `_system_row()` value:

```python
"drive_link": page.drive_file_url,
```

Add `drive_link` to `LINK_KEYS` and default columns.

- [ ] **Step 3: Run export tests**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: export tests pass.

### Task 6: Make Export Readiness Reflect Drive Upload

**Files:**
- Modify: `backend/apps/certificates/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] **Step 1: Write failing serializer test**

Approved page without `drive_file_url` should be approved but not Drive-export-ready.

- [ ] **Step 2: Add serializer fields**

Add:

- `drive_file_url`
- `drive_ready`
- optionally `export_ready` remains approval-based if Excel fallback is allowed

Recommended:

- `export_ready`: approved and has a link usable for export
- `drive_ready`: approved and has `drive_file_url`

- [ ] **Step 3: Stop auto-generating internal public URLs for unready pages**

Change `get_public_url()` so it returns existing public URL only when safe, and does not call `ensure_public_identity()` for pages without extraction/match/approval.

- [ ] **Step 4: Run serializer tests**

Run: `python manage.py test apps.certificates.tests.CertificateDeliveryTests`

Expected: serializer handles split-only and extract-only pages without crashing.

---

## Chunk 4: Frontend Workflow

### Task 7: Add Folder URL Input And Upload Action

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/app/pages/DriveSync.tsx`

- [ ] **Step 1: Add types**

Add fields to `CertificatePage`:

```ts
drive_file_url: string;
drive_ready: boolean;
```

- [ ] **Step 2: Add API methods**

Add:

```ts
saveDriveFolder(competitionId: number, driveFolderUrl: string)
uploadBatchToDrive(batchId: number)
```

- [ ] **Step 3: Update UI**

On export page:

- one input: Drive folder URL
- one button: Save Folder
- one button: Upload Approved Certificates
- stats: approved, uploaded to Drive, missing Drive link, failed upload
- table link button: Drive
- export copy: "Excel will use Drive links for delivered certificates."

- [ ] **Step 4: Build frontend**

Run: `npm run build`

Expected: production build succeeds.

---

## Chunk 5: Full Verification

### Task 8: Backend Verification

**Files:**
- No code changes beyond previous chunks

- [ ] Run targeted backend tests

```bash
python manage.py test apps.certificates apps.data_imports
```

Expected: all tests pass.

- [ ] Run full backend tests if time allows

```bash
python manage.py test
```

Expected: all tests pass.

### Task 9: Manual Workflow Verification

**Files:**
- No code changes beyond previous chunks

- [ ] Prepare a test Drive folder.
- [ ] Ensure backend uploader can write to the folder.
- [ ] Import student workbook.
- [ ] Upload/process certificate PDF.
- [ ] Approve matches.
- [ ] Paste Drive folder URL in Export page.
- [ ] Click upload to Drive.
- [ ] Confirm Drive files appear in the folder.
- [ ] Export Excel.
- [ ] Confirm each approved student row has a `Drive Link`.
- [ ] Open a Drive Link in an incognito browser and confirm viewer access.
- [ ] Lock the Drive folder manually and confirm links still open as intended.

---

## Risks And Decisions

- Google Drive does not support truly anonymous upload from only a folder link. The backend still needs one uploader identity, ideally the existing service account configured once globally.
- If the folder is temporarily public/editor, uploaded files may inherit edit access from the folder until the operator locks it. This is Drive behavior, not app behavior.
- The app should set each uploaded file to `anyone reader`, matching the chosen file-level permission.
- Internal public links should remain available for preview/fallback, but the delivery Excel should prefer Drive Link.
- Existing `CertificatePagePdfView` currently allows anonymous page-id access. A follow-up hardening task should restrict anonymous PDF access to approved public certificates only.

