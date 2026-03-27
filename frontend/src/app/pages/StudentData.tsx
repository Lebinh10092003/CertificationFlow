import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { StudentImportPanel } from "../components/student/StudentImportPanel";
import { DeleteImportJobDialog } from "../components/student/DeleteImportJobDialog";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { useAppData } from "../contexts/AppDataContext";
import { api } from "../../lib/api";
import type { ImportJob, StudentRow } from "../../lib/types";

export function StudentData() {
  const { selectedCompetitionId } = useAppData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAward, setFilterAward] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!selectedCompetitionId) {
      setStudents([]);
      setJobs([]);
      return;
    }

    setLoading(true);
    try {
      const [studentRows, importJobs] = await Promise.all([
        api.fetchStudents({
          competition: selectedCompetitionId,
          search: searchTerm || undefined,
          award: filterAward === "all" ? undefined : filterAward,
          status: filterStatus === "all" ? undefined : filterStatus,
        }),
        api.fetchImportJobs(selectedCompetitionId),
      ]);
      setStudents(studentRows);
      setJobs(importJobs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedCompetitionId, searchTerm, filterAward, filterStatus]);

  const awards = useMemo(() => {
    const values = new Set<string>();
    students.forEach((student) =>
      student.results.forEach((result) => {
        if (result.award) {
          values.add(result.award);
        }
      }),
    );
    return Array.from(values);
  }, [students]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Student Data</h1>
        <p className="mt-1 text-gray-600">Database-backed participants and results</p>
      </div>

      <StudentImportPanel
        selectedCompetitionId={selectedCompetitionId}
        onImported={loadData}
        showStudentDataLink={false}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, email, or certificate code..."
                className="pl-10"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="w-48 rounded-md border px-3 py-2 text-sm"
              value={filterAward}
              onChange={(event) => setFilterAward(event.target.value)}
            >
              <option value="all">All Awards</option>
              {awards.map((award) => (
                <option key={award} value={award}>
                  {award}
                </option>
              ))}
            </select>
            <select
              className="w-48 rounded-md border px-3 py-2 text-sm"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="updated">Uploaded / Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">{students.length}</div>
            <p className="mt-1 text-sm text-gray-600">Rows in database</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {students.filter((student) => !student.participant.email).length}
            </div>
            <p className="mt-1 text-sm text-gray-600">Missing Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {students.filter((student) => !student.certificate_url).length}
            </div>
            <p className="mt-1 text-sm text-gray-600">Missing Certificate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">{jobs.length}</div>
            <p className="mt-1 text-sm text-gray-600">Import Jobs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Activity</CardTitle>
          <CardDescription>Real import jobs stored in the database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No imports yet.</p>
          ) : (
            jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-gray-900">{job.source_filename || job.source_type}</p>
                  <p className="text-xs text-gray-500">
                    Job #{job.id} | {job.status} | {job.row_count} rows
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{new Date(job.created_at).toLocaleString()}</Badge>
                  <DeleteImportJobDialog job={job} onDeleted={loadData} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>{loading ? "Loading..." : `Showing ${students.length} database rows`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Cert Code</TableHead>
                  <TableHead>Mail Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                      {selectedCompetitionId ? "No rows imported yet." : "Select or create a competition first."}
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const primaryResult = student.results[0];
                    return (
                      <TableRow
                        key={student.id}
                        className={!student.participant.email || !student.certificate_url ? "bg-yellow-50" : ""}
                      >
                        <TableCell className="font-medium">{student.source_row_number ?? "-"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {student.participant.external_student_id || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{student.participant.full_name}</TableCell>
                        <TableCell>
                          {student.participant.email || (
                            <Badge variant="destructive" className="text-xs">
                              Missing
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{student.participant.school_name || "-"}</TableCell>
                        <TableCell>{student.participant.grade || "-"}</TableCell>
                        <TableCell>{primaryResult?.award || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{primaryResult?.certificate_code || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.mail_status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
