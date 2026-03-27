# Delivery Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent misdirected sheet updates and accidental delivery/export of unapproved certificates.

**Architecture:** Persist the originating sheet name on imported enrollments so write-back can target the correct tab. Tighten delivery/export/public-link eligibility around approved matches and fail fast when Drive links are missing instead of writing partial data out to external systems.

**Tech Stack:** Django, Django REST Framework, openpyxl, React, TypeScript

---

## Chunk 1: Backend Data Path

### Task 1: Persist source sheet metadata on enrollments

**Files:**
- Modify: `backend/apps/participants/models.py`
- Modify: `backend/apps/data_imports/services/workbook.py`
- Modify: `backend/apps/data_imports/services/tabular.py`
- Create: `backend/apps/participants/migrations/0003_competitionenrollment_source_sheet_name.py`

- [ ] Add `source_sheet_name` to `CompetitionEnrollment`.
- [ ] Populate it during mapped workbook imports.
- [ ] Keep legacy imports working by leaving the field blank when the source has no workbook sheet context.

### Task 2: Gate delivery and sheet write-back correctly

**Files:**
- Modify: `backend/apps/certificates/services/delivery.py`
- Modify: `backend/apps/certificates/services/exporting.py`
- Modify: `backend/apps/certificates/serializers.py`

- [ ] Restrict delivery/export candidates to approved matches only.
- [ ] Resolve the target worksheet from `source_sheet_name`, with a legacy fallback to the competition default worksheet.
- [ ] Fail a page write when the Drive link is missing instead of marking it updated.

## Chunk 2: Tests And UI Alignment

### Task 3: Add regression coverage

**Files:**
- Modify: `backend/apps/certificates/tests.py`
- Modify: `backend/apps/data_imports/tests.py`

- [ ] Cover import persistence of `source_sheet_name`.
- [ ] Cover multi-sheet write-back targeting the correct worksheet.
- [ ] Cover approval-gated export/delivery behavior and missing Drive link failures.

### Task 4: Align UI copy with stricter delivery rules

**Files:**
- Modify: `frontend/src/app/pages/DriveSync.tsx`

- [ ] Update operator messaging so the page explains that only approved matches with Drive links are eligible for write-back/export.

## Chunk 3: Verification

### Task 5: Verify the hardened flow

**Files:**
- Modify: none

- [ ] Run Django migrations.
- [ ] Run targeted backend tests for `apps.data_imports` and `apps.certificates`.
- [ ] Run the frontend production build.
