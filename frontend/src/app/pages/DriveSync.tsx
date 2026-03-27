import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Eye } from "lucide-react";

import { api } from "../../lib/api";
import type { CertificatePage, SourcePdfBatch } from "../../lib/types";
import { ExportBuilderDialog } from "../components/certificates/ExportBuilderDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
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
  const { selectedCompetitionId } = useAppData();
  const [batches, setBatches] = useState<SourcePdfBatch[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [pages, setPages] = useState<CertificatePage[]>([]);
  const [exportBuilderOpen, setExportBuilderOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        <p className="text-gray-600 mt-1">Download an Excel file containing only approved certificate rows, public certificate links, merged workbook columns, and system columns you choose in the export builder.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.total}</div><p className="mt-1 text-sm text-gray-600">Pages in view</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.approved}</div><p className="mt-1 text-sm text-gray-600">Approved pages</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.publicLinks}</div><p className="mt-1 text-sm text-gray-600">Public links ready</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.exportReady}</div><p className="mt-1 text-sm text-gray-600">Ready for export</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Controls</CardTitle>
          <CardDescription>Select one or more uploaded PDF files, then click Prepare Excel Export to choose source columns from the merged workbook data plus system columns.</CardDescription>
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
                    return (
                      <label
                        key={batch.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleBatch(batch.id, Boolean(checked))}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{batch.original_filename}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {batch.page_total} pages | {batch.status} | {new Date(batch.created_at).toLocaleString()}
                          </p>
                        </div>
                      </label>
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
            </div>
          ) : null}

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </CardContent>
      </Card>

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
