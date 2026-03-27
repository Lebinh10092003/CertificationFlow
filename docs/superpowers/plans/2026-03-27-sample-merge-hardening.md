# Sample Merge Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sample SCO workbook and edited PDFs merge into high-confidence certificate matches, merge data across selected workbook sheets, and expose export-column selection clearly for approved rows.

**Architecture:** Harden the import pipeline in three layers: normalize workbook rows from heterogeneous sheets into shared semantic fields, consolidate rows across selected sheets by a stable merge key before persisting, and tighten certificate matching so only strong exact-key matches become high confidence. Keep export based on the merged `source_data_json` so cross-sheet columns appear in the Excel builder automatically.

**Tech Stack:** Django, DRF, pandas/openpyxl, React, TypeScript, openpyxl export formatting

---

## Chunk 1: Import Normalization And Sheet Consolidation

**Files:**
- Modify: `backend/apps/common/text.py`
- Modify: `backend/apps/data_imports/services/workbook.py`
- Modify: `backend/apps/data_imports/services/tabular.py`
- Modify: `backend/apps/data_imports/tests.py`

- [ ] Add shared normalization helpers for Vietnamese text, grade values, and competition inference.
- [ ] Add backend field-alias resolution so one shared mapping can still read equivalent headers across different selected sheets.
- [ ] Infer competition code from sheet name when a sheet does not expose a competition column.
- [ ] Consolidate prepared rows across selected sheets by a stable merge key before persisting.
- [ ] Merge cross-sheet columns into `source_data_json` so export can surface them later.
- [ ] Add regression tests for multi-sheet consolidation and alias fallback.

## Chunk 2: PDF Extraction And Matching Hardening

**Files:**
- Modify: `backend/apps/certificates/services/parsing.py`
- Modify: `backend/apps/certificates/services/matching.py`
- Modify: `backend/apps/certificates/tests.py`

- [ ] Fix grade parsing for the SCO edited certificate format.
- [ ] Prefer actual competition title lines instead of the generic “This recognises...” line.
- [ ] Normalize award and grade comparisons before matching.
- [ ] Make exact certificate code and unique `name + grade + competition` matches high confidence.
- [ ] Keep fuzzy fallback below high confidence and require review for ambiguous duplicates.
- [ ] Add regression tests for the edited PDF sample patterns and exact-key matching.

## Chunk 3: Review And Export UX

**Files:**
- Modify: `frontend/src/app/components/student/ImportMappingWizard.tsx`
- Modify: `frontend/src/app/pages/DriveSync.tsx`
- Modify: `frontend/src/app/components/certificates/ExportBuilderDialog.tsx`
- Modify: `frontend/src/lib/types.ts`

- [ ] Relax import wizard validation to allow selected sheets with alias-resolved headers instead of blocking on literal header mismatch.
- [ ] Surface clearer messaging that export columns come from merged source data plus system columns.
- [ ] Keep export builder visible and usable whenever the selected batch has approved/export-ready rows.
- [ ] Ensure the export builder labels make cross-sheet source columns understandable.

## Chunk 4: Verification

**Files:**
- Modify as needed from earlier chunks

- [ ] Run backend tests for `apps.data_imports` and `apps.certificates`.
- [ ] Run frontend production build.
- [ ] Summarize how to use the merged-sheet import and export flow with the SCO sample workbook/PDFs.
