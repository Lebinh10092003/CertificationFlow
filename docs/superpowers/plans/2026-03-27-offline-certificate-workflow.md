# Offline Certificate Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove online Drive/Sheets delivery from the product and replace it with an offline import -> merge -> approve -> export workflow centered on stored public certificate links.

**Architecture:** Keep the existing import and PDF-processing pipeline, but strip online integration endpoints and UI. Reuse the stored `public_slug/public_url` identity as the export anchor, and move review/export behavior to batch-scoped offline operations with bulk approval controls.

**Tech Stack:** Django REST Framework, Celery eager/local tasks, React, TypeScript, Vite, openpyxl.

---

## Chunk 1: Backend offline export and review APIs

### Task 1: Remove online-only API surface

**Files:**
- Modify: `backend/apps/data_imports/views.py`
- Modify: `backend/apps/data_imports/urls.py`
- Modify: `backend/apps/competitions/views.py`
- Modify: `backend/apps/competitions/urls.py`
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Test: `backend/apps/data_imports/tests.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Write failing tests asserting removed endpoints are no longer used or exposed.
- [ ] Remove `sync-sheet`, `sheet-columns`, `deliver/drive`, and `deliver/sheet` views and routes.
- [ ] Update or delete tests tied to those endpoints.
- [ ] Run focused backend tests.

### Task 2: Simplify certificate page payloads for offline workflow

**Files:**
- Modify: `backend/apps/certificates/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Write failing tests for offline delivery blockers and page payload expectations.
- [ ] Remove sheet/drive-specific blockers from serializer output.
- [ ] Replace with approval/public-link-oriented readiness flags if needed.
- [ ] Run focused backend tests.

### Task 3: Add bulk review endpoint

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Modify: `backend/apps/certificates/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Write failing tests for bulk approve and bulk unapprove.
- [ ] Add one batch review endpoint that accepts match ids + target approval state.
- [ ] Ensure approving also generates `public_url`.
- [ ] Ensure unapproving clears review requirement state consistently without deleting public identity.
- [ ] Run focused backend tests.

### Task 4: Keep export strictly public-link based

**Files:**
- Modify: `backend/apps/certificates/services/exporting.py`
- Modify: `backend/apps/participants/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Write failing tests for export default columns and participant certificate URL fallback.
- [ ] Remove Drive columns from default export behavior and system column list if no longer needed.
- [ ] Make participant-facing certificate URL resolve only to stored public links.
- [ ] Run focused backend tests.

## Chunk 2: Frontend offline workflow

### Task 5: Replace Drive page with offline export page

**Files:**
- Modify: `frontend/src/app/routes.ts`
- Modify: `frontend/src/app/components/layout/RootLayout.tsx`
- Modify: `frontend/src/app/pages/DriveSync.tsx` or rename it logically in-place
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`
- Test: manual build verification

- [ ] Remove API helpers for online sheet/drive actions.
- [ ] Rename route and navigation copy from Drive delivery to export workflow.
- [ ] Strip UI controls for sheet columns, drive upload, and write-back.
- [ ] Keep batch selection, page list, public link opening, and export builder.
- [ ] Run frontend build.

### Task 6: Add bulk review UX

**Files:**
- Modify: `frontend/src/app/pages/MatchReview.tsx`
- Test: manual build verification

- [ ] Add approval-status filter.
- [ ] Add `Select all visible`, `Clear selection`, `Approve selected`, `Unapprove selected`.
- [ ] Add `Apply status from first selected row`.
- [ ] Keep preview open-in-new-tab behavior from thumbnail and action button.
- [ ] Ensure stats reflect approved/exportable rows.
- [ ] Run frontend build.

### Task 7: Remove online integration forms from setup pages

**Files:**
- Modify: `frontend/src/app/pages/Competitions.tsx`
- Modify: `frontend/src/app/pages/Settings.tsx`
- Modify: `frontend/src/app/pages/Dashboard.tsx`
- Modify: `frontend/src/app/contexts/AppDataContext.tsx` if needed
- Modify: `frontend/src/lib/types.ts`
- Test: manual build verification

- [ ] Remove Google Sheets/Drive setup fields from competition/settings pages.
- [ ] Remove Google connection indicator from header.
- [ ] Update dashboard copy/stats away from Drive metrics.
- [ ] Run frontend build.

## Chunk 3: Verification

### Task 8: End-to-end regression pass

**Files:**
- Review only: `backend/apps/certificates/tests.py`
- Review only: `backend/apps/data_imports/tests.py`
- Review only: `frontend/src/app/components/certificates/ExportBuilderDialog.tsx`

- [ ] Run `..\\.venv\\Scripts\\python.exe manage.py test apps.certificates apps.data_imports`
- [ ] Run `npm run build`
- [ ] Smoke-check import -> process -> review -> export assumptions in code paths.
- [ ] Summarize remaining risks if any legacy integration fields remain in DB but unused.
