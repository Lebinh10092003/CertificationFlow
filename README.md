# CertificationFlow

Monorepo for a certificate processing system with:

- `backend/`: Django + DRF + Celery + PDF/OCR pipeline
- `frontend/`: React/Vite operator console based on the provided UI bundle

## What Works

- Competition records stored in the database
- Excel/CSV import into the database
- Google Sheets sync scaffolding using service-account credentials stored per competition
- Source PDF upload
- Competition-name inference from PDF
- User confirmation of inferred competition
- One-page-per-certificate PDF splitting
- Direct text extraction with OCR fallback code path
- Initial certificate-to-student matching
- Real API-backed dashboard, competition, student, certificate, review, logs, drive-status, email-readiness, and settings screens

## Project Layout

```text
backend/   Django backend
frontend/  React frontend
docs/      Design spec and implementation plan
media/     Uploaded files and generated certificate pages
```

## Backend Setup

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
.\.venv\Scripts\python backend\manage.py migrate
.\.venv\Scripts\python backend\manage.py runserver
```

Default local mode uses SQLite and eager Celery execution so the API works without Redis.

## Frontend Setup

```powershell
Copy-Item frontend\.env.example frontend\.env
cd frontend
npm install
npm run dev
```

The default API base URL is `http://localhost:8000/api`.

## Optional PostgreSQL + Redis

```powershell
docker compose up -d postgres redis
```

Then set `DATABASE_URL`, `CELERY_BROKER_URL`, and `CELERY_RESULT_BACKEND` in `backend/.env`.

## Verification

```powershell
.\.venv\Scripts\python backend\manage.py check
.\.venv\Scripts\python backend\manage.py test apps.data_imports apps.certificates
cd frontend
npm run build
```
