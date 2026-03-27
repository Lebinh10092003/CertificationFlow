import type {
  AuthSession,
  AuditLog,
  CertificatePage,
  Competition,
  BulkReviewResponse,
  DashboardSummary,
  ExportColumnInspection,
  ExportColumnOption,
  ImportExecutionPayload,
  ImportInspection,
  ImportJob,
  PublicCertificate,
  SourcePdfBatch,
  StudentRow,
} from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function prepareRequestInit(init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken && !headers.has("X-CSRFToken")) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }
  return {
    ...init,
    headers,
    credentials: "include" as const,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, prepareRequestInit(init));
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    if (isJson) {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail || message;
    } else {
      const text = await response.text();
      message = text || message;
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  if (isJson) {
    return response.json() as Promise<T>;
  }
  return (await response.text()) as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function parseFilename(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const simpleMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }
  return fallback;
}

function submitDownload(path: string, payload?: Record<string, unknown>) {
  const iframeName = `download-frame-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  if (!payload) {
    iframe.src = `${API_BASE_URL}${path}`;
    window.setTimeout(() => iframe.remove(), 60_000);
    return Promise.resolve();
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${API_BASE_URL}${path}`;
  form.target = iframeName;
  form.style.display = "none";

  const csrfToken = getCsrfToken();
  if (csrfToken) {
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfmiddlewaretoken";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);
  }

  const payloadInput = document.createElement("input");
  payloadInput.type = "hidden";
  payloadInput.name = "payload_json";
  payloadInput.value = JSON.stringify(payload);
  form.appendChild(payloadInput);

  document.body.appendChild(form);
  form.submit();
  form.remove();
  window.setTimeout(() => iframe.remove(), 60_000);
  return Promise.resolve();
}

async function download(path: string, fallbackFilename: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { detail?: string };
      throw new Error(payload.detail || `Request failed: ${response.status}`);
    }
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = parseFilename(response.headers.get("content-disposition"), fallbackFilename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const api = {
  fetchSession: () => request<AuthSession>("/auth/session/"),
  login: (username: string, password: string) =>
    request<AuthSession>("/auth/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request<AuthSession>("/auth/logout/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
  fetchCompetitions: () => request<Competition[]>("/competitions/"),
  createCompetition: (payload: Partial<Competition>) =>
    request<Competition>("/competitions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateCompetition: (id: number, payload: Partial<Competition>) =>
    request<Competition>(`/competitions/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  fetchDashboard: (competitionId?: number) =>
    request<DashboardSummary>(`/dashboard/${competitionId ? `?competition=${competitionId}` : ""}`),
  fetchStudents: (params: Record<string, string | number | undefined>) =>
    request<StudentRow[]>(`/students/${buildQuery(params)}`),
  fetchImportJobs: (competitionId?: number) =>
    request<ImportJob[]>(`/import-jobs/${competitionId ? `?competition=${competitionId}` : ""}`),
  deleteImportJob: (jobId: number) =>
    request<void>(`/import-jobs/${jobId}/`, { method: "DELETE" }),
  inspectImportFile: async (competitionId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ImportInspection>(`/competitions/${competitionId}/import-file/inspect/`, {
      method: "POST",
      body: formData,
    });
  },
  executeImportFile: (competitionId: number, payload: ImportExecutionPayload) =>
    request<ImportJob>(`/competitions/${competitionId}/import-file/execute/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  fetchBatches: (competitionId?: number) =>
    request<SourcePdfBatch[]>(`/certificate-batches/${competitionId ? `?competition=${competitionId}` : ""}`),
  uploadBatch: async (file: File, processingMode: string, competitionId?: number | null) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("processing_mode", processingMode);
    if (competitionId) {
      formData.append("competition_id", String(competitionId));
    }
    return request<SourcePdfBatch>("/certificate-batches/", { method: "POST", body: formData });
  },
  confirmBatchCompetition: (batchId: number, competitionId: number, confirmedCompetitionName: string) =>
    request<SourcePdfBatch>(`/certificate-batches/${batchId}/confirm-competition/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competition_id: competitionId,
        confirmed_competition_name: confirmedCompetitionName,
      }),
    }),
  processBatch: (batchId: number) =>
    request<SourcePdfBatch>(`/certificate-batches/${batchId}/process/`, { method: "POST" }),
  deleteBatch: (batchId: number) =>
    request<void>(`/certificate-batches/${batchId}/`, { method: "DELETE" }),
  fetchExportColumns: (batchId: number) =>
    request<ExportColumnInspection>(`/certificate-batches/${batchId}/export-columns/`),
  fetchCompetitionExportColumns: (competitionId: number, batchIds: number[]) =>
    request<ExportColumnInspection>(
      `/competitions/${competitionId}/certificate-export-columns/${buildQuery({
        batch_ids: batchIds.join(","),
      })}`,
    ),
  exportBatch: (batchId: number) =>
    submitDownload(`/certificate-batches/${batchId}/export/`),
  exportConfiguredBatch: (
    batchId: number,
    payload: { columns: ExportColumnOption[]; sheet_mode: string; format_mode: string },
  ) =>
    submitDownload(`/certificate-batches/${batchId}/export/`, payload),
  exportConfiguredCompetitionBatches: (
    competitionId: number,
    payload: { batch_ids: number[]; columns: ExportColumnOption[]; sheet_mode: string; format_mode: string },
  ) =>
    submitDownload(`/competitions/${competitionId}/certificate-export/`, payload),
  fetchPages: (competitionId?: number, batchId?: number, batchIds?: number[]) =>
    request<CertificatePage[]>(`/certificate-pages/${buildQuery({
      competition: competitionId,
      batch: batchId,
      batch_ids: batchIds?.join(","),
    })}`),
  updatePage: (pageId: number, payload: Record<string, unknown>) =>
    request<CertificatePage>(`/certificate-pages/${pageId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  fetchMatches: (competitionId?: number, confidence?: string) =>
    request(`/certificate-matches/${buildQuery({ competition: competitionId, confidence })}`),
  approveMatch: (matchId: number) =>
    request(`/certificate-matches/${matchId}/approve/`, { method: "POST" }),
  bulkReviewMatches: (payload: { match_ids: number[]; approved: boolean }) =>
    request<BulkReviewResponse>("/certificate-matches/bulk-review/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  fetchPublicCertificate: (slug: string) =>
    request<PublicCertificate>(`/public-certificates/${slug}/`),
  fetchLogs: (competitionId?: number) =>
    request<AuditLog[]>(`/logs/${competitionId ? `?competition=${competitionId}` : ""}`),
};
