import { useEffect, useMemo, useState } from "react";

import { api } from "../../../lib/api";
import type { ImportInspection, ImportJob, InspectedWorkbookSheet } from "../../../lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../ui/utils";
import { SheetPreviewTable } from "./SheetPreviewTable";

type ImportMappingWizardProps = {
  inspection: ImportInspection;
  selectedCompetitionId: number;
  onCompleted: (job: ImportJob) => Promise<void> | void;
  onCancel: () => void;
};

type MappingFieldGroup = {
  id: string;
  label: string;
  description: string;
};

type MappingField = {
  id: string;
  label: string;
  groupId: string;
  description: string;
  required?: boolean;
  mergeCritical?: boolean;
  systemGenerated?: boolean;
};

const FIELD_GROUPS: MappingFieldGroup[] = [
  { id: "identity", label: "Identity", description: "Core student identifiers." },
  { id: "contact", label: "Contact", description: "Email and fallback contact fields." },
  { id: "school", label: "School", description: "School and class context." },
  { id: "competition", label: "Competition", description: "Competition, award, and code fields." },
  { id: "audit", label: "Source / Audit", description: "Generated from the workbook itself." },
];

const MAPPING_FIELDS: MappingField[] = [
  { id: "student_id", label: "Student ID", groupId: "identity", description: "Stable student identifier." },
  { id: "external_student_id", label: "External ID", groupId: "identity", description: "Registration or CRM identifier." },
  { id: "student_name", label: "Student Name", groupId: "identity", description: "Primary full name for import and merge.", required: true, mergeCritical: true },
  { id: "preferred_name", label: "Preferred Name", groupId: "identity", description: "Nickname or short display name." },
  { id: "email", label: "Email", groupId: "contact", description: "Primary recipient email." },
  { id: "parent_email", label: "Parent Email", groupId: "contact", description: "Fallback email if provided." },
  { id: "phone", label: "Phone", groupId: "contact", description: "Phone number for reference." },
  { id: "school_name", label: "School", groupId: "school", description: "School or institution name." },
  { id: "province", label: "Province", groupId: "school", description: "Province or city field." },
  { id: "student_class", label: "Class", groupId: "school", description: "Class or homeroom field." },
  { id: "grade", label: "Grade", groupId: "school", description: "Critical field to disambiguate duplicate names.", mergeCritical: true },
  { id: "competition", label: "Competition", groupId: "competition", description: "Competition code or name.", mergeCritical: true },
  { id: "subject", label: "Subject", groupId: "competition", description: "Alternative subject/category field." },
  { id: "award", label: "Award", groupId: "competition", description: "Award or result shown on the certificate.", mergeCritical: true },
  { id: "medal", label: "Medal", groupId: "competition", description: "Medal-only field if separate." },
  { id: "rank", label: "Rank", groupId: "competition", description: "Standing or rank from the sheet." },
  { id: "score", label: "Score", groupId: "competition", description: "Raw score or points." },
  { id: "certificate_code", label: "Certificate Code", groupId: "competition", description: "Best exact-match key when present.", mergeCritical: true },
  { id: "qualified_round", label: "Qualified Round", groupId: "competition", description: "Qualification status or next-round indicator." },
  { id: "notes", label: "Notes", groupId: "competition", description: "Registration status or free-form notes." },
  { id: "sheet_name", label: "Sheet Name", groupId: "audit", description: "Generated from the selected tab.", systemGenerated: true },
  { id: "row_number", label: "Row Number", groupId: "audit", description: "Generated from the workbook row index.", systemGenerated: true },
];

const DEFAULT_OPEN_GROUPS = ["identity", "school", "competition"];

