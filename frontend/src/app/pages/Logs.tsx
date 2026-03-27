import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { useAppData } from "../contexts/AppDataContext";
import { api } from "../../lib/api";
import type { AuditLog } from "../../lib/types";

export function Logs() {
  const { selectedCompetitionId } = useAppData();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.fetchLogs(selectedCompetitionId ?? undefined).then(setLogs);
  }, [selectedCompetitionId]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Logs</h1>
        <p className="text-gray-600 mt-1">Operational audit trail written by Django background jobs and APIs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Real records from the `AuditLog` table</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No logs yet.</TableCell></TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-gray-600">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell><Badge variant="outline">{log.status}</Badge></TableCell>
                      <TableCell>{log.object_type} #{log.object_id}</TableCell>
                      <TableCell className="text-sm text-gray-600">{log.message}</TableCell>
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
