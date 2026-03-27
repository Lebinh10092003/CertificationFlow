import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useAppData } from "../contexts/AppDataContext";
import { api } from "../../lib/api";
import type { Competition } from "../../lib/types";

const defaultCompetition: Partial<Competition> = {
  name: "",
  academic_year: "",
  competition_type: "contest",
  subject: "",
  folder_naming_rule: "{competition}_{year}",
  file_naming_rule: "{student_name}_{award}_{subject}.pdf",
  email_template_subject: "",
  email_template_body: "",
  is_active: true,
};

export function Competitions() {
  const {
    selectedCompetition,
    selectedCompetitionId,
    setSelectedCompetitionId,
    refreshCompetitions,
  } = useAppData();
  const [form, setForm] = useState<Partial<Competition>>(defaultCompetition);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(selectedCompetition ?? defaultCompetition);
  }, [selectedCompetition]);

  const updateForm = (field: keyof Competition, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let competition: Competition;
      if (selectedCompetitionId) {
        competition = await api.updateCompetition(selectedCompetitionId, form);
      } else {
        competition = await api.createCompetition(form);
        setSelectedCompetitionId(competition.id);
      }
      await refreshCompetitions();
      setForm(competition);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Competition Setup</h1>
        <p className="text-gray-600 mt-1">All configuration is stored in the Django database.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competition Information</CardTitle>
          <CardDescription>Create a new competition or edit the selected one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comp-name">Competition Name</Label>
              <Input id="comp-name" value={form.name ?? ""} onChange={(event) => updateForm("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year / Season</Label>
              <Input id="academic-year" value={form.academic_year ?? ""} onChange={(event) => updateForm("academic_year", event.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competition-type">Competition Type</Label>
              <select
                id="competition-type"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={form.competition_type ?? "contest"}
                onChange={(event) => updateForm("competition_type", event.target.value)}
              >
                <option value="olympiad">Olympiad</option>
                <option value="contest">Contest</option>
                <option value="exam">Exam</option>
                <option value="fair">Fair</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject / Category</Label>
              <Input id="subject" value={form.subject ?? ""} onChange={(event) => updateForm("subject", event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-rule">Folder Naming Rule</Label>
            <Input id="folder-rule" value={form.folder_naming_rule ?? ""} onChange={(event) => updateForm("folder_naming_rule", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-rule">File Naming Rule</Label>
            <Input id="file-rule" value={form.file_naming_rule ?? ""} onChange={(event) => updateForm("file_naming_rule", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Email Template Subject</Label>
            <Input id="email-subject" value={form.email_template_subject ?? ""} onChange={(event) => updateForm("email_template_subject", event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Email Template Body</Label>
            <Textarea id="email-body" value={form.email_template_body ?? ""} onChange={(event) => updateForm("email_template_body", event.target.value)} rows={6} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => { setSelectedCompetitionId(null); setForm(defaultCompetition); }}>
          New Competition
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || !(form.name ?? "").trim()}>
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