const FIELD_ALIASES: Record<string, string[]> = {
  student_id: ["student id", "id", "student no", "candidate id"],
  external_student_id: ["external id", "registration id", "crm id", "reg id"],
  student_name: ["student name", "candidate's name", "candidate name", "full name", "name"],
  preferred_name: ["preferred name", "nickname", "display name", "short name"],
  email: ["email", "student email", "mail", "teacher email"],
  parent_email: ["parent email", "guardian email", "family email"],
  phone: ["phone", "mobile", "contact number", "telephone"],
  school_name: ["school", "school name", "school/ institution name", "organization", "institution"],
  province: ["province", "city", "location"],
  student_class: ["class", "homeroom", "section"],
  grade: ["grade", "class level", "year"],
  competition: ["competition", "competition code", "olympiad", "contest"],
  subject: ["subject", "category", "track"],
  award: ["award", "award status", "result", "prize"],
  medal: ["medal", "medal status"],
  rank: ["rank", "standing", "position"],
  score: ["score", "mark", "points"],
  certificate_code: ["certificate code", "cert code", "certificate id", "code"],
  qualified_round: ["qualified round", "qualification status", "round", "next round"],
  notes: ["notes", "registration status", "remarks", "comment"],
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function availableColumnsForSheet(sheet: InspectedWorkbookSheet, hasHeader: boolean) {
  return hasHeader ? sheet.header_columns : sheet.positional_columns;
}

function inferCompetitionFromSheetName(sheetName: string) {
  const normalized = normalizeHeader(sheetName);
  if (normalized.includes("artificial intelligence") || normalized.includes("iaio") || normalized.includes("iaoi")) {
    return "IAIO";
  }
  if (normalized.includes("coding") || normalized.includes("ico")) {
    return "ICO";
  }
  return "";
}

function buildUnionColumns(sheets: InspectedWorkbookSheet[], hasHeader: boolean) {
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const sheet of sheets) {
    for (const column of availableColumnsForSheet(sheet, hasHeader)) {
      if (!seen.has(column)) {
        seen.add(column);
        columns.push(column);
      }
    }
  }
  return columns;
}

function buildColumnCoverageMap(sheets: InspectedWorkbookSheet[], hasHeader: boolean) {
  const coverage = new Map<string, number>();
  for (const sheet of sheets) {
    for (const column of availableColumnsForSheet(sheet, hasHeader)) {
      coverage.set(column, (coverage.get(column) ?? 0) + 1);
    }
  }
  return coverage;
}

function resolveFieldColumnForSheet(
  field: MappingField,
  sheet: InspectedWorkbookSheet,
  preferredColumn: string,
  hasHeader: boolean,
) {
  const columns = availableColumnsForSheet(sheet, hasHeader);
  if (field.systemGenerated) {
    return "__system__";
  }
  if (preferredColumn && columns.includes(preferredColumn)) {
    return preferredColumn;
  }
  const aliases = FIELD_ALIASES[field.id] || [];
  const aliasMatch = columns.find((column) => aliases.includes(normalizeHeader(column)));
  if (aliasMatch) {
    return aliasMatch;
  }
  if (field.id === "competition" && inferCompetitionFromSheetName(sheet.name)) {
    return "__sheet_competition__";
  }
  return "";
}

function findSuggestedColumn(
  fieldId: string,
  columns: string[],
  hasHeader: boolean,
  coverageMap: Map<string, number>,
) {
  if (!hasHeader) {
    return "";
  }
  const aliases = FIELD_ALIASES[fieldId] || [];
  const matching = columns.filter((column) => aliases.includes(normalizeHeader(column)));
  if (!matching.length) {
    return "";
  }
  return matching.sort((left, right) => {
    const coverageDelta = (coverageMap.get(right) ?? 0) - (coverageMap.get(left) ?? 0);
    return coverageDelta !== 0 ? coverageDelta : columns.indexOf(left) - columns.indexOf(right);
  })[0];
}

function firstSampleValue(sheet: InspectedWorkbookSheet, column: string, hasHeader: boolean) {
  const columns = availableColumnsForSheet(sheet, hasHeader);
  const columnIndex = columns.indexOf(column);
  if (columnIndex === -1) {
    return "";
  }
  const previewRows = hasHeader ? sheet.preview_matrix.slice(1) : sheet.preview_matrix;
  const row = previewRows.find((item) => item[columnIndex]?.trim()) ?? previewRows[0];
  return row?.[columnIndex]?.trim() ?? "";
}

function sampleValueForField(
  field: MappingField,
  activeSheet: InspectedWorkbookSheet | null,
  mapping: Record<string, string>,
  hasHeader: boolean,
) {
  if (!activeSheet) {
    return "";
  }
  if (field.id === "sheet_name") {
    return activeSheet.name;
  }
  if (field.id === "row_number") {
    return String(hasHeader ? 2 : 1);
  }
  const resolvedColumn = resolveFieldColumnForSheet(field, activeSheet, mapping[field.id] ?? "", hasHeader);
  if (resolvedColumn === "__sheet_competition__") {
    return inferCompetitionFromSheetName(activeSheet.name);
  }
  if (!resolvedColumn || resolvedColumn === "__system__") {
    return "";
  }
  return firstSampleValue(activeSheet, resolvedColumn, hasHeader);
}

type SheetValidationIssue = {
  sheetName: string;
  missingFields: string[];
};

