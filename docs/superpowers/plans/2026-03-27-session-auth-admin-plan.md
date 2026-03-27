# Session Auth Admin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Protect the admin website and private APIs with Django session authentication while keeping public certificate pages and direct PDF URLs open.

**Architecture:** Use Django session auth for all private API endpoints via DRF defaults, with explicit `AllowAny` on public endpoints. Add thin auth APIs for `session/login/logout`, then guard the SPA admin routes with a frontend auth context and login page while keeping `/c/:slug` public.

**Tech Stack:** Django, Django auth/session middleware, Django REST framework, React, React Router, Vite, TypeScript

---

## Chunk 1: Backend Auth Surface

### Task 1: Add DRF session auth defaults with explicit public exceptions

**Files:**
- Create: `backend/config/authentication.py`
- Modify: `backend/config/settings.py`
- Modify: `backend/config/urls.py`
- Modify: `backend/apps/certificates/views.py`
- Test: `backend/apps/competitions/tests.py`

- [ ] Write failing tests for private API auth and public endpoint access
- [ ] Add a session auth class that returns `401` for missing auth instead of ambiguous `403`
- [ ] Set DRF defaults to private-by-default
- [ ] Mark `health`, `public certificate`, and `certificate PDF` endpoints as public
- [ ] Run backend auth tests

### Task 2: Add login/session/logout APIs

**Files:**
- Create: `backend/config/auth_views.py`
- Modify: `backend/config/urls.py`
- Test: `backend/apps/competitions/tests.py`

- [ ] Write failing tests for `session`, `login`, and `logout`
- [ ] Implement `GET /api/auth/session/` with CSRF cookie support
- [ ] Implement `POST /api/auth/login/`
- [ ] Implement `POST /api/auth/logout/`
- [ ] Run backend auth tests

## Chunk 2: Frontend Session Guard

### Task 3: Add auth client/types/context

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`
- Create: `frontend/src/app/contexts/AuthContext.tsx`

- [ ] Add user/session types
- [ ] Add `credentials: include`, CSRF header support, and auth API helpers
- [ ] Add auth context for session bootstrap, login, logout, and unauthorized reset
- [ ] Run frontend build

### Task 4: Guard admin routes and add login page

**Files:**
- Create: `frontend/src/app/pages/Login.tsx`
- Create: `frontend/src/app/components/auth/ProtectedApp.tsx`
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/src/app/routes.ts`
- Modify: `frontend/src/app/components/layout/RootLayout.tsx`

- [ ] Add `/login`
- [ ] Wrap admin routes in a protected component
- [ ] Move `AppDataProvider` inside the protected admin shell
- [ ] Show real Django username and logout action in the layout
- [ ] Run frontend build

## Chunk 3: Regression Coverage And Rollout

### Task 5: Update API tests that now require auth

**Files:**
- Modify: `backend/apps/certificates/tests.py`
- Modify: `backend/apps/data_imports/tests.py`

- [ ] Authenticate test API clients for private endpoints
- [ ] Keep public endpoint tests anonymous
- [ ] Run targeted backend test suites

### Task 6: Verify locally and prepare VPS rollout

**Files:**
- None

- [ ] Run `..\\.venv\\Scripts\\python.exe manage.py test apps.competitions apps.data_imports apps.certificates`
- [ ] Run `npm run build`
- [ ] Commit changes
- [ ] Deploy to VPS and create/update Django user `Admin`
