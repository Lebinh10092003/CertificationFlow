import type { InspectedWorkbookSheet } from "../../../lib/types";
import { cn } from "../ui/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type SheetPreviewTableProps = {
  sheet: InspectedWorkbookSheet | null;
  hasHeader: boolean;
  highlightedColumn?: string | null;
};

export function SheetPreviewTable({
  sheet,
  hasHeader,
  highlightedColumn = null,
}: SheetPreviewTableProps) {
  if (!sheet) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
        Select a sheet to preview its rows.
      </div>
    );
  }

  const columns = hasHeader ? sheet.header_columns : sheet.positional_columns;
  const previewRows = hasHeader ? sheet.preview_matrix.slice(1) : sheet.preview_matrix;
  const rowNumberStart = hasHeader ? 2 : 1;

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="max-h-[360px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 bg-slate-50">Row</TableHead>
              {columns.map((column) => {
                const isHighlighted = highlightedColumn === column;
                return (
                  <TableHead
                    key={column}
                    className={cn(isHighlighted && "bg-blue-50 text-blue-800")}
                  >
                    {column}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length + 1, 1)} className="py-6 text-center text-slate-500">
                  No preview rows available.
                </TableCell>
              </TableRow>
            ) : (
              previewRows.map((row, rowIndex) => (
                <TableRow key={`${sheet.name}-${rowIndex}`}>
                  <TableCell className="bg-slate-50 align-top text-xs text-slate-500">
                    {rowNumberStart + rowIndex}
                  </TableCell>
                  {columns.map((column, columnIndex) => {
                    const isHighlighted = highlightedColumn === column;
                    return (
                      <TableCell
                        key={`${column}-${rowIndex}`}
                        className={cn(
                          "max-w-[280px] align-top whitespace-normal break-words",
                          isHighlighted && "bg-blue-50/70",
                        )}
                      >
                        {row[columnIndex] || ""}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
