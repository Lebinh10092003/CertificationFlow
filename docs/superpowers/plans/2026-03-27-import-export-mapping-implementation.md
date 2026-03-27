# Import And Export Mapping Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-run workbook inspection and shared-column import mapping, plus a configurable export column builder with formatted Excel output.

**Architecture:** Extend the existing `DataImportJob` flow so uploads can be inspected before execution, then normalized through a shared mapping into the current import pipeline. Extend the batch export service with column inspection, configurable column selection, and workbook styling while keeping the existing default export endpoint available.

**Tech Stack:** Django, DRF, pandas, openpyxl, React, TypeScript, Vite

---

## Chunk 1: Backend Import Inspection And Execution

### Task 1: Extend import job state and serializers for inspect-first uploads

**Files:**
- Modify: `backend/apps/data_imports/models.py`
- Modify: `backend/apps/data_imports/serializers.py`
- Modify: `backend/apps/data_imports/migrations/`
- Test: `backend/apps/data_imports/tests.py`

- [ ] Add a draft inspection status to `DataImportJob.Status`.
- [ ] Add serializer fields needed to expose inspection metadata stored in `details_json`.
- [ ] Generate the migration for the new status support if required.
- [ ] Add a test that an inspect-created job can exist without importing rows immediately.

### Task 2: Build workbook inspection and mapped execution services

**Files:**
- Create: `backend/apps/data_imports/services/workbook.py`
- Modify: `backend/apps/data_imports/services/tabular.py`
- Test: `backend/apps/data_imports/tests.py`

- [ ] Add helpers to read `.csv`, `.xlsx`, and `.xls` into a common workbook representation.
- [ ] Implement sheet inspection with `row_count`, `column_count`, `detected_has_header`, `columns`, and `preview_rows`.
- [ ] Implement Excel-style column letters for headerless sheets.
- [ ] Implement shared mapping normalization from selected sheets into canonical row dictionaries.
- [ ] Validate that required mappings exist across every selected sheet before import.
- [ ] Add tests for header and no-header inspection, multi-sheet selection, and shared mapping execution.

### Task 3: Add inspect and execute API endpoints for workbook imports

**Files:**
- Modify: `backend/apps/data_imports/views.py`
- Modify: `backend/apps/data_imports/urls.py`
- Modify: `backend/apps/data_imports/tasks.py`
- Test: `backend/apps/data_imports/tests.py`

- [ ] Add `POST /api/competitions/{competition_id}/import-file/inspect/`.
- [ ] Add `POST /api/competitions/{competition_id}/import-file/execute/`.
- [ ] Keep the existing direct import endpoint working for compatibility.
- [ ] Ensure execute reuses the inspected upload file and calls the current import pipeline.
- [ ] Add API tests for inspect validation, execute validation, and successful execution.

## Chunk 2: Backend Export Builder And Workbook Styling

### Task 4: Add export column inspection and configurable export services

**Files:**
- Modify: `backend/apps/certificates/services/exporting.py`
- Modify: `backend/apps/certificates/services/delivery.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Add a function that returns exportable source columns and system columns for a batch.
- [ ] Add a configurable workbook builder that accepts ordered columns, custom labels, `sheet_mode`, and `format_mode`.
- [ ] Preserve the current GET export behavior as a default export path.
- [ ] Add system fields such as `Extracted Name`, `Certificate Code`, `Matched Student`, `Confidence`, and `Page Number`.
- [ ] Add workbook styling: header fill/font/alignment, borders, zebra rows, freeze panes, autofilter, width sizing, and hyperlink formatting.
- [ ] Add tests for configurable column ordering, label overrides, sheet modes, and workbook styling markers.

### Task 5: Add export builder endpoints

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Modify: `backend/apps/certificates/urls.py`
- Modify: `backend/apps/certificates/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Add `GET /api/certificate-batches/{batch_id}/export-columns/`.
- [ ] Add `POST /api/certificate-batches/{batch_id}/export/` for configurable exports.
- [ ] Keep `GET /api/certificate-batches/{batch_id}/export/` as the default download.
- [ ] Add request validation for empty column sets and malformed payloads.
- [ ] Add endpoint tests for export column discovery and configurable workbook download.

## Chunk 3: Frontend Import Wizard

### Task 6: Extend shared API/types for import inspection and export builder

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] Add import inspection types for sheets, preview rows, mappings, and execute payloads.
- [ ] Add export column builder types for source/system columns, format modes, and sheet modes.
- [ ] Add API methods for import inspect, import execute, export column inspect, and configurable export.

### Task 7: Replace the simple import panel with a two-step wizard

**Files:**
- Modify: `frontend/src/app/components/student/StudentImportPanel.tsx`
- Create: `frontend/src/app/components/student/ImportMappingWizard.tsx`
- Create: `frontend/src/app/components/student/SheetPreviewTable.tsx`

- [ ] Add upload-and-inspect behavior instead of importing immediately.
- [ ] Render available workbook sheets with selection controls.
- [ ] Add a `has header` toggle and show `A/B/C/...` columns when disabled.
- [ ] Add shared mapping controls across selected sheets with light auto-suggestions.
- [ ] Validate required mappings before execute and surface API errors cleanly.
- [ ] Refresh import job and student summaries after successful execute.

## Chunk 4: Frontend Export Builder

### Task 8: Add export builder UI to the batch delivery page

**Files:**
- Modify: `frontend/src/app/pages/DriveSync.tsx`
- Create: `frontend/src/app/components/certificates/ExportBuilderDialog.tsx`
- Create: `frontend/src/app/components/certificates/ExportColumnList.tsx`

- [ ] Add `Prepare Export` action for the selected batch.
- [ ] Load available source and system columns from the backend.
- [ ] Let the operator include/exclude columns, reorder them, and edit labels.
- [ ] Let the operator choose `sheet_mode` and `format_mode`.
- [ ] Trigger the configurable export download from the builder.
- [ ] Keep the rest of the delivery controls intact.

## Chunk 5: Verification

### Task 9: Run migrations and verify the end-to-end flow

**Files:**
- Modify: `backend/apps/data_imports/tests.py`
- Modify: `backend/apps/certificates/tests.py`

- [ ] Run `.\.venv\Scripts\python.exe backend/manage.py makemigrations data_imports`.
- [ ] Run `.\.venv\Scripts\python.exe backend/manage.py migrate`.
- [ ] Run `.\.venv\Scripts\python.exe backend/manage.py test apps.data_imports apps.certificates`.
- [ ] Run `npm run build` in `frontend`.
- [ ] Validate locally that a workbook can be inspected, mapped, imported, then exported with selected columns and formatting.
