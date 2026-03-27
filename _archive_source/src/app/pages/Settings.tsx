import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Settings as SettingsIcon,
  FileText,
  GitCompare,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";

export function Settings() {
  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure system behavior and integrations
        </p>
      </div>

      <Tabs defaultValue="naming">
        <TabsList>
          <TabsTrigger value="naming">
            <FileText className="w-4 h-4 mr-2" />
            File Naming
          </TabsTrigger>
          <TabsTrigger value="matching">
            <GitCompare className="w-4 h-4 mr-2" />
            Matching Rules
          </TabsTrigger>
          <TabsTrigger value="validation">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <LinkIcon className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* File Naming Rules */}
        <TabsContent value="naming" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Naming Rules</CardTitle>
              <CardDescription>
                Configure how certificate files should be named
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pretty-format">Pretty File Name Format</Label>
                <Input
                  id="pretty-format"
                  defaultValue="{student_name} - {award} - {subject}.pdf"
                  placeholder="e.g., {student_name}_{award}_{subject}.pdf"
                />
                <p className="text-xs text-gray-600">
                  Used for display purposes. Supports: {"{student_name}"},{" "}
                  {"{award}"}, {"{subject}"}, {"{school}"}, {"{grade}"},{" "}
                  {"{cert_code}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="safe-format">
                  Safe System File Name Format
                </Label>
                <Input
                  id="safe-format"
                  defaultValue="{student_name}_{award}_{subject}.pdf"
                  placeholder="e.g., {student_name}_{award}_{subject}.pdf"
                />
                <p className="text-xs text-gray-600">
                  Used for actual file storage. Special characters will be
                  removed automatically.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-length">Maximum File Name Length</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="max-length"
                    type="number"
                    defaultValue="100"
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600">characters</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transliterate Vietnamese Characters</Label>
                  <p className="text-xs text-gray-600">
                    Convert "Nguyễn" to "Nguyen", "Đỗ" to "Do", etc.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Replace Spaces with Underscores</Label>
                  <p className="text-xs text-gray-600">
                    More compatible with some systems
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Convert to Lowercase</Label>
                  <p className="text-xs text-gray-600">
                    All file names in lowercase
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save File Naming Rules</Button>
          </div>
        </TabsContent>

        {/* Matching Rules */}
        <TabsContent value="matching" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Matching Rules</CardTitle>
              <CardDescription>
                How to match certificates to student records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exact Certificate Code Match</Label>
                  <p className="text-xs text-gray-600">
                    Match by certificate code when available
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exact Student ID Match</Label>
                  <p className="text-xs text-gray-600">
                    Match by student ID when code unavailable
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fuzzy Student Name Match</Label>
                  <p className="text-xs text-gray-600">
                    Allow minor spelling variations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Verify Award and Subject</Label>
                  <p className="text-xs text-gray-600">
                    Must match expected award and subject
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Confidence Threshold</Label>
                <div className="flex gap-4 items-center">
                  <Slider
                    defaultValue={[75]}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">75%</span>
                </div>
                <p className="text-xs text-gray-600">
                  Minimum confidence score to auto-approve a match
                </p>
              </div>

              <div className="space-y-2">
                <Label>Fuzzy Match Tolerance</Label>
                <div className="flex gap-4 items-center">
                  <Slider
                    defaultValue={[80]}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">80%</span>
                </div>
                <p className="text-xs text-gray-600">
                  String similarity required for fuzzy name matching
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Matching Rules</Button>
          </div>
        </TabsContent>

        {/* Validation Rules */}
        <TabsContent value="validation" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Detect common errors and anomalies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect Typo "Qualifed" (Missing 'i')</Label>
                  <p className="text-xs text-gray-600">
                    Common OCR error in certificate text
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect Uppercase/Lowercase Anomalies</Label>
                  <p className="text-xs text-gray-600">
                    Flag inconsistent capitalization
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect School Name Contains "|"</Label>
                  <p className="text-xs text-gray-600">
                    Common OCR error for "l" or "I"
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect Missing Award</Label>
                  <p className="text-xs text-gray-600">
                    Certificate without award information
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect Duplicate File Names</Label>
                  <p className="text-xs text-gray-600">
                    Warn about potential overwrite conflicts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Detect Duplicate Certificate Code</Label>
                  <p className="text-xs text-gray-600">
                    Same code used for multiple certificates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Check for Missing Email Addresses</Label>
                  <p className="text-xs text-gray-600">
                    Flag students without email before sending
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Validate Email Format</Label>
                  <p className="text-xs text-gray-600">
                    Check email addresses are properly formatted
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Validation Rules</Button>
          </div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive API</CardTitle>
              <CardDescription>
                Configure Google Drive integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  defaultValue="1234567890-abcdefghijklmnop.apps.googleusercontent.com"
                  className="font-mono text-sm"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  defaultValue="GOCSPX-••••••••••••••••••••"
                  className="font-mono text-sm"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Redirect URI</Label>
                <Input
                  defaultValue="http://localhost:3000/auth/callback"
                  className="font-mono text-sm"
                />
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Sheets API</CardTitle>
              <CardDescription>
                Configure Google Sheets integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  defaultValue="AIza••••••••••••••••••••••••••••••••"
                  className="font-mono text-sm"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Service Account Email</Label>
                <Input
                  defaultValue="certmail@project-123456.iam.gserviceaccount.com"
                  className="font-mono text-sm"
                />
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gmail / Email Service</CardTitle>
              <CardDescription>
                Configure email sending service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <select className="w-full h-10 px-3 border rounded-md">
                  <option>Gmail API</option>
                  <option>Google Apps Script</option>
                  <option>SendGrid</option>
                  <option>SMTP</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input defaultValue="admin@school.edu" />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input defaultValue="Math Olympiad Committee" />
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoint</CardTitle>
              <CardDescription>
                Optional webhook for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://your-server.com/webhook"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Secret Key</Label>
                <Input
                  placeholder="Your webhook secret"
                  className="font-mono text-sm"
                  type="password"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Webhook</Label>
                  <p className="text-xs text-gray-600">
                    Send events to external endpoint
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>Save Integration Settings</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
