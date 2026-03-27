import { useEffect, useId, useState, type ChangeEvent } from "react";
import { CheckCircle2, Clock, FileText, Upload } from "lucide-react";

import { api } from "../../lib/api";
import type { SourcePdfBatch } from "../../lib/types";
import { BatchFilter } from "../components/certificates/BatchFilter";
import { DeleteBatchDialog } from "../components/certificates/DeleteBatchDialog";
import { StudentImportPanel } from "../components/student/StudentImportPanel";
import { Badge } from "../components/ui/badge";
import { Button, buttonVariants } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { cn } from "../components/ui/utils";
import { useAppData } from "../contexts/AppDataContext";

export function CertificateProcessing() {
  const fileInputId = useId();
  const { selectedCompetitionId } = useAppData();
  const [batches, setBatches] = useState<SourcePdfBatch[]>([]);
  const [processingMode, setProcessingMode] = useState("split_extract_match");
  const [confirmedNames, setConfirmedNames] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBatches = async () => {
    const items = await api.fetchBatches(selectedCompetitionId ?? undefined);
    setBatches(items);
    setSelectedBatchId((current) => (current && items.some((item) => item.id === current) ? current : null));
  };

  useEffect(() => {
    void loadBatches();
  }, [selectedCompetitionId]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    setErrorMessage("");
    try {
      await api.uploadBatch(file, processingMode, selectedCompetitionId);
      await loadBatches();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleConfirm = async (batch: SourcePdfBatch) => {
    if (!selectedCompetitionId) {
      return;
    }
    setErrorMessage("");
    try {
      const confirmedName = confirmedNames[batch.id] || batch.inferred_competition_name;
      await api.confirmBatchCompetition(batch.id, selectedCompetitionId, confirmedName);
      await loadBatches();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Competition confirmation failed");
    }
  };

  const handleProcess = async (batchId: number) => {
    setErrorMessage("");
    try {
      await api.processBatch(batchId);
      await loadBatches();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Batch processing failed");
    }
  };

  const visibleBatches = selectedBatchId ? batches.filter((batch) => batch.id === selectedBatchId) : batches;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Certificate Processing</h1>
        <p className="text-gray-600 mt-1">Upload source PDFs, confirm the competition, then split and extract them into batch records.</p>
      </div>

      <StudentImportPanel selectedCompetitionId={selectedCompetitionId} />

      <Card>
        <CardHeader>
          <CardTitle>Upload Certificates</CardTitle>
          <CardDescription>Each uploaded PDF becomes one Django batch. Confirm the inferred competition before processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-10 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">Upload one source PDF</h3>
            <p className="mb-4 text-sm text-gray-600">The system will split one page into one certificate record.</p>
            <div className="flex items-center justify-center gap-3">
              <select
                className="rounded-md border px-3 py-2 text-sm"
                value={processingMode}
                onChange={(event) => setProcessingMode(event.target.value)}
              >
                <option value="split_only">Split Only</option>
                <option value="split_extract">Split + Extract</option>
                <option value="split_extract_match">Split + Extract + Match</option>
                <option value="full_pipeline">Full Pipeline</option>
              </select>
              <input
                id={fileInputId}
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={handleUpload}
              />
              {uploading ? (
                <Button type="button" disabled>
                  Uploading...
                </Button>
              ) : (
                <label
                  htmlFor={fileInputId}
                  className={cn(buttonVariants({ variant: "default" }), "cursor-pointer")}
                >
                  Select PDF File
                </label>
              )}
            </div>
          </div>

          {!selectedCompetitionId ? (
            <p className="text-sm text-amber-700">Select or create a competition first so the inferred batch can be confirmed against a real database record.</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>Real batch records stored by Django. Delete only removes batch-local certificate processing files and records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BatchFilter
            batches={batches}
            selectedBatchId={selectedBatchId}
            onChange={setSelectedBatchId}
            label="Filter uploaded file"
          />

          {batches.length === 0 ? (
            <p className="text-sm text-gray-500">No PDF batches uploaded yet.</p>
          ) : (
            visibleBatches.map((batch) => (
              <div key={batch.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{batch.original_filename}</p>
                      <p className="text-sm text-gray-600">
                        {batch.page_count} pages | inferred competition: {batch.inferred_competition_name || "Unknown"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Uploaded {new Date(batch.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.status === "completed" ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        {batch.status}
                      </Badge>
                    )}
                  </div>
                </div>

                {batch.status === "awaiting_confirmation" ? (
                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <Input
                      value={confirmedNames[batch.id] ?? batch.inferred_competition_name}
                      onChange={(event) =>
                        setConfirmedNames((current) => ({ ...current, [batch.id]: event.target.value }))
                      }
                      placeholder="Confirmed competition name"
                    />
                    <Button onClick={() => void handleConfirm(batch)} disabled={!selectedCompetitionId}>
                      Confirm Competition
                    </Button>
                    <DeleteBatchDialog batch={batch} onDeleted={loadBatches} />
                  </div>
                ) : null}

                {batch.status === "ready" ? (
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => void handleProcess(batch.id)}>Process Certificates</Button>
                    <DeleteBatchDialog batch={batch} onDeleted={loadBatches} />
                  </div>
                ) : null}

                {!["awaiting_confirmation", "ready"].includes(batch.status) ? (
                  <div className="flex justify-end">
                    <DeleteBatchDialog batch={batch} onDeleted={loadBatches} />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
