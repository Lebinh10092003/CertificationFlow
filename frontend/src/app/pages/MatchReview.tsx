import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, XCircle } from "lucide-react";

import { api } from "../../lib/api";
import type { CertificatePage, SourcePdfBatch } from "../../lib/types";
import { BatchFilter } from "../components/certificates/BatchFilter";
import { StudentImportPanel } from "../components/student/StudentImportPanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAppData } from "../contexts/AppDataContext";

export function MatchReview() {
  const { selectedCompetitionId } = useAppData();
  const [pages, setPages] = useState<CertificatePage[]>([]);
  const [batches, setBatches] = useState<SourcePdfBatch[]>([]);
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadBatches = async () => {
    if (!selectedCompetitionId) {
      setBatches([]);
      setSelectedBatchId(null);
      return;
    }
    const items = await api.fetchBatches(selectedCompetitionId);
    setBatches(items);
    setSelectedBatchId((current) => (current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null));
  };

  const loadPages = async (batchId: number | null) => {
    if (!selectedCompetitionId) {
      setPages([]);
      return;
    }
    const items = await api.fetchPages(selectedCompetitionId, batchId ?? undefined);
    setPages(items.filter((page) => page.match));
  };

  useEffect(() => {
    void loadBatches();
  }, [selectedCompetitionId]);

  useEffect(() => {
    void loadPages(selectedBatchId);
    setSelectedMatches([]);
    setMessage("");
    setErrorMessage("");
  }, [selectedCompetitionId, selectedBatchId]);

  const filteredPages = useMemo(
    () =>
      pages.filter((page) => {
        const confidencePass = filterConfidence === "all" ? true : page.match?.confidence_label === filterConfidence;
        const approvalPass =
          filterApproval === "all"
            ? true
            : filterApproval === "approved"
              ? !!page.match?.is_approved
              : !page.match?.is_approved;
        return confidencePass && approvalPass;
      }),
    [filterApproval, filterConfidence, pages],
  );

  const selectedFilteredPages = useMemo(
    () => filteredPages.filter((page) => selectedMatches.includes(page.id)),
    [filteredPages, selectedMatches],
  );

  const stats = {
    total: pages.length,
    matched: pages.filter((page) => page.match?.confidence_label === "high").length,
    unmatched: pages.filter((page) => !page.match?.competition_enrollment).length,
    warnings: pages.filter((page) => page.review_status === "needs_review").length,
    approved: pages.filter((page) => page.match?.is_approved).length,
    publicLinks: pages.filter((page) => !!page.public_url).length,
  };

  const updateApproval = async (pageIds: number[], approved: boolean) => {
    const matchIds = pageIds
      .map((pageId) => pages.find((item) => item.id === pageId)?.match?.id)
      .filter((matchId): matchId is number => typeof matchId === "number");

    if (!matchIds.length) {
      return;
    }

    setErrorMessage("");
    setMessage("");
    try {
      await api.bulkReviewMatches({
        match_ids: matchIds,
        approved,
      });
      setSelectedMatches([]);
      await loadPages(selectedBatchId);
      setMessage(
        approved
          ? `Approved ${matchIds.length} certificate match${matchIds.length === 1 ? "" : "es"}.`
          : `Marked ${matchIds.length} certificate match${matchIds.length === 1 ? "" : "es"} for review.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Review update failed");
    }
  };

  const selectAllVisible = () => {
    setSelectedMatches(filteredPages.filter((page) => page.match?.id).map((page) => page.id));
  };

  const clearSelection = () => {
    setSelectedMatches([]);
  };

  const applyFirstSelectedStatus = async () => {
    if (selectedFilteredPages.length < 2) {
      return;
    }
    const sourcePage = selectedFilteredPages[0];
    await updateApproval(selectedFilteredPages.map((page) => page.id), !!sourcePage.match?.is_approved);
  };

  const activeBatch = batches.find((batch) => batch.id === selectedBatchId) ?? null;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Match & Review</h1>
        <p className="text-gray-600 mt-1">Review extracted certificate data, merge it with imported rows, and approve the pages that should be exported.</p>
      </div>

      <StudentImportPanel selectedCompetitionId={selectedCompetitionId} onImported={() => loadPages(selectedBatchId)} />

      <div className="grid grid-cols-6 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.total}</div><p className="mt-1 text-sm text-gray-600">Total in batch</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-green-600">{stats.matched}</div><p className="mt-1 text-sm text-gray-600">High confidence</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-red-600">{stats.unmatched}</div><p className="mt-1 text-sm text-gray-600">Unmatched</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-yellow-600">{stats.warnings}</div><p className="mt-1 text-sm text-gray-600">Needs review</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-blue-600">{stats.approved}</div><p className="mt-1 text-sm text-gray-600">Approved for export</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-violet-600">{stats.publicLinks}</div><p className="mt-1 text-sm text-gray-600">Public link ready</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[minmax(0,1fr)_200px_200px] md:items-end">
          <BatchFilter
            batches={batches}
            selectedBatchId={selectedBatchId}
            onChange={setSelectedBatchId}
            label="Uploaded file"
            allLabel="All files in selected competition"
            disabled={!selectedCompetitionId}
          />

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Confidence</span>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filterConfidence}
              onChange={(event) => setFilterConfidence(event.target.value)}
            >
              <option value="all">All matches</option>
              <option value="high">High confidence</option>
              <option value="medium">Medium confidence</option>
              <option value="low">Low confidence</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-700">
            <span className="font-medium">Approval</span>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={filterApproval}
              onChange={(event) => setFilterApproval(event.target.value)}
            >
              <option value="all">All rows</option>
              <option value="approved">Approved only</option>
              <option value="pending">Needs approval</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
            <div className="text-sm text-gray-600">{selectedMatches.length} selected</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible} disabled={!filteredPages.length}>
                Select all visible
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={!selectedMatches.length}>
                Clear selection
              </Button>
              <Button variant="outline" size="sm" onClick={() => void updateApproval(selectedMatches, true)} disabled={!selectedMatches.length}>
                Approve selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => void updateApproval(selectedMatches, false)} disabled={!selectedMatches.length}>
                Unapprove selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => void applyFirstSelectedStatus()} disabled={selectedFilteredPages.length < 2}>
                Apply first row status
              </Button>
            </div>
          </div>

          {activeBatch ? (
            <p className="text-sm text-slate-600 md:col-span-3">
              Reviewing <span className="font-medium text-slate-900">{activeBatch.original_filename}</span>
            </p>
          ) : null}
          {message ? <p className="text-sm text-green-700 md:col-span-3">{message}</p> : null}
          {errorMessage ? <p className="text-sm text-red-600 md:col-span-3">{errorMessage}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Matching</CardTitle>
          <CardDescription>Every row here comes from CertificatePage, CertificateExtraction, and CertificateMatch for the selected batch filter.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">Preview</TableHead>
                  <TableHead>Extracted Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Cert Code</TableHead>
                  <TableHead>Matched Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-gray-500">
                      {selectedCompetitionId ? "No match records for the current filter." : "Select a competition first."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMatches.includes(page.id)}
                          disabled={!page.match?.id}
                          onCheckedChange={(checked) =>
                            setSelectedMatches((current) =>
                              checked
                                ? current.includes(page.id)
                                  ? current
                                  : [...current, page.id]
                                : current.filter((item) => item !== page.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {page.preview_image_url && page.split_pdf_url ? (
                          <a href={page.split_pdf_url} target="_blank" rel="noreferrer" title={`Open page ${page.page_number} PDF`}>
                            <img src={page.preview_image_url} alt={`page ${page.page_number}`} className="h-12 w-10 rounded border object-cover transition hover:scale-[1.02] hover:border-slate-400" />
                          </a>
                        ) : page.preview_image_url ? (
                          <img src={page.preview_image_url} alt={`page ${page.page_number}`} className="h-12 w-10 rounded border object-cover" />
                        ) : (
                          <div className="h-12 w-10 rounded border bg-gray-100" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{page.extraction?.student_name || "-"}</TableCell>
                      <TableCell>{page.extraction?.grade || "-"}</TableCell>
                      <TableCell>{page.extraction?.award || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{page.extraction?.certificate_code || "-"}</TableCell>
                      <TableCell>{page.match?.matched_student_name || <span className="text-red-600">No match</span>}</TableCell>
                      <TableCell>{page.match?.matched_email || "-"}</TableCell>
                      <TableCell>
                        {page.match?.is_approved ? (
                          <Badge className="bg-emerald-600">Approved</Badge>
                        ) : (
                          <Badge variant="outline">Needs approval</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {page.match?.confidence_label === "high" ? (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            High
                          </Badge>
                        ) : page.match?.confidence_label === "medium" ? (
                          <Badge className="bg-yellow-600">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Medium
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {page.match?.id ? (
                            <Button
                              variant={page.match.is_approved ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => void updateApproval([page.id], !page.match?.is_approved)}
                            >
                              {page.match.is_approved ? "Unapprove" : "Approve"}
                            </Button>
                          ) : null}
                          {page.split_pdf_url ? (
                            <Button asChild variant="ghost" size="sm">
                              <a href={page.split_pdf_url} target="_blank" rel="noreferrer" title={`Open page ${page.page_number} PDF`}>
                                <Eye className="h-4 w-4" />
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
