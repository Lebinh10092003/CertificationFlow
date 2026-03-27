import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
import { RefreshCw, Download, Search, Filter } from "lucide-react";

const mockStudents = [
  {
    id: "ST001",
    name: "Nguyễn Văn An",
    email: "nva@school.edu",
    school: "THPT Lê Hồng Phong",
    grade: "12",
    subject: "Mathematics",
    award: "Gold Medal",
    certCode: "MATH-G-001",
    certUrl: "https://drive.google.com/file/d/abc123",
    mailStatus: "sent",
  },
  {
    id: "ST002",
    name: "Trần Thị Bình",
    email: "ttb@school.edu",
    school: "THPT Trần Hưng Đạo",
    grade: "11",
    subject: "Mathematics",
    award: "Silver Medal",
    certCode: "MATH-S-002",
    certUrl: "https://drive.google.com/file/d/abc124",
    mailStatus: "sent",
  },
  {
    id: "ST003",
    name: "Lê Minh Châu",
    email: "",
    school: "THPT Nguyễn Huệ",
    grade: "12",
    subject: "Mathematics",
    award: "Bronze Medal",
    certCode: "MATH-B-003",
    certUrl: "https://drive.google.com/file/d/abc125",
    mailStatus: "pending",
  },
  {
    id: "ST004",
    name: "Phạm Quốc Duy",
    email: "pqd@school.edu",
    school: "THPT Lê Quý Đôn",
    grade: "10",
    subject: "Mathematics",
    award: "Consolation Prize",
    certCode: "MATH-C-004",
    certUrl: "",
    mailStatus: "failed",
  },
  {
    id: "ST005",
    name: "Hoàng Thanh Hà",
    email: "hth@school.edu",
    school: "THPT Chu Văn An",
    grade: "12",
    subject: "Mathematics",
    award: "Gold Medal",
    certCode: "MATH-G-005",
    certUrl: "https://drive.google.com/file/d/abc126",
    mailStatus: "sent",
  },
  {
    id: "ST006",
    name: "Đỗ Văn Khoa",
    email: "dvk@school.edu",
    school: "THPT Lê Lợi",
    grade: "11",
    subject: "Mathematics",
    award: "Silver Medal",
    certCode: "MATH-S-006",
    certUrl: "https://drive.google.com/file/d/abc127",
    mailStatus: "sent",
  },
  {
    id: "ST007",
    name: "Vũ Thị Lan",
    email: "vtl@school.edu",
    school: "THPT Trần Phú",
    grade: "12",
    subject: "Mathematics",
    award: "Bronze Medal",
    certCode: "MATH-B-007",
    certUrl: "https://drive.google.com/file/d/abc128",
    mailStatus: "sent",
  },
  {
    id: "ST008",
    name: "Bùi Quang Minh",
    email: "",
    school: "THPT Ngô Quyền",
    grade: "10",
    subject: "Mathematics",
    award: "Consolation Prize",
    certCode: "MATH-C-008",
    certUrl: "https://drive.google.com/file/d/abc129",
    mailStatus: "pending",
  },
];

export function StudentData() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAward, setFilterAward] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.certCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAward = filterAward === "all" || student.award === filterAward;
    const matchesStatus =
      filterStatus === "all" || student.mailStatus === filterStatus;
    return matchesSearch && matchesAward && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Student Data</h1>
          <p className="text-gray-600 mt-1">
            {mockStudents.length} students registered
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync from Sheets
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or certificate code..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterAward} onValueChange={setFilterAward}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by award" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Awards</SelectItem>
                <SelectItem value="Gold Medal">Gold Medal</SelectItem>
                <SelectItem value="Silver Medal">Silver Medal</SelectItem>
                <SelectItem value="Bronze Medal">Bronze Medal</SelectItem>
                <SelectItem value="Consolation Prize">Consolation Prize</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Email Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {mockStudents.filter((s) => s.mailStatus === "sent").length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Emails Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {mockStudents.filter((s) => !s.email).length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Missing Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {mockStudents.filter((s) => !s.certUrl).length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Missing Certificate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {mockStudents.filter((s) => s.mailStatus === "failed").length}
            </div>
            <p className="text-sm text-gray-600 mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {mockStudents.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.id}
                    className={
                      !student.email || !student.certUrl ? "bg-yellow-50" : ""
                    }
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {student.id}
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      {student.email ? (
                        <span className="text-sm">{student.email}</span>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{student.school}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.award === "Gold Medal"
                            ? "default"
                            : student.award === "Silver Medal"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          student.award === "Gold Medal"
                            ? "bg-yellow-500"
                            : student.award === "Silver Medal"
                            ? "bg-gray-400"
                            : student.award === "Bronze Medal"
                            ? "bg-orange-600"
                            : ""
                        }
                      >
                        {student.award}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {student.certCode}
                    </TableCell>
                    <TableCell>
                      {student.mailStatus === "sent" && (
                        <Badge variant="default" className="bg-green-600">
                          Sent
                        </Badge>
                      )}
                      {student.mailStatus === "pending" && (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {student.mailStatus === "failed" && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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
