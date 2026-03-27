# Delivery Guard And UX Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend and UI guards so import jobs cannot be replayed accidentally and batch delivery clearly shows why pages are blocked.

**Architecture:** Harden the backend first by enforcing import job state and rejecting exports with no approved pages. Then expose page-level delivery eligibility data from the serializer so the existing `DriveSync` screen can disable actions and explain blockers without duplicating backend rules.

**Tech Stack:** Django, Django REST Framework, React, TypeScript

---

## Chunk 1: Backend Guards

### Task 1: Enforce one-time execution for inspected import jobs

**Files:**
- Modify: `backend/apps/data_imports/views.py`
- Test: `backend/apps/data_imports/tests.py`

- [ ] Reject `import-file/execute` requests unless the job is still in `inspected` state.
- [ ] Add regression coverage for rerunning a completed import job.

### Task 2: Reject exports that have no approved pages

**Files:**
- Modify: `backend/apps/certificates/views.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Return a clear `400` when export is requested for a batch with zero approved pages.
- [ ] Cover the rejection in API tests.

## Chunk 2: Delivery Eligibility Surface

### Task 3: Expose page-level blockers from the serializer

**Files:**
- Modify: `backend/apps/certificates/serializers.py`
- Test: `backend/apps/certificates/tests.py`

- [ ] Add resolved sheet target info and blocker labels to `CertificatePageSerializer`.
- [ ] Base the blocker list on approval status, Drive link presence, and sheet row/worksheet availability.

### Task 4: Update DriveSync to use backend eligibility data

**Files:**
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/app/pages/DriveSync.tsx`

- [ ] Show batch-level counts for Drive-ready, Sheet-ready, and Export-ready pages.
- [ ] Disable action buttons when the current batch has zero eligible pages for that action.
- [ ] Render per-page blocker badges/messages in the table.

## Chunk 3: Verification

### Task 5: Verify the improved guard flow

**Files:**
- Modify: none

- [ ] Run backend tests for `apps.data_imports` and `apps.certificates`.
- [ ] Run the frontend production build.
