# Import And Export Mapping Design

## Goal

Add two operator-controlled flows to the existing certificate website:

- per-run Excel import mapping with support for multi-sheet workbooks and no-header files
- per-run export column builder with formatted Excel output

The design must preserve the current batch-centric certificate workflow and must not introduce long-lived mapping templates.

## Scope

- Inspect uploaded `.xlsx`, `.xls`, and `.csv` files before importing.
- Let the operator choose which workbook sheets to import.
- Use one shared mapping across all selected sheets.
- If a sheet has no header row, expose columns as `A`, `B`, `C`, `D`, and so on.
- Import mapped data into the current participant/enrollment/result models and rematch certificates afterward.
- Prepare exportable columns per certificate batch from both imported source columns and system-generated fields.
- Let the operator select, order, and relabel export columns each time they export.
- Generate a business-ready workbook with clear formatting, filters, freeze panes, and clickable links.

## Non-Goals

- No persistent mapping templates per competition.
- No per-sheet custom mapping inside the same import run.
- No automatic merge rule builder chosen by end users.
- No branding-heavy Excel layout with merged cells, logos, or certificate-like artwork.

## Current State

- Import currently starts immediately after file upload and relies on hard-coded header aliases.
- Export currently emits all discovered source columns plus `Drive Link` and `Public Link`.
- Google Sheet write-back already supports loading existing headers and appending missing target columns.
- Matching currently uses fixed backend rules: certificate code first, then exact name + grade + competition code, then fuzzy name with weighted grade, subject, school, and award checks.

## Design Decisions

### 1. Import Is A Two-Step Wizard

Each import run is split into:

1. `Inspect`
2. `Execute`

The inspect step uploads the file and reads workbook structure only. It does not create participants, enrollments, or results.

The execute step receives:

- the inspected file reference
- selected sheet names
- whether headers are present
- one shared mapping object

This keeps imports explicit and prevents accidental writes before the operator validates structure.

### 2. Headerless Files Use Column Letters

If a sheet does not have a header row, the backend exposes synthetic column identifiers using Excel-style letters:

- `A`
- `B`
- `C`
- `D`

Preview rows still show real values so the operator can map fields visually.

When import executes, the selected letters are translated back into positional indexes against each chosen sheet.

### 3. One Shared Mapping Across Selected Sheets

The operator can choose multiple sheets from the same workbook, but they all share one mapping object for that run.

Supported target fields:

- `student_id`
- `student_name`
- `email`
- `school_name`
- `grade`
- `competition`
- `award`
- `certificate_code`
- `qualified_round`
- `notes`

`student_name` is required. Other fields remain optional.

If any selected sheet does not satisfy the mapping, the execute request fails validation before writing to the database.

### 4. Export Uses A Per-Run Column Builder

Each export is prepared from a chosen `SourcePdfBatch`.

The backend returns two column groups:

- `source_columns`
  - union of all keys seen in imported `source_data_json` rows linked to matched records in the batch
- `system_columns`
  - generated fields available even if the original source file never had them

Initial system columns:

- `Drive Link`
- `Public Link`
- `Extracted Name`
- `Extracted School`
- `Extracted Grade`
- `Certificate Code`
- `Matched Student`
- `Matched Email`
- `Confidence`
- `Page Number`
- `Batch File`
- `Award`
- `Competition`
- `Qualified Round`

The operator can:

- include or exclude columns
- change output order
- override header labels for the export file only
- choose whether the workbook is split by competition code or combined into one sheet

### 5. Workbook Output Prioritizes Business Readability

The generated workbook should be easy to scan, filter, sort, and share.

Default formatting:

- Font: `Calibri` size `11`
- Header row:
  - bold
  - white text
  - dark blue fill
  - centered horizontally and vertically
  - wrap enabled
  - taller row height
- Data rows:
  - thin borders
  - vertical alignment middle
  - wrap enabled for long text
  - light zebra striping
- Worksheet presentation:
  - freeze header row
  - enable autofilter
  - auto-size columns within min and max width limits
  - hyperlink formatting for `Drive Link` and `Public Link`

Format modes:

- `business`
  - default mode
- `compact`
  - tighter rows, less wrapping
- `presentation`
  - wider columns and stronger header styling

### 6. No Persistent Mapping Templates

Import mappings and export column selections are not stored as reusable competition settings.

They live only for the current run:

- import mapping tied to the inspected upload
- export column config sent with the export request

This matches the operator requirement to re-choose columns each time.

## Backend Changes

### Import Inspection

Add a new inspect flow under data imports:

- `POST /api/competitions/{competition_id}/import-file/inspect/`

Request:

- multipart file upload
- optional `has_header` hint, if later needed

Response:

- inspected file id or draft import job id
- file type
- workbook summary
- per-sheet metadata:
  - `name`
  - `row_count`
  - `column_count`
  - `detected_has_header`
  - `columns`
  - `preview_rows`

