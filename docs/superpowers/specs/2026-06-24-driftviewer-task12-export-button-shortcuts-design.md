> # Task 12 Design: Export Button and Keyboard Shortcuts

## 1. Goal

Add a visible Export button that downloads the currently filtered sample range as a `mus4-tub.json` file, plus keyboard shortcuts for common actions.

## 2. Proposed Approaches

### Approach A: Pure export helper in `exporter.ts`, wiring in `main.ts` (recommended)

Add `downloadExport(data, filename)` to `src/exporter.ts`. `main.ts` wires the Export button and keyboard shortcuts.

- **Pros**: keeps export logic together; `main.ts` remains the coordinator; easy to test the builder separately.
- **Cons**: `downloadExport` uses browser APIs, so it needs happy-dom or manual mocking for unit tests. We will skip unit tests for the download trigger itself.

### Approach B: Inline everything in `main.ts`

Build the package and trigger the download directly where the button and shortcuts are handled.

- **Pros**: no extra exports.
- **Cons**: mixes concerns; harder to reuse or test.

### Approach C: UI owns download trigger

`ui.ts` exports `bindExportButton(store)` that wires the click handler.

- **Pros**: UI owns UI.
- **Cons**: `ui.ts` depends on `buildExportPackage` and Blob logic, which is not strictly UI.

**Recommendation**: Approach A.

## 3. Design

### 3.1 Export button

Add to `index.html` header:

```html
<button id="exportBtn" type="button" class="exportBtn">导出</button>
```

### 3.2 Export logic

Extend `src/exporter.ts`:

```typescript
export function downloadExport(data: Mus4Tub, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `mus4-tub-${data.started_ms}-${data.stopped_ms}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

### 3.3 Wiring in `main.ts`

```typescript
import { buildExportPackage, downloadExport } from './exporter';

const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

function doExport() {
  const state = store.getState();
  if (!state.original || state.filteredSamples.length === 0) return;
  const data = buildExportPackage(state.original, state.filteredSamples);
  downloadExport(data);
}

exportBtn.addEventListener('click', doExport);
```

### 3.4 Keyboard shortcuts

In `main.ts`, add a `keydown` listener on `window`:

```typescript
window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    const state = store.getState();
    if (state.samples.length === 0) return;
    store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
    ui.updateRangeInputs(state.samples);
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
    e.preventDefault();
    doExport();
  }

  if (e.key === 'Escape') {
    chart.cancelDrag();
  }
});
```

### 3.5 Chart cancel drag

Add to `src/chart.ts`:

```typescript
return {
  resize,
  draw,
  onRangeSelect: (callback) => { ... },
  destroy: () => { ... },
  cancelDrag: () => { isDragging = false; },
};
```

## 4. Edge cases

| Scenario | Handling |
|----------|----------|
| No file loaded | Export button does nothing; shortcut does nothing. |
| Empty filtered result | `buildExportPackage` throws; guard before calling. |
| Browser blocks download | Standard anchor download behavior. |
| Multiple shortcut keys | Use `e.key` and modifier checks. |

## 5. Testing

- Manual smoke test: load file, set range, click Export, verify downloaded JSON.
- Manual shortcut test: press `R`, `Ctrl+E`, `Esc`.
- Existing exporter tests continue to cover `buildExportPackage`.

## 6. Files changed

- `index.html` – add Export button.
- `src/exporter.ts` – add `downloadExport`.
- `src/main.ts` – wire button and keyboard shortcuts.
- `src/chart.ts` – add `cancelDrag`.
- `src/style.css` – style Export button.

## 7. Out of scope

- Export preview dialog.
- Filename customization UI.
- Configurable keyboard shortcuts.
