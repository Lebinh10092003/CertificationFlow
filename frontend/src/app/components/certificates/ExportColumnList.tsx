import { ArrowDown, ArrowUp } from "lucide-react";

import type { ExportColumnOption } from "../../../lib/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

export type ExportColumnItem = ExportColumnOption & {
  selected: boolean;
};

type ExportColumnListProps = {
  items: ExportColumnItem[];
  onToggle: (index: number, selected: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onLabelChange: (index: number, label: string) => void;
  disabled?: boolean;
};

export function ExportColumnList({
  items,
  onToggle,
  onMove,
  onLabelChange,
  disabled = false,
}: ExportColumnListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={`${item.source_type}:${item.key}`}
          className={`grid gap-3 rounded-lg border p-3 lg:grid-cols-[auto_120px_1fr_auto] lg:items-center ${item.selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
        >
          <Checkbox
            checked={item.selected}
            disabled={disabled}
            onCheckedChange={(checked) => onToggle(index, Boolean(checked))}
          />
          <Badge variant="outline" className="justify-center">
            {item.source_type}
          </Badge>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">{item.key}</p>
            <Input
              value={item.label}
              disabled={disabled}
              onChange={(event) => onLabelChange(index, event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={disabled || index === 0} onClick={() => onMove(index, -1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || index === items.length - 1}
              onClick={() => onMove(index, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
