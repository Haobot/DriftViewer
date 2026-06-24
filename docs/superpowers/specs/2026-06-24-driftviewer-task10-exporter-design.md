# Task 10 Design: Exporter Module

## 1. Goal

Implement a pure TypeScript module that builds a new `mus4-tub.json` fragment from the original file metadata and the currently filtered samples. The module is testable and has no UI dependencies.

## 2. Proposed Approaches

### Approach A: Pure builder function (recommended)

`src/exporter.ts` exports `buildExportPackage(original, samples)` which returns a `Mus4Tub` object.

- **Pros**: trivially testable; no browser APIs; reusable for download, preview, or future server-side use.
- **Cons**: caller must handle serialization and download.

### Approach B: Builder + downloader in one module

`src/exporter.ts` exports both `buildExportPackage` and `downloadExport(data, filename)`.

- **Pros**: convenient for the UI.
- **Cons**: mixes pure data transformation with DOM/blob logic; harder to unit test the download side.

### Approach C: Inline export in `main.ts`

Build the JSON directly where the export button handler lives.

- **Pros**: no new module.
- **Cons**: untestable, duplicated logic, violates separation of concerns.

**Recommendation**: Approach A. Keep the exporter focused on data transformation; the download trigger belongs in the UI layer (Task 12).

## 3. Design

### 3.1 API

```typescript
export function buildExportPackage(
  original: Mus4Tub,
  samples: Sample[]
): Mus4Tub;
```

### 3.2 Behavior

- If `samples.length === 0`, throw `Error('No samples to export')`.
- Return a shallow copy of `original` with these fields overwritten:
  - `started_ms`: `samples[0].t`
  - `stopped_ms`: `samples[samples.length - 1].t`
  - `count`: `samples.length`
  - `samples`: the provided samples array (by reference; treat as read-only)

All other metadata (`schema`, `source`, etc.) is preserved unchanged.

### 3.3 Example

```typescript
const original = {
  schema: 'mus4.web_data_point.tub.v1',
  source: 'mus4-web-console',
  started_ms: 0,
  stopped_ms: 100,
  count: 11,
  samples: [...],
};

const filtered = original.samples.slice(2, 6);
const result = buildExportPackage(original, filtered);
// result.started_ms === filtered[0].t
// result.stopped_ms === filtered[filtered.length - 1].t
// result.count === 4
// result.schema === original.schema
```

## 4. Testing

Create `src/__tests__/exporter.test.ts` with:

1. **Happy path**: verify metadata is preserved and bounds/count are recomputed.
2. **Empty samples**: verify it throws.
3. **Single sample**: verify `started_ms === stopped_ms === sample.t` and `count === 1`.

## 5. Files changed

- `src/exporter.ts` – new file.
- `src/__tests__/exporter.test.ts` – new file.

## 6. Out of scope

- Download trigger / Blob / anchor tag logic (Task 12).
- Export preview UI (Task 13).
- CSV or other output formats.
