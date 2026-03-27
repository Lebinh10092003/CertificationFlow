import type {
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const payload = (await response.json()) as { detail?: string };
      throw new Error(payload.detail || `Request failed: ${response.status}`);
    }
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
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
    download(`/certificate-batches/${batchId}/export/`, `batch_${batchId}_delivery.xlsx`),
  exportConfiguredBatch: (
    batchId: number,
    payload: { columns: ExportColumnOption[]; sheet_mode: string; format_mode: string },
  ) =>
    download(`/certificate-batches/${batchId}/export/`, `batch_${batchId}_delivery.xlsx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  exportConfiguredCompetitionBatches: (
    competitionId: number,
    payload: { batch_ids: number[]; columns: ExportColumnOption[]; sheet_mode: string; format_mode: string },
  ) =>
    download(`/competitions/${competitionId}/certificate-export/`, `competition_${competitionId}_certificates.xlsx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
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
