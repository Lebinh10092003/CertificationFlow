import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Cloud,
  Sheet,
  Eye,
} from "lucide-react";

const mockMatches = [
  {
    id: 1,
    extractedName: "Nguyễn Văn An",
    extractedAward: "Gold Medal",
    extractedSubject: "Mathematics",
    extractedCode: "MATH-G-001",
    matchedName: "Nguyễn Văn An",
    matchedEmail: "nva@school.edu",
    matchedId: "ST001",
    confidence: "high",
    driveStatus: "uploaded",
    sheetStatus: "updated",
    reviewed: true,
  },
  {
    id: 2,
    extractedName: "Trần Thị Bình",
    extractedAward: "Silver Medal",
    extractedSubject: "Mathematics",
    extractedCode: "MATH-S-002",
    matchedName: "Trần Thị Bình",
    matchedEmail: "ttb@school.edu",
    matchedId: "ST002",
    confidence: "high",
    driveStatus: "uploaded",
    sheetStatus: "updated",
    reviewed: true,
  },
  {
    id: 3,
    extractedName: "Lê Minh Châu",
    extractedAward: "Bronze Medal",
    extractedSubject: "Mathematics",
    extractedCode: "MATH-B-003",
    matchedName: "Lê Minh Chau",
    matchedEmail: "",
    matchedId: "ST003",
    confidence: "medium",
    driveStatus: "pending",
    sheetStatus: "pending",
    reviewed: false,
  },
  {
    id: 4,
    extractedName: "Phạm Quốc Duy",
    extractedAward: "Consolation Prize",
    extractedSubject: "Mathematics",
    extractedCode: "MATH-C-004",
    matchedName: "",
    matchedEmail: "",
    matchedId: "",
    confidence: "low",
    driveStatus: "pending",
    sheetStatus: "pending",
    reviewed: false,
  },
  {
    id: 5,
    extractedName: "Hoàng Thanh Hà",
    extractedAward: "Gold Medal",
    extractedSubject: "Mathematics",
    extractedCode: "MATH-G-005",
    matchedName: "Hoàng Thanh Hà",
    matchedEmail: "hth@school.edu",
    matchedId: "ST005",
    confidence: "high",
    driveStatus: "uploaded",
    sheetStatus: "updated",
    reviewed: true,
  },
];

export function MatchReview() {
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [filterConfidence, setFilterConfidence] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const filteredMatches = mockMatches.filter((match) =>
    filterConfidence === "all" ? true : match.confidence === filterConfidence
  );

  const stats = {
    total: mockMatches.length,
    matched: mockMatches.filter((m) => m.confidence === "high").length,
    unmatched: mockMatches.filter((m) => !m.matchedId).length,
    warnings: mockMatches.filter(
      (m) => m.confidence === "medium" || m.confidence === "low"
    ).length,
    readyUpload: mockMatches.filter((m) => m.driveStatus === "pending").length,
    readyEmail: mockMatches.filter(
      (m) => m.driveStatus === "uploaded" && m.matchedEmail
    ).length,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Match & Review</h1>
        <p className="text-gray-600 mt-1">
          Confirm certificate to student mapping
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {stats.total}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-green-600">
              {stats.matched}
            </div>
            <p className="text-sm text-gray-600 mt-1">Matched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-red-600">
              {stats.unmatched}
            </div>
            <p className="text-sm text-gray-600 mt-1">Unmatched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-yellow-600">
              {stats.warnings}
            </div>
            <p className="text-sm text-gray-600 mt-1">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-blue-600">
              {stats.readyUpload}
            </div>
            <p className="text-sm text-gray-600 mt-1">Ready to Upload</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-purple-600">
              {stats.readyEmail}
            </div>
            <p className="text-sm text-gray-600 mt-1">Ready to Email</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={filterConfidence}
                onValueChange={setFilterConfidence}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Matches</SelectItem>
                  <SelectItem value="high">High Confidence</SelectItem>
                  <SelectItem value="medium">Medium Confidence</SelectItem>
                  <SelectItem value="low">Unmatched Only</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600">
                {selectedMatches.length} selected
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Approve Selected
              </Button>
              <Button variant="outline" size="sm">
                Approve All High Confidence
              </Button>
              <Button size="sm" className="gap-2">
                <Cloud className="w-4 h-4" />
                Upload to Drive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Matching</CardTitle>
          <CardDescription>
            Review and confirm certificate to student assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="w-16">Preview</TableHead>
                  <TableHead>Extracted Name</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Cert Code</TableHead>
                  <TableHead>Matched Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedMatches.includes(match.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMatches([...selectedMatches, match.id]);
                          } else {
                            setSelectedMatches(
                              selectedMatches.filter((id) => id !== match.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-10 h-12 bg-gray-100 rounded border flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {match.extractedName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {match.extractedAward}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {match.extractedCode}
                    </TableCell>
                    <TableCell>
                      {match.matchedName ? (
                        <div>
                          <p className="font-medium">{match.matchedName}</p>
                          <p className="text-xs text-gray-500">
                            {match.matchedId}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-red-600">No match</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {match.matchedEmail || (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {match.confidence === "high" && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          High
                        </Badge>
                      )}
                      {match.confidence === "medium" && (
                        <Badge className="bg-yellow-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Medium
                        </Badge>
                      )}
                      {match.confidence === "low" && (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Low
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {match.driveStatus === "uploaded" ? (
                          <Badge variant="outline" className="text-xs">
                            <Cloud className="w-3 h-3 mr-1" />
                            Drive
                          </Badge>
                        ) : null}
                        {match.sheetStatus === "updated" ? (
                          <Badge variant="outline" className="text-xs">
                            <Sheet className="w-3 h-3 mr-1" />
                            Sheet
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate Match Details</DialogTitle>
            <DialogDescription>
              Review certificate and student information
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Certificate Data
                </h3>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedMatch.extractedName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Award:</span>
                    <span className="font-medium">
                      {selectedMatch.extractedAward}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">
                      {selectedMatch.extractedSubject}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-mono text-xs">
                      {selectedMatch.extractedCode}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Matched Student
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Student ID:</span>
                    <span className="font-medium">
                      {selectedMatch.matchedId || "Not matched"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedMatch.matchedName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {selectedMatch.matchedEmail || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Confidence:</span>
                    <Badge
                      className={
                        selectedMatch.confidence === "high"
                          ? "bg-green-600"
                          : selectedMatch.confidence === "medium"
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }
                    >
                      {selectedMatch.confidence}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 pt-4">
                  <Button className="w-full">Approve Match</Button>
                  <Button variant="outline" className="w-full">
                    Change Student
                  </Button>
                  <Button variant="outline" className="w-full">
                    Mark as Unmatched
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
