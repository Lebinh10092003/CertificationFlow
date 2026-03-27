# Core Data And Certificate Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Django-backed, database-driven certificate pipeline with the provided React frontend, replacing mock data with real APIs and implementing import, PDF split, extraction, OCR fallback, and initial match review.

**Architecture:** Use a monorepo with `backend/` for Django and `frontend/` for the provided React UI. The backend owns all persistent state and long-running processing. The frontend becomes an API client with no hardcoded runtime records.

**Tech Stack:** Django, Django REST Framework, Celery, Redis, PostgreSQL-ready settings, React/Vite, TypeScript, PyMuPDF, pytesseract, pandas, openpyxl, rapidfuzz

---

## Chunk 1: Repository Foundation

### Task 1: Create monorepo structure and backend dependencies

**Files:**
- Create: `backend/`
- Create: `backend/requirements.txt`
- Create: `backend/manage.py`
- Create: `backend/config/*.py`
- Modify: `frontend/package.json`

- [ ] **Step 1: Create backend project scaffold**
- [ ] **Step 2: Add Python dependencies for API, background jobs, import, PDF, and OCR**
- [ ] **Step 3: Copy the provided frontend bundle into `frontend/`**
- [ ] **Step 4: Add React runtime dependencies missing from the exported bundle**
- [ ] **Step 5: Verify Python and Node manifests are valid**

### Task 2: Configure environment-driven settings

**Files:**
- Create: `backend/.env.example`
- Modify: `backend/config/settings.py`
- Create: `backend/config/celery.py`
- Create: `backend/config/urls.py`

- [ ] **Step 1: Add database, media, CORS, and REST settings**
- [ ] **Step 2: Add Celery configuration**
- [ ] **Step 3: Add health and API routes**
- [ ] **Step 4: Run Django system checks**

## Chunk 2: Data Model And API

### Task 3: Build core apps and models

**Files:**
- Create: `backend/apps/competitions/models.py`
- Create: `backend/apps/imports/models.py`
- Create: `backend/apps/certificates/models.py`
- Create: `backend/apps/logs/models.py`
- Create: `backend/apps/*/admin.py`

- [ ] **Step 1: Create Django apps**
- [ ] **Step 2: Implement models from the approved design**
- [ ] **Step 3: Register admin views**
- [ ] **Step 4: Create and apply migrations**
- [ ] **Step 5: Verify schema loads in Django**

### Task 4: Build serializers, queries, and REST endpoints

**Files:**
- Create: `backend/apps/*/serializers.py`
- Create: `backend/apps/*/views.py`
- Create: `backend/apps/*/urls.py`
- Create: `backend/apps/api/*.py`

- [ ] **Step 1: Add list/detail serializers for competitions, students, batches, pages, matches, logs, and settings**
- [ ] **Step 2: Add query services for dashboard and review summaries**
- [ ] **Step 3: Add upload and confirmation endpoints**
- [ ] **Step 4: Add settings and log endpoints**
- [ ] **Step 5: Verify API URL resolution**

## Chunk 3: Import And Processing Services

### Task 5: Implement import and sync services

**Files:**
- Create: `backend/apps/imports/services/*.py`
- Create: `backend/apps/imports/tasks.py`
- Create: `backend/apps/imports/tests/*.py`

- [ ] **Step 1: Add CSV/XLSX parsing and row normalization**
- [ ] **Step 2: Add Google Sheets fetch service**
- [ ] **Step 3: Persist imports into participant, enrollment, and result tables**
- [ ] **Step 4: Add job logging and status transitions**
- [ ] **Step 5: Verify import tests**

### Task 6: Implement PDF split, extraction, OCR, and matching

**Files:**
- Create: `backend/apps/certificates/services/*.py`
- Create: `backend/apps/certificates/tasks.py`
- Create: `backend/apps/certificates/tests/*.py`

- [ ] **Step 1: Add source PDF save and page counting**
- [ ] **Step 2: Add competition inference service**
- [ ] **Step 3: Add page splitting and preview generation**
- [ ] **Step 4: Add text extraction and OCR fallback**
- [ ] **Step 5: Add metadata parsing and initial matching**
- [ ] **Step 6: Verify service tests**

## Chunk 4: Frontend Integration

### Task 7: Restructure the provided UI into a real frontend app

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`
- Modify: `frontend/src/app/components/layout/RootLayout.tsx`
- Modify: `frontend/src/app/pages/*.tsx`

- [ ] **Step 1: Replace hardcoded dashboard, competition, student, batch, match, log, and settings data with API requests**
- [ ] **Step 2: Add upload form and competition confirmation flow**
- [ ] **Step 3: Render real empty states when the database has no records**
- [ ] **Step 4: Keep Drive and Email pages API-backed even if they only surface readiness data in this slice**
- [ ] **Step 5: Verify frontend build**

### Task 8: Add integration documentation and developer workflow

**Files:**
- Create: `README.md`
- Create: `docker-compose.yml`
- Create: `backend/pytest.ini`

- [ ] **Step 1: Document local setup for backend, frontend, PostgreSQL, and Redis**
- [ ] **Step 2: Add a compose stack for PostgreSQL and Redis**
- [ ] **Step 3: Add backend test configuration**
- [ ] **Step 4: Verify documented commands are aligned with the repo**

