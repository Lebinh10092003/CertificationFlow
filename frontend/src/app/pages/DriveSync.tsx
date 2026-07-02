import { useEffect, useMemo, useState } from "react";
import { CloudUpload, Download, ExternalLink, Eye, FolderOpen, Save } from "lucide-react";

import { api } from "../../lib/api";
import type { CertificatePage, SourcePdfBatch } from "../../lib/types";
import { ExportBuilderDialog } from "../components/certificates/ExportBuilderDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAppData } from "../contexts/AppDataContext";

export function ExportCertificates() {
  const { selectedCompetitionId, competitions } = useAppData();
  const [batches, setBatches] = useState<SourcePdfBatch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [pages, setPages] = useState<CertificatePage[]>([]);
  const [exportBuilderOpen, setExportBuilderOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Drive folder state
  const selectedCompetition = useMemo(
    () => competitions?.find((c) => c.id === selectedCompetitionId) ?? null,
    [competitions, selectedCompetitionId],
  );
  const [driveFolderUrl, setDriveFolderUrl] = useState("");
  const [driveFolderSaving, setDriveFolderSaving] = useState(false);
  const [driveFolderSaved, setDriveFolderSaved] = useState(false);

  // Per-batch upload state
  const [uploadingBatchIds, setUploadingBatchIds] = useState<Set<number>>(new Set());
  const [uploadResults, setUploadResults] = useState<Record<number, { processed: number; failed: number; total: number }>>({});

  // Sync drive folder URL from competition config when competition changes
  useEffect(() => {
    setDriveFolderUrl(selectedCompetition?.integration_config?.drive_folder_url ?? "");
    setDriveFolderSaved(false);
    setUploadResults({});
  }, [selectedCompetition]);

  const loadBatches = async () => {
    if (!selectedCompetitionId) {
      setBatches([]);
      setSelectedBatchIds([]);
      return;
    }
    const items = await api.fetchBatches(selectedCompetitionId);
    setBatches(items);
    setSelectedBatchIds((current) => {
      const remaining = current.filter((batchId) => items.some((item) => item.id === batchId));
      return remaining.length ? remaining : items.map((item) => item.id);
    });
  };

  const loadPages = async (batchIds: number[]) => {
    if (!selectedCompetitionId) {
      setPages([]);
      return;
    }
    const items = await api.fetchPages(selectedCompetitionId, undefined, batchIds);
    setPages(items);
  };

  useEffect(() => {
    void loadBatches();
  }, [selectedCompetitionId]);

  useEffect(() => {
    void loadPages(selectedBatchIds);
    setMessage("");
    setErrorMessage("");
  }, [selectedCompetitionId, selectedBatchIds]);

  const selectedBatches = useMemo(
    () => batches.filter((batch) => selectedBatchIds.includes(batch.id)),
    [batches, selectedBatchIds],
  );
  const canExport = selectedBatchIds.length > 0;

  const stats = useMemo(
    () => ({
      total: pages.length,
      approved: pages.filter((page) => page.match?.is_approved).length,
      driveUploaded: pages.filter((page) => !!page.drive_file_url).length,
      missingDriveLink: pages.filter((page) => page.match?.is_approved && !page.drive_file_url).length,
      publicLinks: pages.filter((page) => !!page.public_url).length,
      exportReady: pages.filter((page) => page.export_ready).length,
      needsApproval: pages.filter((page) => page.review_status !== "approved").length,
    }),
    [pages],
  );

  const toggleBatch = (batchId: number, checked: boolean) => {
    setSelectedBatchIds((current) =>
      checked
        ? current.includes(batchId)
          ? current
          : [...current, batchId]
        : current.filter((item) => item !== batchId),
    );
  };

  const batchSummaryLabel = useMemo(() => {
    if (!selectedBatches.length) {
      return "";
    }
    if (selectedBatches.length === 1) {
      return selectedBatches[0].original_filename;
    }
    return `${selectedBatches.length} uploaded files`;
  }, [selectedBatches]);

  const handleSaveDriveFolder = async () => {
    if (!selectedCompetitionId || !driveFolderUrl.trim()) return;
    setDriveFolderSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await api.saveDriveFolder(selectedCompetitionId, driveFolderUrl.trim());
      setDriveFolderSaved(true);
      setMessage("Drive folder saved successfully.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save Drive folder.");
    } finally {
      setDriveFolderSaving(false);
    }
  };

  const handleUploadBatchToDrive = async (batchId: number) => {
    setUploadingBatchIds((prev) => new Set([...prev, batchId]));
    setMessage("");
    setErrorMessage("");
    try {
      const result = await api.uploadBatchToDrive(batchId);
      setUploadResults((prev) => ({
        ...prev,
        [batchId]: {
          processed: result.processed_pages,
          failed: result.failed_pages,
          total: result.total_pages,
        },
      }));
      if (result.failed_pages === 0) {
        setMessage(`Upload complete: ${result.processed_pages}/${result.total_pages} certificates uploaded to Drive.`);
      } else {
        setErrorMessage(
          `Upload partial: ${result.processed_pages} uploaded, ${result.failed_pages} failed out of ${result.total_pages} total.`,
        );
      }
      // Reload pages to reflect drive_file_url updates
      await loadPages(selectedBatchIds);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Drive upload failed.");
    } finally {
      setUploadingBatchIds((prev) => {
        const next = new Set(prev);
        next.delete(batchId);
        return next;
      });
    }
  };

  const hasDriveFolderConfigured = !!(
    driveFolderSaved ||
    selectedCompetition?.integration_config?.drive_folder_id
  );

  return (
    <div className="p-8 space-y-6">
      <ExportBuilderDialog
        open={exportBuilderOpen}
        competitionId={selectedCompetitionId}
        batchIds={selectedBatchIds}
        batchName={batchSummaryLabel}
        onOpenChange={setExportBuilderOpen}
      />

      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Export Certificates</h1>
        <p className="text-gray-600 mt-1">
          Upload approved certificates to Google Drive, then export an Excel file with Drive links for each student.
          Excel will use Drive links for delivered certificates.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.total}</div><p className="mt-1 text-sm text-gray-600">Pages in view</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.approved}</div><p className="mt-1 text-sm text-gray-600">Approved pages</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-emerald-600">{stats.driveUploaded}</div><p className="mt-1 text-sm text-gray-600">Uploaded to Drive</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className={`text-2xl font-semibold ${stats.missingDriveLink > 0 ? "text-amber-600" : "text-gray-900"}`}>{stats.missingDriveLink}</div><p className="mt-1 text-sm text-gray-600">Missing Drive link</p></CardContent></Card>
      </div>

      {/* Drive Folder Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Google Drive Folder
          </CardTitle>
          <CardDescription>
            Paste the Google Drive folder URL where approved certificates will be uploaded.
            The folder must be shared with the backend service account as Editor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="drive-folder-url">Drive Folder URL</Label>
              <Input
                id="drive-folder-url"
                placeholder="https://drive.google.com/drive/folders/your-folder-id"
                value={driveFolderUrl}
                onChange={(e) => {
                  setDriveFolderUrl(e.target.value);
                  setDriveFolderSaved(false);
                }}
                disabled={!selectedCompetitionId}
              />
            </div>
            <Button
              id="save-drive-folder-btn"
              onClick={handleSaveDriveFolder}
              disabled={!selectedCompetitionId || !driveFolderUrl.trim() || driveFolderSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {driveFolderSaving ? "Saving…" : "Save Folder"}
            </Button>
          </div>

          {selectedCompetition?.integration_config?.drive_folder_id && (
            <p className="text-xs text-slate-500">
              Currently configured folder ID:{" "}
              <code className="bg-slate-100 px-1 rounded">{selectedCompetition.integration_config.drive_folder_id}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Batch Selection + Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Export Controls</CardTitle>
          <CardDescription>
            Select uploaded PDF files, upload approved certificates to Drive, then prepare the Excel export.
            Excel will use Drive links for delivered certificates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Uploaded files</p>
                <p className="text-xs text-slate-600">Choose the PDF batches to include in this export.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!batches.length}
                  onClick={() => setSelectedBatchIds(batches.map((batch) => batch.id))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedBatchIds.length}
                  onClick={() => setSelectedBatchIds([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <ScrollArea className="h-[220px] rounded-lg border">
              <div className="space-y-2 p-3 pr-4">
                {batches.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {selectedCompetitionId ? "No uploaded files for this competition yet." : "Select a competition first."}
                  </p>
                ) : (
                  batches.map((batch) => {
                    const isSelected = selectedBatchIds.includes(batch.id);
                    const uploadResult = uploadResults[batch.id];
                    const isUploading = uploadingBatchIds.has(batch.id);
                    return (
                      <div
                        key={batch.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleBatch(batch.id, Boolean(checked))}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">{batch.original_filename}</p>
                            <p className="mt-1 text-xs text-slate-600">
                              {batch.page_count} pages | {batch.status} | {new Date(batch.created_at).toLocaleString()}
                            </p>
                            {uploadResult && (
                              <p className="mt-1 text-xs text-emerald-700">
                                Drive: {uploadResult.processed}/{uploadResult.total} uploaded
                                {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
                              </p>
                            )}
                          </div>
                        </label>
                        <Button
                          id={`upload-drive-batch-${batch.id}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 shrink-0"
                          disabled={!hasDriveFolderConfigured || isUploading}
                          onClick={() => handleUploadBatchToDrive(batch.id)}
                          title={hasDriveFolderConfigured ? "Upload approved certificates to Drive" : "Save a Drive folder first"}
                        >
                          <CloudUpload className="h-4 w-4" />
                          {isUploading ? "Uploading…" : "Upload to Drive"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2" onClick={() => setExportBuilderOpen(true)} disabled={!canExport || stats.exportReady === 0}>
              <Download className="h-4 w-4" />
              Prepare Excel Export
            </Button>
          </div>

          {!canExport ? (
            <p className="text-sm text-amber-700">Select at least one uploaded file before exporting.</p>
          ) : selectedBatches.length ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                Selected files: <span className="font-medium text-slate-900">{selectedBatches.length}</span>
              </p>
              <p>
                {stats.needsApproval} page(s) still need approval before they can be exported.
              </p>
              {stats.missingDriveLink > 0 && (
                <p className="text-amber-700">
                  {stats.missingDriveLink} approved page(s) have not been uploaded to Drive yet.
                  Upload them above to include Drive links in the export.
                </p>
              )}
            </div>
          ) : null}

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      {/* Export Readiness Table */}
      <Card>
        <CardHeader>
          <CardTitle>Export Readiness</CardTitle>
          <CardDescription>Each row reflects the actual page state stored in Django for the uploaded files currently selected above.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Export</TableHead>
                  <TableHead>Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      {selectedCompetitionId ? "No certificate pages for the current filter." : "Select a competition first."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>{page.page_number}</TableCell>
                      <TableCell className="font-medium">{page.match?.matched_student_name || page.extraction?.student_name || "-"}</TableCell>
                      <TableCell>{page.extraction?.grade || "-"}</TableCell>
                      <TableCell>{page.extraction?.subject || "-"}</TableCell>
                      <TableCell>
                        {page.review_status === "approved" ? (
                          <Badge className="bg-emerald-600">Approved</Badge>
                        ) : page.review_status === "needs_review" ? (
                          <Badge variant="outline">Needs review</Badge>
                        ) : (
                          <Badge variant="outline">Unmatched</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {page.export_ready ? (
                          <Badge className="bg-green-600">Ready</Badge>
                        ) : (
                          <Badge variant="outline">Blocked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {page.drive_file_url ? (
                            <Button asChild variant="ghost" size="sm" className="gap-1">
                              <a href={page.drive_file_url} target="_blank" rel="noreferrer">
                                <CloudUpload className="h-4 w-4" />
                                Drive
                              </a>
                            </Button>
                          ) : null}
                          {page.public_url ? (
                            <Button asChild variant="ghost" size="sm" className="gap-1">
                              <a href={page.public_url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Public
                              </a>
                            </Button>
                          ) : null}
                          {page.split_pdf_url ? (
                            <Button asChild variant="ghost" size="sm" className="gap-1">
                              <a href={page.split_pdf_url} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4" />
                                PDF
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
