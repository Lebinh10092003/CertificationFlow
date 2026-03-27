import type { SourcePdfBatch } from "../../../lib/types";

type BatchFilterProps = {
  batches: SourcePdfBatch[];
  selectedBatchId: number | null;
  onChange: (batchId: number | null) => void;
  label?: string;
  allLabel?: string;
  disabled?: boolean;
};

function formatBatchLabel(batch: SourcePdfBatch) {
  const createdAt = new Date(batch.created_at).toLocaleString();
  return `${batch.original_filename} | ${batch.status} | ${createdAt}`;
}

export function BatchFilter({
  batches,
  selectedBatchId,
  onChange,
  label = "Uploaded file",
  allLabel = "All uploaded files",
  disabled = false,
}: BatchFilterProps) {
  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <select
        className="w-full rounded-md border px-3 py-2 text-sm"
        value={selectedBatchId ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">{allLabel}</option>
        {batches.map((batch) => (
          <option key={batch.id} value={batch.id}>
            {formatBatchLabel(batch)}
          </option>
        ))}
      </select>
    </label>
  );
}
