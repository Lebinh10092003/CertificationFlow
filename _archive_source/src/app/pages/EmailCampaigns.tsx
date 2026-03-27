import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
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
import { Mail, Send, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";

const recipients = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    email: "nva@school.edu",
    award: "Gold Medal",
    subject: "Mathematics",
    certStatus: "ready",
    mailStatus: "sent",
  },
  {
    id: 2,
    name: "Trần Thị Bình",
    email: "ttb@school.edu",
    award: "Silver Medal",
    subject: "Mathematics",
    certStatus: "ready",
    mailStatus: "sent",
  },
  {
    id: 3,
    name: "Lê Minh Châu",
    email: "",
    award: "Bronze Medal",
    subject: "Mathematics",
    certStatus: "ready",
    mailStatus: "pending",
  },
  {
    id: 4,
    name: "Phạm Quốc Duy",
    email: "pqd@school.edu",
    award: "Consolation Prize",
    subject: "Mathematics",
    certStatus: "missing",
    mailStatus: "pending",
  },
  {
    id: 5,
    name: "Hoàng Thanh Hà",
    email: "hth@school.edu",
    award: "Gold Medal",
    subject: "Mathematics",
    certStatus: "ready",
    mailStatus: "ready",
  },
  {
    id: 6,
    name: "Đỗ Văn Khoa",
    email: "dvk@school.edu",
    award: "Silver Medal",
    subject: "Mathematics",
    certStatus: "ready",
    mailStatus: "ready",
  },
];

const mergeTags = [
  { tag: "{{student_name}}", description: "Student's full name" },
  { tag: "{{award}}", description: "Award received" },
  { tag: "{{subject}}", description: "Competition subject" },
  { tag: "{{certificate_link}}", description: "Link to certificate" },
  { tag: "{{school_name}}", description: "Student's school" },
  { tag: "{{competition_name}}", description: "Competition name" },
];