function buildSheetValidationIssues(
  sheets: InspectedWorkbookSheet[],
  hasHeader: boolean,
  mapping: Record<string, string>,
) {
  return sheets
    .map<SheetValidationIssue | null>((sheet) => {
      const missingFields = MAPPING_FIELDS.filter(
        (field) => field.required && !resolveFieldColumnForSheet(field, sheet, mapping[field.id] ?? "", hasHeader),
      ).map((field) => field.label);
      return missingFields.length ? { sheetName: sheet.name, missingFields } : null;
    })
    .filter((issue): issue is SheetValidationIssue => issue !== null);
}

function mergeReadinessLabel(
  selectedSheetCount: number,
  fieldCoverage: Record<string, number>,
) {
  const hasFullCoverage = (fieldId: string) => {
    return (fieldCoverage[fieldId] ?? 0) === selectedSheetCount;
  };
  if (selectedSheetCount === 0 || !hasFullCoverage("student_name")) {
    return { label: "Risky", description: "Student Name is missing across the selected sheets.", badgeVariant: "destructive" as const };
  }
  if (hasFullCoverage("certificate_code") || (hasFullCoverage("grade") && hasFullCoverage("competition"))) {
    return { label: "Strong", description: "You have an exact key or a strong shared merge set.", badgeVariant: "default" as const };
  }
  if (hasFullCoverage("grade")) {
    return { label: "Usable", description: "Student Name and Grade are covered, but exact keys are missing.", badgeVariant: "secondary" as const };
  }
  return { label: "Weak", description: "Only a partial merge set is mapped.", badgeVariant: "outline" as const };
}

