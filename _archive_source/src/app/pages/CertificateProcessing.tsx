import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";

const processingSteps = [
  { id: 1, label: "Upload", status: "completed" },
  { id: 2, label: "Split Pages", status: "completed" },
  { id: 3, label: "Extract Data", status: "processing" },
  { id: 4, label: "Match Students", status: "pending" },
  { id: 5, label: "Upload to Drive", status: "pending" },
  { id: 6, label: "Update Google Sheet", status: "pending" },
  { id: 7, label: "Ready for Email", status: "pending" },
];

const uploadedFiles = [
  {
    name: "Math_Olympiad_Certificates_2026.pdf",
    pages: 156,
    uploadTime: "2 minutes ago",
    status: "processing",
    progress: 65,
  },
  {
    name: "Physics_Contest_Round1.pdf",
    pages: 89,
    uploadTime: "1 hour ago",
    status: "completed",
    progress: 100,
  },
];

export function CertificateProcessing() {
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState({
    detectDuplicates: true,
    normalizeNames: true,
    normalizeSchools: true,
    runValidation: true,
    overwriteLinks: false,
    saveUnmatched: true,
  });

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Certificate Processing
        </h1>
        <p className="text-gray-600 mt-1">
          Upload and process certificate PDFs
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Certificates</CardTitle>
          <CardDescription>
            Drag and drop PDF files or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your certificate PDFs here
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              or click to browse your computer
            </p>
            <Button>Select PDF Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>Files ready for processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {file.pages} pages • {file.uploadTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "completed" && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {file.status === "processing" && (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Processing
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {file.status === "processing" && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Extracting data from certificates...
                      </span>
                      <span className="font-medium">{file.progress}%</span>
                    </div>
                    <Progress value={file.progress} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processing Options */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Processing Mode</CardTitle>
            <CardDescription>Select what operations to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="mode"
                  defaultChecked
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Split Only</p>
                  <p className="text-sm text-gray-600">
                    Just split PDF into individual pages
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="mode" className="mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Split + Extract</p>
                  <p className="text-sm text-gray-600">
                    Split and extract certificate information
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="mode" className="mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    Split + Extract + Match
                  </p>
                  <p className="text-sm text-gray-600">
                    Also match certificates to students
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="mode" className="mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Full Pipeline</p>
                  <p className="text-sm text-gray-600">
                    Complete workflow: Split → Extract → Upload → Update Sheet
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
            <CardDescription>Fine-tune processing behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Detect duplicate certificate code</Label>
                <p className="text-xs text-gray-600">
                  Flag certificates with same code
                </p>
              </div>
              <Switch
                checked={options.detectDuplicates}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, detectDuplicates: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Normalize student names</Label>
                <p className="text-xs text-gray-600">
                  Standardize name formatting
                </p>
              </div>
              <Switch
                checked={options.normalizeNames}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, normalizeNames: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Normalize school names</Label>
                <p className="text-xs text-gray-600">Remove special characters</p>
              </div>
              <Switch
                checked={options.normalizeSchools}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, normalizeSchools: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Run validation rules</Label>
                <p className="text-xs text-gray-600">Check for common errors</p>
              </div>
              <Switch
                checked={options.runValidation}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, runValidation: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Overwrite existing Drive links</Label>
                <p className="text-xs text-gray-600">
                  Replace files already uploaded
                </p>
              </div>
              <Switch
                checked={options.overwriteLinks}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, overwriteLinks: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Save unmatched certificates</Label>
                <p className="text-xs text-gray-600">
                  To a separate folder for review
                </p>
              </div>
              <Switch
                checked={options.saveUnmatched}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, saveUnmatched: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
          <CardDescription>Current workflow status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: "28.5%" }}
              ></div>
            </div>
            <div className="relative flex justify-between">
              {processingSteps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                      step.status === "completed"
                        ? "bg-blue-600 border-blue-600"
                        : step.status === "processing"
                        ? "bg-blue-50 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : step.status === "processing" ? (
                      <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <span className="text-sm text-gray-400">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs text-center ${
                      step.status === "pending"
                        ? "text-gray-500"
                        : "text-gray-900 font-medium"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button size="lg" className="gap-2">
          <Upload className="w-4 h-4" />
          Start Processing
        </Button>
      </div>
    </div>
  );
}