export function EmailCampaigns() {
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPreview, setShowPreview] = useState(false);
  const [emailOptions, setEmailOptions] = useState({
    sendAsAttachment: false,
    sendAsDriveLink: true,
    ccOrganizer: true,
  });

  const filteredRecipients = recipients.filter((r) =>
    filterStatus === "all"
      ? true
      : filterStatus === "ready"
      ? r.mailStatus === "ready"
      : filterStatus === "sent"
      ? r.mailStatus === "sent"
      : filterStatus === "missing-email"
      ? !r.email
      : filterStatus === "missing-cert"
      ? r.certStatus === "missing"
      : true
  );

  const stats = {
    total: recipients.length,
    ready: recipients.filter((r) => r.mailStatus === "ready").length,
    missingCert: recipients.filter((r) => r.certStatus === "missing").length,
    missingEmail: recipients.filter((r) => !r.email).length,
    sent: recipients.filter((r) => r.mailStatus === "sent").length,
    failed: 0,
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Email Campaigns
        </h1>
        <p className="text-gray-600 mt-1">
          Send certificates to students via email
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-gray-900">
              {stats.total}
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-blue-600">
              {stats.ready}
            </div>
            <p className="text-sm text-gray-600 mt-1">Ready to Send</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-yellow-600">
              {stats.missingCert}
            </div>
            <p className="text-sm text-gray-600 mt-1">Missing Certificate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-red-600">
              {stats.missingEmail}
            </div>
            <p className="text-sm text-gray-600 mt-1">Missing Email</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-green-600">
              {stats.sent}
            </div>
            <p className="text-sm text-gray-600 mt-1">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold text-red-600">
              {stats.failed}
            </div>
            <p className="text-sm text-gray-600 mt-1">Failed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Panel - Filters */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter recipients by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setFilterStatus("all")}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                filterStatus === "all"
                  ? "bg-blue-50 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">All Recipients</span>
                <Badge variant="secondary">{recipients.length}</Badge>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus("ready")}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                filterStatus === "ready"
                  ? "bg-blue-50 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Ready to Send</span>
                <Badge variant="secondary">{stats.ready}</Badge>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus("sent")}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                filterStatus === "sent"
                  ? "bg-blue-50 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Already Sent</span>
                <Badge variant="secondary">{stats.sent}</Badge>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus("missing-email")}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                filterStatus === "missing-email"
                  ? "bg-blue-50 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Missing Email</span>
                <Badge variant="destructive">{stats.missingEmail}</Badge>
              </div>
            </button>
            <button
              onClick={() => setFilterStatus("missing-cert")}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                filterStatus === "missing-cert"
                  ? "bg-blue-50 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Missing Certificate</span>
                <Badge variant="destructive">{stats.missingCert}</Badge>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Center Panel - Recipient List */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recipients</CardTitle>
                <CardDescription>
                  {selectedRecipients.length} selected
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedRecipients.length === filteredRecipients.length) {
                    setSelectedRecipients([]);
                  } else {
                    setSelectedRecipients(
                      filteredRecipients.map((r) => r.id)
                    );
                  }
                }}
              >
                {selectedRecipients.length === filteredRecipients.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Award</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipients.map((recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecipients.includes(recipient.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([
                                ...selectedRecipients,
                                recipient.id,
                              ]);
                            } else {
                              setSelectedRecipients(
                                selectedRecipients.filter(
                                  (id) => id !== recipient.id
                                )
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {recipient.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {recipient.email || (
                          <Badge variant="destructive" className="text-xs">
                            Missing
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {recipient.award}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recipient.mailStatus === "sent" && (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                        )}
                        {recipient.mailStatus === "ready" && (
                          <Badge className="bg-blue-600">
                            <Mail className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                        {recipient.mailStatus === "pending" && (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Email Composer</CardTitle>
          <CardDescription>Compose your email message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Template</SelectItem>
                <SelectItem value="formal">Formal Template</SelectItem>
                <SelectItem value="friendly">Friendly Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input
              defaultValue="Congratulations on your {{award}} - Math Olympiad 2026"
              placeholder="Email subject..."
            />
          </div>

          <div className="space-y-2">
            <Label>Message Body</Label>
            <Textarea
              rows={8}
              defaultValue={`Dear {{student_name}},

Congratulations on receiving the {{award}} in the {{subject}} competition!

We are pleased to share your certificate with you. You can download it using the link below:

{{certificate_link}}

Best regards,
Math Olympiad Committee`}
              placeholder="Email body with merge tags..."
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Available Merge Tags
            </p>
            <div className="grid grid-cols-3 gap-3">
              {mergeTags.map((tag) => (
                <div key={tag.tag} className="flex flex-col">
                  <code className="text-xs font-mono text-blue-600 mb-1">
                    {tag.tag}
                  </code>
                  <span className="text-xs text-gray-600">
                    {tag.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send as attachment</Label>
                <p className="text-xs text-gray-600">
                  Attach PDF directly to email
                </p>
              </div>
              <Switch
                checked={emailOptions.sendAsAttachment}
                onCheckedChange={(checked) =>
                  setEmailOptions({ ...emailOptions, sendAsAttachment: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Send as Drive link</Label>
                <p className="text-xs text-gray-600">
                  Include Google Drive link
                </p>
              </div>
              <Switch
                checked={emailOptions.sendAsDriveLink}
                onCheckedChange={(checked) =>
                  setEmailOptions({ ...emailOptions, sendAsDriveLink: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>CC organizer</Label>
                <p className="text-xs text-gray-600">Send copy to admin</p>
              </div>
              <Switch
                checked={emailOptions.ccOrganizer}
                onCheckedChange={(checked) =>
                  setEmailOptions({ ...emailOptions, ccOrganizer: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="gap-2" onClick={() => setShowPreview(true)}>
              <Eye className="w-4 h-4" />
              Preview Email
            </Button>
            <Button variant="outline">Save Template</Button>
            <Button variant="outline">Send Test Email</Button>
            <div className="flex-1"></div>
            <Button
              className="gap-2"
              disabled={selectedRecipients.length === 0}
            >
              <Send className="w-4 h-4" />
              Send to Selected ({selectedRecipients.length})
            </Button>
            <Button className="gap-2">
              <Send className="w-4 h-4" />
              Send to All Ready ({stats.ready})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview with sample merge field values
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-gray-600">To:</p>
                <p className="text-sm font-medium">nva@school.edu</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Subject:</p>
                <p className="text-sm font-medium">
                  Congratulations on your Gold Medal - Math Olympiad 2026
                </p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm whitespace-pre-line">
                {`Dear Nguyễn Văn An,

Congratulations on receiving the Gold Medal in the Mathematics competition!

We are pleased to share your certificate with you. You can download it using the link below:

https://drive.google.com/file/d/abc123

Best regards,
Math Olympiad Committee`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
