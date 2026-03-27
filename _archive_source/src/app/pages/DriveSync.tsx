import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Cloud,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  FolderOpen,
} from "lucide-react";

const driveActivity = [
  {
    studentName: "Nguyễn Văn An",
    certCode: "MATH-G-001",
    fileName: "Nguyen_Van_An_Gold_Medal_Mathematics.pdf",
    driveStatus: "uploaded",
    driveUrl: "https://drive.google.com/file/d/abc123",
    sheetRow: 2,
    sheetStatus: "updated",
    lastAttempt: "2 hours ago",
    error: null,
  },
  {
    studentName: "Trần Thị Bình",
    certCode: "MATH-S-002",
    fileName: "Tran_Thi_Binh_Silver_Medal_Mathematics.pdf",
    driveStatus: "uploaded",
    driveUrl: "https://drive.google.com/file/d/abc124",
    sheetRow: 3,
    sheetStatus: "updated",
    lastAttempt: "2 hours ago",
    error: null,
  },
  {
    studentName: "Lê Minh Châu",
    certCode: "MATH-B-003",
    fileName: "Le_Minh_Chau_Bronze_Medal_Mathematics.pdf",
    driveStatus: "pending",
    driveUrl: null,
    sheetRow: 4,
    sheetStatus: "pending",
    lastAttempt: "1 hour ago",
    error: null,
  },
  {
    studentName: "Phạm Quốc Duy",
    certCode: "MATH-C-004",
    fileName: "Pham_Quoc_Duy_Consolation_Prize_Mathematics.pdf",
    driveStatus: "failed",
    driveUrl: null,
    sheetRow: 5,
    sheetStatus: "failed",
    lastAttempt: "30 minutes ago",
    error: "Permission denied",
  },
  {
    studentName: "Hoàng Thanh Hà",
    certCode: "MATH-G-005",
    fileName: "Hoang_Thanh_Ha_Gold_Medal_Mathematics.pdf",
    driveStatus: "uploaded",
    driveUrl: "https://drive.google.com/file/d/abc126",
    sheetRow: 6,
    sheetStatus: "updated",
    lastAttempt: "2 hours ago",
    error: null,
  },
];

export function DriveSync() {
  const stats = {
    uploaded: driveActivity.filter((a) => a.driveStatus === "uploaded").length,
    pending: driveActivity.filter((a) => a.driveStatus === "pending").length,
    failed: driveActivity.filter((a) => a.driveStatus === "failed").length,
    sheetUpdated: driveActivity.filter((a) => a.sheetStatus === "updated").length,
    sheetFailed: driveActivity.filter((a) => a.sheetStatus === "failed").length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Drive Sync</h1>
          <p className="text-gray-600 mt-1">
            Manage certificate uploads and sheet updates
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Open Drive Folder
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reconnect
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.uploaded}
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploaded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.pending}
                </div>
                <p className="text-sm text-gray-600 mt-1">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.failed}
                </div>
                <p className="text-sm text-gray-600 mt-1">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.sheetUpdated}
                </div>
                <p className="text-sm text-gray-600 mt-1">Sheet Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.sheetFailed}
                </div>
                <p className="text-sm text-gray-600 mt-1">Update Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Mapping</CardTitle>
          <CardDescription>
            Configure how to match certificates with sheet rows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Google Sheet ID</Label>
                <Input
                  defaultValue="1abc...xyz789"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Worksheet Name</Label>
                <Input defaultValue="Students" />
              </div>
              <div className="space-y-2">
                <Label>Matching Field</Label>
                <Select defaultValue="certcode">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certcode">Certificate Code</SelectItem>
                    <SelectItem value="studentid">Student ID</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="composite">
                      Name + Award + Subject
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Student Name Column</Label>
                  <Input defaultValue="B" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Email Column</Label>
                  <Input defaultValue="C" className="uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Award Column</Label>
                  <Input defaultValue="G" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Cert Code Column</Label>
                  <Input defaultValue="H" className="uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>File URL Column</Label>
                  <Input defaultValue="I" className="uppercase" />
                </div>
                <div className="space-y-2">
                  <Label>Mail Status Column</Label>
                  <Input defaultValue="J" className="uppercase" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline">Test Mapping</Button>
            <Button>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sync Activity</CardTitle>
              <CardDescription>Upload and sheet update history</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Retry Failed Uploads
              </Button>
              <Button variant="outline" size="sm">
                Retry Sheet Updates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Cert Code</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Drive Status</TableHead>
                  <TableHead>Sheet Row</TableHead>
                  <TableHead>Sheet Status</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driveActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {activity.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {activity.certCode}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {activity.fileName}
                    </TableCell>
                    <TableCell>
                      {activity.driveStatus === "uploaded" && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {activity.driveStatus === "pending" && (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {activity.driveStatus === "failed" && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      Row {activity.sheetRow}
                    </TableCell>
                    <TableCell>
                      {activity.sheetStatus === "updated" && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Updated
                        </Badge>
                      )}
                      {activity.sheetStatus === "pending" && (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {activity.sheetStatus === "failed" && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {activity.lastAttempt}
                      {activity.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {activity.error}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {activity.driveUrl && (
                          <Button variant="ghost" size="icon" title="Copy URL">
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        {activity.driveUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Open in Drive"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {activity.driveStatus === "failed" && (
                          <Button variant="ghost" size="icon" title="Retry">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
