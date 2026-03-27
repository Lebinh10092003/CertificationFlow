import { useEffect, useMemo, useState } from "react";

import { api } from "../../../lib/api";
import type { ExportColumnInspection } from "../../../lib/types";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ExportColumnList, type ExportColumnItem } from "./ExportColumnList";

type ExportBuilderDialogProps = {
  open: boolean;
  competitionId: number | null;
  batchIds: number[];
  batchName: string;
  onOpenChange: (open: boolean) => void;
};

function mergeColumnItems(inspection: ExportColumnInspection): ExportColumnItem[] {
  const defaultKeys = new Set(
    inspection.default_columns.map((column) => `${column.source_type}:${column.key}`),
  );
  const allColumns = [...inspection.default_columns];
  for (const column of [...inspection.source_columns, ...inspection.system_columns]) {
    const compositeKey = `${column.source_type}:${column.key}`;
    if (!allColumns.some((item) => `${item.source_type}:${item.key}` === compositeKey)) {
      allColumns.push(column);
    }
  }
  return allColumns.map((column) => ({
    ...column,
    selected: defaultKeys.has(`${column.source_type}:${column.key}`),
  }));
}

export function ExportBuilderDialog({
  open,
  competitionId,
  batchIds,
  batchName,
  onOpenChange,
}: ExportBuilderDialogProps) {
  const [inspection, setInspection] = useState<ExportColumnInspection | null>(null);
  const [items, setItems] = useState<ExportColumnItem[]>([]);
  const [sheetMode, setSheetMode] = useState("split_by_competition");
  const [formatMode, setFormatMode] = useState("business");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open || !competitionId || !batchIds.length) {
      return;
    }
    const loadColumns = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await api.fetchCompetitionExportColumns(competitionId, batchIds);
        setInspection(response);
        setItems(mergeColumnItems(response));
        setSheetMode(response.sheet_modes[0] || "split_by_competition");
        setFormatMode(response.format_modes[0] || "business");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load export columns");
      } finally {
        setLoading(false);
      }
    };
    void loadColumns();
  }, [open, competitionId, batchIds]);

  const selectedColumns = useMemo(
    () => items.filter((item) => item.selected).map(({ selected, ...column }) => column),
    [items],
  );

  const duplicateLabels = useMemo(() => {
    const labels = selectedColumns.map((column) => column.label.trim()).filter(Boolean);
    return labels.length !== new Set(labels).size;
  }, [selectedColumns]);

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleExport = async () => {
    if (!competitionId || !batchIds.length) {
      return;
    }
    setExporting(true);
    setErrorMessage("");
    try {
      await api.exportConfiguredCompetitionBatches(competitionId, {
        batch_ids: batchIds,
        columns: selectedColumns,
        sheet_mode: sheetMode,
        format_mode: formatMode,
      });
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Export Builder</DialogTitle>
          <DialogDescription>
            Choose columns, order, labels, and workbook style for {batchName || "the selected uploaded files"}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-slate-600">Loading export columns...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-700">
                <span className="font-medium">Sheet mode</span>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={sheetMode}
                  onChange={(event) => setSheetMode(event.target.value)}
                >
                  {(inspection?.sheet_modes || []).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-700">
                <span className="font-medium">Format mode</span>
                <select
                  className="rounded-md border px-3 py-2 text-sm"
                  value={formatMode}
                  onChange={(event) => setFormatMode(event.target.value)}
                >
                  {(inspection?.format_modes || []).map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <ExportColumnList
              items={items}
              disabled={exporting}
              onToggle={(index, selected) =>
                setItems((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, selected } : item,
                  ),
                )
              }
              onMove={moveItem}
              onLabelChange={(index, label) =>
                setItems((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, label } : item,
                  ),
                )
              }
            />

            <div className="flex items-center justify-between">
              <div className="space-y-1 text-sm">
                <p className="text-slate-700">{selectedColumns.length} columns selected</p>
                {duplicateLabels ? (
                  <p className="text-amber-700">Duplicate export labels detected. Excel will still be generated.</p>
                ) : null}
                {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
                  Close
                </Button>
                <Button onClick={() => void handleExport()} disabled={exporting || !selectedColumns.length}>
                  {exporting ? "Exporting..." : "Download Excel"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
