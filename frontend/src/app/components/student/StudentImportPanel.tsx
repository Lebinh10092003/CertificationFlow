import { useEffect, useId, useState, type ChangeEvent } from "react";
import { Link } from "react-router";
import { Database, FileSpreadsheet, Upload } from "lucide-react";

import { api } from "../../../lib/api";
import type { ImportInspection, ImportJob } from "../../../lib/types";
import { DeleteImportJobDialog } from "./DeleteImportJobDialog";
import { ImportMappingWizard } from "./ImportMappingWizard";
import { Button, buttonVariants } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../ui/utils";

type StudentImportPanelProps = {
  selectedCompetitionId: number | null;
  onImported?: () => Promise<void> | void;
  showStudentDataLink?: boolean;
};

export function StudentImportPanel({ selectedCompetitionId, onImported, showStudentDataLink = true }: StudentImportPanelProps) {
  const fileInputId = useId();
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [inspection, setInspection] = useState<ImportInspection | null>(null);

  const loadSummary = async () => {
    if (!selectedCompetitionId) {
      setJobs([]);
      setStudentCount(0);
      return;
    }

    const [importJobs, students] = await Promise.all([
      api.fetchImportJobs(selectedCompetitionId),
      api.fetchStudents({ competition: selectedCompetitionId }),
    ]);
    setJobs(importJobs);
    setStudentCount(students.length);
  };

  useEffect(() => {
    void loadSummary();
  }, [selectedCompetitionId]);

  const runAfterImport = async () => {
    const followUp = onImported ? Promise.resolve(onImported()) : Promise.resolve();
    await Promise.all([loadSummary(), followUp]);
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCompetitionId) {
      return;
    }

    setErrorMessage("");
    setUploading(true);
    try {
      const inspectionResult = await api.inspectImportFile(selectedCompetitionId, file);
      setInspection(inspectionResult);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const latestJob = jobs[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Sheet</CardTitle>
        <CardDescription>Import Excel or CSV, choose the source sheets you want, and map columns before running certificate matching.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Database className="h-4 w-4" />
                Imported rows
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{studentCount}</div>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileSpreadsheet className="h-4 w-4" />
                Import jobs
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{jobs.length}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <input
              id={fileInputId}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={handleImportFile}
            />
            {uploading ? (
              <Button variant="outline" className="gap-2" type="button" disabled>
                <Upload className="h-4 w-4" />
                Uploading...
              </Button>
            ) : (
              <label
                htmlFor={fileInputId}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "cursor-pointer gap-2",
                  !selectedCompetitionId && "pointer-events-none opacity-50",
                )}
                aria-disabled={!selectedCompetitionId}
              >
                <Upload className="h-4 w-4" />
                Upload Sheet
              </label>
            )}
            {showStudentDataLink ? (
              <Button asChild variant="ghost">
                <Link to="/students">Open Student Data</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {!selectedCompetitionId ? (
          <p className="text-sm text-amber-700">Select a competition first so imported rows are attached to the correct competition.</p>
        ) : null}

        {latestJob ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-3 text-sm text-slate-700">
              Latest import: <span className="font-medium text-slate-900">{latestJob.source_filename || latestJob.source_type}</span>
              {" | "}
              {latestJob.status}
              {" | "}
              {latestJob.row_count} rows
            </div>
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">Recent import jobs</p>
                <p className="text-xs text-slate-500">Delete only the old import job you want to remove.</p>
              </div>
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {job.source_filename || job.source_type}
                    </p>
                    <p className="text-xs text-slate-500">
                      Job #{job.id} | {job.status} | {job.row_count} rows |{" "}
                      {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                  <DeleteImportJobDialog job={job} onDeleted={runAfterImport} />
                </div>
              ))}
            </div>
          </div>
        ) : selectedCompetitionId ? (
          <div className="rounded-lg border border-dashed p-3 text-sm text-slate-600">
            No student sheet has been imported for this competition yet.
          </div>
        ) : null}

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {inspection && selectedCompetitionId ? (
          <ImportMappingWizard
            inspection={inspection}
            selectedCompetitionId={selectedCompetitionId}
            onCancel={() => setInspection(null)}
            onCompleted={async () => {
              setInspection(null);
              await runAfterImport();
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
