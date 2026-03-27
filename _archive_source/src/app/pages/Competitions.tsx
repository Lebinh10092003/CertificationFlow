import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, XCircle, Clock, Mail, Cloud, FileSpreadsheet } from "lucide-react";

export function Competitions() {
  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Competition Setup</h1>
        <p className="text-gray-600 mt-1">
          Configure competition details and integrations
        </p>
      </div>

      {/* Competition Details */}
      <Card>
        <CardHeader>
          <CardTitle>Competition Information</CardTitle>
          <CardDescription>
            Basic details about this competition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-name">Competition Name</Label>
              <Input
                id="comp-name"
                placeholder="e.g., Math Olympiad 2026"
                defaultValue="Math Olympiad 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year / Season</Label>
              <Input
                id="academic-year"
                placeholder="e.g., 2025-2026"
                defaultValue="2025-2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-type">Competition Type</Label>
              <Select defaultValue="olympiad">
                <SelectTrigger id="comp-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="olympiad">Olympiad</SelectItem>
                  <SelectItem value="contest">Contest</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject / Category</Label>
              <Select defaultValue="mathematics">
                <SelectTrigger id="subject">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="informatics">Informatics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-template">Email Template</Label>
              <Select defaultValue="default">
                <SelectTrigger id="email-template">
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
              <Label htmlFor="folder-rule">Folder Naming Rule</Label>
              <Input
                id="folder-rule"
                placeholder="e.g., {competition}_{year}"
                defaultValue="{competition}_{year}"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-rule">File Naming Rule</Label>
            <Input
              id="file-rule"
              placeholder="e.g., {student_name}_{award}_{subject}.pdf"
              defaultValue="{student_name}_{award}_{subject}.pdf"
            />
          </div>
        </CardContent>
      </Card>

      {/* Google Integrations */}
      <div className="grid grid-cols-3 gap-6">
        {/* Google Sheets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Google Sheets</CardTitle>
            </div>
            <CardDescription>Student data source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account</span>
                <span className="text-sm font-medium">admin@school.edu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm font-medium">2 hours ago</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Sheet ID</p>
              <p className="text-xs font-mono text-gray-900 truncate">
                1abc...xyz789
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Reconnect
              </Button>
              <Button variant="ghost" className="w-full" size="sm">
                Configure Mapping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Google Drive */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Google Drive</CardTitle>
            </div>
            <CardDescription>Certificate storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account</span>
                <span className="text-sm font-medium">admin@school.edu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Upload</span>
                <span className="text-sm font-medium">5 hours ago</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Destination Folder</p>
              <p className="text-xs font-mono text-gray-900 truncate">
                /Certificates/Math_Olympiad_2026
              </p>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Reconnect
              </Button>
              <Button variant="ghost" className="w-full" size="sm">
                Open Folder
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gmail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg">Gmail Service</CardTitle>
            </div>
            <CardDescription>Email delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account</span>
                <span className="text-sm font-medium">admin@school.edu</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Send</span>
                <span className="text-sm font-medium">5 hours ago</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Daily Quota</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full w-[68%] bg-blue-600 rounded-full"></div>
                </div>
                <span className="text-xs font-medium">685/1000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Reconnect
              </Button>
              <Button variant="ghost" className="w-full" size="sm">
                Test Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Save Configuration</Button>
      </div>
    </div>
  );
}