export function ImportMappingWizard({
  inspection,
  selectedCompetitionId,
  onCompleted,
  onCancel,
}: ImportMappingWizardProps) {
  const [selectedSheets, setSelectedSheets] = useState<string[]>(inspection.inspection.sheets.map((sheet) => sheet.name));
  const [activeSheetName, setActiveSheetName] = useState<string>(inspection.inspection.sheets[0]?.name ?? "");
  const [hasHeader, setHasHeader] = useState(inspection.inspection.sheets.every((sheet) => sheet.detected_has_header));
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedFieldId, setFocusedFieldId] = useState("student_name");
  const [executing, setExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedSheetObjects = useMemo(
    () => inspection.inspection.sheets.filter((sheet) => selectedSheets.includes(sheet.name)),
    [inspection.inspection.sheets, selectedSheets],
  );

  const unionColumns = useMemo(
    () => buildUnionColumns(selectedSheetObjects, hasHeader),
    [selectedSheetObjects, hasHeader],
  );

  const columnCoverageMap = useMemo(
    () => buildColumnCoverageMap(selectedSheetObjects, hasHeader),
    [selectedSheetObjects, hasHeader],
  );

  const fieldCoverage = useMemo(
    () =>
      Object.fromEntries(
        MAPPING_FIELDS.map((field) => [
          field.id,
          selectedSheetObjects.filter((sheet) =>
            Boolean(resolveFieldColumnForSheet(field, sheet, mapping[field.id] ?? "", hasHeader)),
          ).length,
        ]),
      ),
    [selectedSheetObjects, hasHeader, mapping],
  );

  const activeSheet = useMemo(
    () =>
      selectedSheetObjects.find((sheet) => sheet.name === activeSheetName) ??
      selectedSheetObjects[0] ??
      null,
    [activeSheetName, selectedSheetObjects],
  );

  const sheetValidationIssues = useMemo(
    () => buildSheetValidationIssues(selectedSheetObjects, hasHeader, mapping),
    [selectedSheetObjects, hasHeader, mapping],
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = normalizeHeader(searchTerm);
    return FIELD_GROUPS.map((group) => ({
      ...group,
      fields: MAPPING_FIELDS.filter((field) => {
        if (field.groupId !== group.id) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        return [field.label, field.description]
          .map(normalizeHeader)
          .some((value) => value.includes(normalizedSearch));
      }),
    })).filter((group) => group.fields.length > 0);
  }, [searchTerm]);

  const missingRequired = MAPPING_FIELDS.filter((field) => field.required && !mapping[field.id]).map(
    (field) => field.label,
  );

  const mergeCriticalMissing = MAPPING_FIELDS.filter(
    (field) => field.mergeCritical && !field.required && !mapping[field.id],
  ).map((field) => field.label);

  const readiness = useMemo(
    () => mergeReadinessLabel(selectedSheetObjects.length, fieldCoverage),
    [selectedSheetObjects.length, fieldCoverage],
  );

  const highlightedColumn = useMemo(() => {
    const column = mapping[focusedFieldId] || mapping.student_name;
    return activeSheet && column && availableColumnsForSheet(activeSheet, hasHeader).includes(column)
      ? column
      : null;
  }, [activeSheet, focusedFieldId, hasHeader, mapping]);

  useEffect(() => {
    if (!activeSheetName || !selectedSheets.includes(activeSheetName)) {
      setActiveSheetName(selectedSheets[0] ?? "");
    }
  }, [activeSheetName, selectedSheets]);

  useEffect(() => {
    setMapping((current) => {
      const next = { ...current };
      for (const field of MAPPING_FIELDS) {
        if (field.systemGenerated) {
          continue;
        }
        const currentValue = next[field.id];
        if (currentValue && unionColumns.includes(currentValue)) {
          continue;
        }
        next[field.id] = findSuggestedColumn(field.id, unionColumns, hasHeader, columnCoverageMap);
      }
      return next;
    });
  }, [unionColumns, hasHeader, columnCoverageMap]);

  const toggleSheet = (sheetName: string, checked: boolean) => {
    setSelectedSheets((current) =>
      checked ? [...current, sheetName] : current.filter((item) => item !== sheetName),
    );
  };

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMessage("");
    try {
      const job = await api.executeImportFile(selectedCompetitionId, {
        import_job_id: inspection.import_job.id,
        selected_sheets: selectedSheets,
        has_header: hasHeader,
        mapping,
      });
      await onCompleted(job);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Import execution failed");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader>
        <CardTitle>Map Workbook Columns</CardTitle>
        <CardDescription>
          Select sheets, map the fields for this run, and check coverage before importing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Sheets</p>
                  <p className="text-xs text-slate-600">Choose the workbook tabs for this import run.</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={hasHeader}
                    onCheckedChange={(checked) => setHasHeader(Boolean(checked))}
                  />
                  Has header row
                </label>
              </div>
              <div className="space-y-2">
                {inspection.inspection.sheets.map((sheet) => {
                  const isSelected = selectedSheets.includes(sheet.name);
                  return (
                    <label
                      key={sheet.name}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                        isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleSheet(sheet.name, Boolean(checked))}
                      />
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => setActiveSheetName(sheet.name)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{sheet.name}</p>
                          {activeSheetName === sheet.name ? (
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              Preview
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {sheet.row_count} rows | {sheet.column_count} columns
                        </p>
                      </button>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Merge readiness</p>
                  <p className="text-xs text-slate-600">{readiness.description}</p>
                </div>
                <Badge variant={readiness.badgeVariant}>{readiness.label}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <Badge variant="outline">{selectedSheetObjects.length} sheets</Badge>
                <Badge variant="outline">{unionColumns.length} source columns</Badge>
                <Badge variant="outline">
                  {Array.from(columnCoverageMap.values()).filter(
                    (count) => count === selectedSheetObjects.length,
                  ).length}{" "}
                  fully shared columns
                </Badge>
              </div>
              {mergeCriticalMissing.length ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-medium">Merge-critical fields still missing</p>
                  <p className="mt-1">{mergeCriticalMissing.join(", ")}</p>
                </div>
              ) : null}
              {sheetValidationIssues.length ? (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">Selected sheets do not share the current mapping</p>
                  <div className="mt-2 space-y-1">
                    {sheetValidationIssues.map((issue) => (
                      <p key={issue.sheetName}>
                        {issue.sheetName}: missing {issue.missingFields.join(", ")}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Shared mapping</p>
                  <p className="text-xs text-slate-600">
                    One mapping applies to every selected sheet. Equivalent headers on other sheets are resolved automatically before import.
                  </p>
                </div>
                <div className="w-full lg:max-w-xs">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search fields..."
                  />
                </div>
              </div>
              <ScrollArea className="mt-4 h-[560px] w-full rounded-lg border">
                <div className="min-w-[920px] pr-4 pb-4">
                  <Accordion type="multiple" defaultValue={DEFAULT_OPEN_GROUPS} className="space-y-4">
                    {filteredGroups.map((group) => (
                      <AccordionItem
                        key={group.id}
                        value={group.id}
                        className="rounded-lg border bg-slate-50 px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                            <p className="mt-1 text-xs font-normal text-slate-600">{group.description}</p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="hidden gap-3 border-b border-slate-200 pb-2 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[220px_100px_260px_minmax(0,1fr)_120px]">
                            <span>Field</span>
                            <span>Status</span>
                            <span>Source Column</span>
                            <span>Sample Value</span>
                            <span>Coverage</span>
                          </div>
                          <div className="space-y-3 pt-2">
                            {group.fields.map((field) => {
                              const selectedColumn = mapping[field.id] ?? "";
                              const sampleValue = sampleValueForField(field, activeSheet, mapping, hasHeader);
                              const coverageCount = fieldCoverage[field.id] ?? 0;
                              const resolvedForActiveSheet = activeSheet
                                ? resolveFieldColumnForSheet(field, activeSheet, selectedColumn, hasHeader)
                                : "";
                              return (
                                <div
                                  key={field.id}
                                  className={cn(
                                    "grid gap-3 rounded-lg border bg-white p-3 md:grid-cols-[220px_100px_260px_minmax(0,1fr)_120px]",
                                    focusedFieldId === field.id && "border-blue-300 ring-1 ring-blue-200",
                                  )}
                                >
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-medium text-slate-900">
                                        {field.label}
                                        {field.required ? " *" : ""}
                                      </p>
                                      {field.mergeCritical ? (
                                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                                          Merge
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">{field.description}</p>
                                  </div>

                                  <div className="flex flex-wrap items-start gap-2">
                                    {field.systemGenerated ? (
                                      <Badge variant="secondary">Auto</Badge>
                                    ) : field.required ? (
                                      <Badge variant="default">Required</Badge>
                                    ) : (
                                      <Badge variant="outline">Optional</Badge>
                                    )}
                                  </div>

                                  <div>
                                    {field.systemGenerated ? (
                                      <div className="rounded-md border border-dashed bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                        {field.id === "sheet_name"
                                          ? "From selected sheet tab"
                                          : "From workbook row position"}
                                      </div>
                                    ) : (
                                      <select
                                        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                                        value={selectedColumn}
                                        onFocus={() => setFocusedFieldId(field.id)}
                                        onChange={(event) => {
                                          setFocusedFieldId(field.id);
                                          setMapping((current) => ({ ...current, [field.id]: event.target.value }));
                                        }}
                                      >
                                        <option value="">Not mapped</option>
                                        {unionColumns.map((column) => (
                                          <option key={`${field.id}-${column}`} value={column}>
                                            {selectedSheetObjects.length > 1
                                              ? `${column} (${columnCoverageMap.get(column) ?? 0}/${selectedSheetObjects.length})`
                                              : column}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    {sampleValue ? (
                                      <p className="truncate text-sm text-slate-700" title={sampleValue}>
                                        {sampleValue}
                                      </p>
                                    ) : field.systemGenerated ? (
                                      <p className="text-sm text-slate-600">
                                        {field.id === "sheet_name"
                                          ? activeSheet?.name || "No sheet selected"
                                          : hasHeader
                                            ? "Starts at row 2"
                                            : "Starts at row 1"}
                                      </p>
                                    ) : selectedColumn ? (
                                      <p className="text-sm text-amber-700">
                                        {resolvedForActiveSheet === "__sheet_competition__"
                                          ? "Competition inferred from the sheet name."
                                          : activeSheet && !resolvedForActiveSheet
                                          ? "Mapped column is missing here. The importer will still try equivalent headers on this sheet."
                                          : "No sample value found in preview rows."}
                                      </p>
                                    ) : (
                                      <p className="text-sm text-slate-400">Choose a source column</p>
                                    )}
                                  </div>

                                  <div className="text-sm text-slate-700">
                                    {field.systemGenerated ? (
                                      <Badge variant="secondary">Auto</Badge>
                                    ) : selectedColumn ? (
                                      <Badge
                                        variant={coverageCount === selectedSheetObjects.length ? "default" : "outline"}
                                      >
                                        {coverageCount}/{selectedSheetObjects.length || 0} sheets
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Not mapped</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Preview</p>
                  <p className="text-xs text-slate-600">
                    {activeSheet?.name || "No sheet selected"} | {hasHeader ? "Header mode" : "Column-letter mode"}
                  </p>
                </div>
                {highlightedColumn ? (
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    Highlighting {highlightedColumn}
                  </Badge>
                ) : null}
              </div>
              <SheetPreviewTable
                sheet={activeSheet}
                hasHeader={hasHeader}
                highlightedColumn={highlightedColumn}
              />
            </div>
          </div>
        </div>

        {selectedSheets.length === 0 ? (
          <p className="text-sm text-amber-700">Select at least one sheet before importing.</p>
        ) : null}
        {missingRequired.length ? (
          <p className="text-sm text-amber-700">
            Required mapping missing: {missingRequired.join(", ")}.
          </p>
        ) : null}
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={executing}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleExecute()}
            disabled={
              executing ||
              !selectedSheets.length ||
              !!missingRequired.length
            }
          >
            {executing ? "Importing..." : "Execute Import"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
