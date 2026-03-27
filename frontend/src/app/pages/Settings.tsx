import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { FileText } from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { api } from "../../lib/api";
import type { Competition } from "../../lib/types";

export function Settings() {
  const { selectedCompetition, selectedCompetitionId, refreshCompetitions } = useAppData();
  const [form, setForm] = useState<Partial<Competition>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(selectedCompetition ?? {});
  }, [selectedCompetition]);

  const updateForm = (field: keyof Competition, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedCompetitionId) {
      return;
    }
    setSaving(true);
    try {
      await api.updateCompetition(selectedCompetitionId, form);
      await refreshCompetitions();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Persisted naming settings for the selected competition.</p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            File Naming
          </CardTitle>
          <CardDescription>Stored in the competition record</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-rule">Folder Naming Rule</Label>
            <Input id="folder-rule" value={form.folder_naming_rule ?? ""} onChange={(event) => updateForm("folder_naming_rule", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-rule">File Naming Rule</Label>
            <Input id="file-rule" value={form.file_naming_rule ?? ""} onChange={(event) => updateForm("file_naming_rule", event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} disabled={saving || !selectedCompetitionId}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
