import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  FileText,
  Cloud,
  Mail,
  Sheet,
} from "lucide-react";

const processingLogs = [
  {
    timestamp: "2026-03-26 14:32:15",
    action: "Split PDF",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "156 pages split successfully",
  },
  {
    timestamp: "2026-03-26 14:32:45",
    action: "Extract data",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "Certificate data extracted",
  },
  {
    timestamp: "2026-03-26 14:33:02",
    action: "Match student",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "Matched with high confidence",
  },
];

const uploadLogs = [
  {
    timestamp: "2026-03-26 14:35:12",
    action: "Upload to Drive",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "File uploaded successfully",
  },
  {
    timestamp: "2026-03-26 14:35:23",
    action: "Upload to Drive",
    studentName: "Trần Thị Bình",
    certCode: "MATH-S-002",
    result: "success",
    details: "File uploaded successfully",
  },
  {
    timestamp: "2026-03-26 14:35:45",
    action: "Upload to Drive",
    studentName: "Phạm Quốc Duy",
    certCode: "MATH-C-004",
    result: "failed",
    details: "Permission denied: Check folder access",
  },
];

const sheetLogs = [
  {
    timestamp: "2026-03-26 14:36:05",
    action: "Update Sheet row 2",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "File URL written to column I",
  },
  {
    timestamp: "2026-03-26 14:36:12",
    action: "Update Sheet row 3",
    studentName: "Trần Thị Bình",
    certCode: "MATH-S-002",
    result: "success",
    details: "File URL written to column I",
  },
];

const emailLogs = [
  {
    timestamp: "2026-03-26 14:45:23",
    action: "Send email",
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    result: "success",
    details: "Email sent to nva@school.edu",
  },
  {
    timestamp: "2026-03-26 14:45:28",
    action: "Send email",
    studentName: "Trần Thị Bình",
    certCode: "MATH-S-002",
    result: "success",
    details: "Email sent to ttb@school.edu",
  },
  {
    timestamp: "2026-03-26 14:45:35",
    action: "Send email",
    studentName: "Lê Minh Châu",
    certCode: "MATH-B-003",
    result: "failed",
    details: "No email address on file",
  },
];

const errorLogs = [
  {
    timestamp: "2026-03-26 14:35:45",
    action: "Upload to Drive",
    studentName: "Phạm Quốc Duy",
    certCode: "MATH-C-004",
    result: "failed",
    details: "Permission denied: Check folder access",
  },
  {
    timestamp: "2026-03-26 14:45:35",
    action: "Send email",
    studentName: "Lê Minh Châu",
    certCode: "MATH-B-003",
    result: "failed",
    details: "No email address on file",
  },
];

function LogTable({ logs }: { logs: typeof processingLogs }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Cert Code</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono text-xs text-gray-600">
                {log.timestamp}
              </TableCell>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell>{log.studentName}</TableCell>
              <TableCell className="font-mono text-xs">
                {log.certCode}
              </TableCell>
              <TableCell>
                {log.result === "success" ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Success
                  </Badge>
                ) : log.result === "failed" ? (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Failed
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-600">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Warning
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {log.details}
              </TableCell>
              <TableCell className="text-right">
                {log.result === "failed" && (
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function Logs() {
  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Logs</h1>
          <p className="text-gray-600 mt-1">
            Track all automation activities
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search logs..." className="pl-10 w-64" />
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">156</div>
                <p className="text-sm text-gray-600">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">732</div>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">2</div>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">5</div>
                <p className="text-sm text-gray-600">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Detailed audit trail of all operations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="processing">
            <TabsList>
              <TabsTrigger value="processing">
                <FileText className="w-4 h-4 mr-2" />
                Processing Logs
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Cloud className="w-4 h-4 mr-2" />
                Upload Logs
              </TabsTrigger>
              <TabsTrigger value="sheet">
                <Sheet className="w-4 h-4 mr-2" />
                Sheet Update Logs
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                Email Logs
              </TabsTrigger>
              <TabsTrigger value="errors">
                <XCircle className="w-4 h-4 mr-2" />
                Errors Only
              </TabsTrigger>
            </TabsList>

            <TabsContent value="processing" className="mt-6">
              <LogTable logs={processingLogs} />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <LogTable logs={uploadLogs} />
            </TabsContent>

            <TabsContent value="sheet" className="mt-6">
              <LogTable logs={sheetLogs} />
            </TabsContent>

            <TabsContent value="email" className="mt-6">
              <LogTable logs={emailLogs} />
            </TabsContent>

            <TabsContent value="errors" className="mt-6">
              <LogTable logs={errorLogs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Audit Timeline for Single Student */}
      <Card>
        <CardHeader>
          <CardTitle>Student Processing Timeline</CardTitle>
          <CardDescription>
            Complete audit trail for Nguyễn Văn An (MATH-G-001)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pb-8">
                <p className="font-medium text-gray-900">Certificate Matched</p>
                <p className="text-sm text-gray-600">
                  Matched with high confidence to student record
                </p>
                <p className="text-xs text-gray-500 mt-1">2026-03-26 14:33:02</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pb-8">
                <p className="font-medium text-gray-900">Uploaded to Drive</p>
                <p className="text-sm text-gray-600">
                  File uploaded successfully to Google Drive
                </p>
                <p className="text-xs text-gray-500 mt-1">2026-03-26 14:35:12</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Sheet className="w-5 h-5 text-green-600" />
                </div>
                <div className="w-0.5 h-16 bg-gray-200"></div>
              </div>
              <div className="flex-1 pb-8">
                <p className="font-medium text-gray-900">Sheet Updated</p>
                <p className="text-sm text-gray-600">
                  File URL written to Google Sheets row 2
                </p>
                <p className="text-xs text-gray-500 mt-1">2026-03-26 14:36:05</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Email Sent</p>
                <p className="text-sm text-gray-600">
                  Certificate email sent to nva@school.edu
                </p>
                <p className="text-xs text-gray-500 mt-1">2026-03-26 14:45:23</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