Implementation notes:

- `.csv` is treated as one synthetic sheet
- `.xlsx/.xls` inspect all sheets
- header detection can use a pragmatic heuristic:
  - first row mostly text
  - low repetition
  - not dominated by empty cells
- if the operator overrides header presence in the UI, execute should use the explicit value provided there

### Import Execution

Add:

- `POST /api/competitions/{competition_id}/import-file/execute/`

Request:

- inspected upload id
- `selected_sheets`
- `has_header`
- shared `mapping`

Execution flow:

1. reopen stored upload
2. read only selected sheets
3. normalize rows using either header names or positional column letters
4. produce canonical row dictionaries matching the current import service contract
5. call import pipeline
6. rematch certificate pages
7. return final `DataImportJob`

Validation:

- require at least one selected sheet
- require `student_name`
- ensure mapped source column exists in every selected sheet
- reject duplicate target assignments when they create ambiguity

### Export Column Inspection

Add:

- `GET /api/certificate-batches/{batch_id}/export-columns/`

Response:

- `source_columns`
- `system_columns`
- suggested defaults
- available `sheet_modes`
- available `format_modes`

Suggested defaults should prefer:

- original workbook order when source columns exist
- then append `Drive Link` and `Public Link`
- then append a minimal system audit set

### Export Execution

Replace the fixed export behavior with a configurable request:

- `POST /api/certificate-batches/{batch_id}/export/`

Request:

- `columns`
  - ordered list of `{key, label, source_type}`
- `sheet_mode`
  - `split_by_competition`
  - `single_sheet`
- `format_mode`
  - `business`
  - `compact`
  - `presentation`

Response:

- Excel file download

The existing GET export endpoint can either:

- remain as a backward-compatible default export
- or be replaced by POST if the frontend is the only consumer

Recommended approach:

- keep GET as simple default export for compatibility
- add POST for configurable export builder

### Data Import Job Reuse

Reuse `DataImportJob` to store inspected uploads and audit the flow.

Recommended update:

- add a draft-like status or metadata flag indicating the file has been uploaded but not executed
- reuse the existing `source_file`
- populate final counts only at execute time

This avoids introducing a new temporary upload model.

## Frontend Changes

### Student Import Panel

Convert the current panel into a two-step wizard:

1. Upload and inspect
2. Sheet selection and mapping

UI capabilities:

- show workbook sheet list
- show preview table
- toggle `has header`
- if no header, show columns as `A`, `B`, `C`, `D`
- shared mapping dropdowns for all selected sheets
- validation messages before execute

Auto-suggestion:

- if a detected header matches a known alias, preselect that mapping target
- if confidence is low, leave blank

### Drive / Delivery Page

Add export preparation controls:

- `Prepare Export`
- column chooser
- order controls
- label editor
- format mode selector
- sheet mode selector

The export UI should open in a drawer or modal so it stays scoped to the selected batch.

## Matching And Merge Logic

User-selected import mapping determines how source rows become canonical fields before insertion.

After normalization, merge behavior remains backend-controlled and stable:

1. exact `certificate_code`
2. exact normalized `student_name + grade + competition`
3. fuzzy fallback weighted by grade, competition, school, and award

This keeps import flexibility high while preserving predictable matching behavior.

## Error Handling

Import inspect:

- reject unsupported file types
- return friendly errors for unreadable sheets or corrupted workbooks

Import execute:

- fail fast if selected sheet list is empty
- fail fast if required mapping is missing
- fail fast if a selected mapping source does not exist in all selected sheets

Export inspect:

- return empty source columns if the batch has no matched import-backed rows
- still expose system columns

Export execute:

- reject empty column selection
- allow duplicate labels but warn in UI
- if a requested source column is missing on some rows, export blank cells

## Testing

Backend tests should cover:

- workbook inspect for header and no-header sheets
- synthetic `A/B/C...` column generation
- multi-sheet selection with one shared mapping
- import execution using shared mapping
- validation when mapping is missing from one selected sheet
- export column inspection returning source + system columns
- configurable export preserving column order and labels
- workbook formatting expectations:
  - header style
  - freeze panes
  - autofilter
  - hyperlink cells

Frontend checks should cover:

- import wizard flow
- sheet selection
- header toggle
- mapping validation
- export builder selection and ordering
- export trigger against selected batch

## Risks

- Header detection can be wrong on messy workbooks.
  - Mitigation: operator can override header presence before execute.

- One shared mapping across selected sheets can be invalid if workbook structures differ.
  - Mitigation: validate all selected sheets against the chosen mapping before import.

- Unioning source columns for export can surface too many columns on messy imports.
  - Mitigation: export builder starts with sensible defaults and lets the operator trim aggressively.

## Implementation Summary

The implementation should add a reusable inspect-normalize-execute import pipeline and a reusable inspect-configure-export pipeline. Both flows stay operator-driven, batch-safe, and temporary by design.
