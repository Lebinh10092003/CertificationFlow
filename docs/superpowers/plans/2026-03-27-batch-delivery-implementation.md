# Batch Delivery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add batch-scoped delivery features: Drive upload, public links, Sheet write-back, Excel export, batch filters, and confirmed batch deletion.

**Architecture:** Extend the existing Django certificate pipeline so `SourcePdfBatch` is the boundary for delivery actions. Backend services own Drive, Sheet, export, and deletion behavior; React pages call these APIs and keep all views filterable by batch.

**Tech Stack:** Django, DRF, pandas, openpyxl, google-api-python-client, React, TypeScript, Vite

---

## Chunk 1: Backend Delivery Foundations

### Task 1: Extend certificate models and serializers for delivery

**Files:**
- Modify: `backend/apps/certificates/models.py`
- Modify: `backend/apps/certificates/serializers.py`
- Modify: `backend/apps/certificates/migrations/`
- Test: `backend/apps/certificates/tests.py`

- [ ] Add `public_slug` and `public_url` to `CertificatePage`.
- [ ] Expose delivery fields in serializers.
- [ ] Add migration.
- [ ] Add/extend model tests around URL serialization.

### Task 2: Build Drive, Sheet, and export service modules

**Files:**
- Create: `backend/apps/certificates/services/delivery.py`
- Create: `backend/apps/certificates/services/exporting.py`
- Modify: `backend/apps/certificates/services/__init__.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Implement public slug generation and URL rendering.
- [ ] Implement Google Drive upload service using service account credentials.
- [ ] Implement Sheet header discovery and link write-back.
- [ ] Implement batch Excel export workbook generation.
- [ ] Add tests using mocks/fakes for Google APIs and workbook assertions.

## Chunk 2: Backend APIs And Destructive Safety

### Task 3: Add batch delivery and deletion endpoints

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Modify: `backend/apps/competitions/urls.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Add endpoint to fetch Sheet columns from competition config.
- [ ] Add endpoint to upload a batch to Drive.
- [ ] Add endpoint to write batch links to Sheet.
- [ ] Add endpoint to export batch workbook.
- [ ] Add endpoint to delete a batch with safety checks.
- [ ] Add API tests for each endpoint.

### Task 4: Improve import/export row mapping for workbook formats

**Files:**
- Modify: `backend/apps/data_imports/services/tabular.py`
- Modify: `backend/apps/participants/serializers.py`
- Test: `backend/apps/data_imports/tests.py`

- [ ] Support workbook header aliases from sample output sheets.
- [ ] Expose enough student/result fields for batch export rows.
- [ ] Verify sample workbook rows can be imported into real participant data.

## Chunk 3: Frontend Delivery Console And Public Route

### Task 5: Extend API client and types for batch delivery

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`

- [ ] Add types for sheet columns, delivery responses, export metadata, and public certificate payload.
- [ ] Add API methods for batch-scoped delivery, export, delete, and column discovery.

### Task 6: Add batch filters and delivery UI

**Files:**
- Modify: `frontend/src/app/pages/CertificateProcessing.tsx`
- Modify: `frontend/src/app/pages/MatchReview.tsx`
- Modify: `frontend/src/app/pages/DriveSync.tsx`
- Create: `frontend/src/app/components/certificates/BatchFilter.tsx`
- Create: `frontend/src/app/components/certificates/DeleteBatchDialog.tsx`

- [ ] Add reusable batch selector.
- [ ] Scope certificate and match tables by selected batch.
- [ ] Replace Drive Sync placeholder page with working delivery actions.
- [ ] Add delete flow with confirmation dialog.

### Task 7: Add public certificate page and route

**Files:**
- Modify: `frontend/src/app/routes.ts`
- Create: `frontend/src/app/pages/PublicCertificate.tsx`

- [ ] Add route for `/c/:slug`.
- [ ] Render certificate metadata and download/open actions from API data.

## Chunk 4: Verification

### Task 8: End-to-end verification

**Files:**
- Modify: `backend/apps/certificates/tests.py`
- Modify: `backend/apps/data_imports/tests.py`

- [ ] Run backend test suite for certificates and imports.
- [ ] Run frontend build.
- [ ] Validate sample batch flow locally: import workbook, process PDF batch, upload/export/delete behavior.
- [ ] Record any remaining limitations in final handoff.
