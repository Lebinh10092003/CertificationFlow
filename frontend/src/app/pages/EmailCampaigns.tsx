import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import type { StudentRow } from "../../lib/types";

export function EmailCampaigns() {
  const { selectedCompetition, selectedCompetitionId } = useAppData();
  const [students, setStudents] = useState<StudentRow[]>([]);

  useEffect(() => {
    if (!selectedCompetitionId) {
      setStudents([]);
      return;
    }
    api.fetchStudents({ competition: selectedCompetitionId }).then(setStudents);
  }, [selectedCompetitionId]);

  const stats = useMemo(
    () => ({
      total: students.length,
      ready: students.filter((row) => row.participant.email && row.certificate_url).length,
      missingCert: students.filter((row) => !row.certificate_url).length,
      missingEmail: students.filter((row) => !row.participant.email).length,
      sent: students.filter((row) => row.mail_status === "updated").length,
      failed: students.filter((row) => row.mail_status === "failed").length,
    }),
    [students],
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Email Campaigns</h1>
        <p className="text-gray-600 mt-1">Recipient readiness is database-backed. Final send execution is reserved for the delivery phase.</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-gray-900">{stats.total}</div><p className="text-sm text-gray-600 mt-1">Total Recipients</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-blue-600">{stats.ready}</div><p className="text-sm text-gray-600 mt-1">Ready</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-yellow-600">{stats.missingCert}</div><p className="text-sm text-gray-600 mt-1">Missing Certificate</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-red-600">{stats.missingEmail}</div><p className="text-sm text-gray-600 mt-1">Missing Email</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-green-600">{stats.sent}</div><p className="text-sm text-gray-600 mt-1">Sent</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-semibold text-red-600">{stats.failed}</div><p className="text-sm text-gray-600 mt-1">Failed</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>Loaded from the selected competition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><p className="text-sm text-gray-600">Subject</p><p className="font-medium">{selectedCompetition?.email_template_subject || "-"}</p></div>
          <div><p className="text-sm text-gray-600">Body</p><p className="whitespace-pre-wrap text-sm">{selectedCompetition?.email_template_body || "-"}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>Rows become email-ready only when both email and certificate link exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No student rows available.</TableCell></TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.participant.full_name}</TableCell>
                      <TableCell>{student.participant.email || <Badge variant="destructive">Missing</Badge>}</TableCell>
                      <TableCell>{student.results[0]?.award || "-"}</TableCell>
                      <TableCell>{student.certificate_url ? <Badge variant="outline">Ready</Badge> : <Badge variant="destructive">Missing</Badge>}</TableCell>
                      <TableCell><Badge variant="outline">{student.mail_status}</Badge></TableCell>
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
