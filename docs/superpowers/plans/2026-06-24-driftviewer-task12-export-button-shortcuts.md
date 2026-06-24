> # Task 12: Export Button and Keyboard Shortcuts

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Export button that downloads the filtered sample range, plus keyboard shortcuts for reset, export, and canceling chart selection.

**Architecture:** `src/exporter.ts` gains a `downloadExport` helper. `src/main.ts` coordinates the Export button, builds the package with `buildExportPackage`, and handles global keyboard shortcuts. `src/chart.ts` exposes `cancelDrag` for the Escape key.

**Tech Stack:** TypeScript, native DOM APIs, CSS

---

## File structure

| File | Responsibility |
|------|----------------|
| `index.html` | Export button markup |
| `src/exporter.ts` | `downloadExport` helper |
| `src/chart.ts` | `cancelDrag` method |
| `src/main.ts` | Wire Export button and keyboard shortcuts |
| `src/style.css` | Export button styles |

---

### Task 1: Add Export Button to Header

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert export button**

Inside `.header`, after the `.fileButton` label, add:

```html
<button id="exportBtn" type="button" class="exportBtn">导出</button>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(html): add export button"
```

---

### Task 2: Add `downloadExport` Helper

**Files:**
- Modify: `src/exporter.ts`

- [ ] **Step 1: Implement `downloadExport`**

Add after `buildExportPackage`:

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

- [ ] **Step 2: Commit**

```bash
git add src/exporter.ts
git commit -m "feat(exporter): add downloadExport helper"
```

---

### Task 3: Add `cancelDrag` to Chart

**Files:**
- Modify: `src/chart.ts`

- [ ] **Step 1: Expose `cancelDrag`**

Add `cancelDrag` to the returned API:

```typescript
return {
  resize,
  draw,
  onRangeSelect: (callback: (startMs: number, endMs: number) => void) => {
    rangeCallback = callback;
    return () => { rangeCallback = null; };
  },
  destroy: () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  },
  cancelDrag: () => { isDragging = false; },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/chart.ts
git commit -m "feat(chart): add cancelDrag method"
```

---

### Task 4: Wire Export Button and Keyboard Shortcuts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Import `downloadExport`**

```typescript
import { buildExportPackage, downloadExport } from './exporter';
```

- [ ] **Step 2: Get Export button**

After `const canvas = ...`:

```typescript
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
```

- [ ] **Step 3: Add `doExport` function**

Inside `initApp`, before the `render` function:

```typescript
function doExport() {
  const state = store.getState();
  if (!state.original || state.filteredSamples.length === 0) return;
  const data = buildExportPackage(state.original, state.filteredSamples);
  downloadExport(data);
}
```

- [ ] **Step 4: Wire button click**

After `store.subscribe(render);`:

```typescript
exportBtn.addEventListener('click', doExport);
```

- [ ] **Step 5: Add keyboard shortcuts**

After the button click listener:

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

- [ ] **Step 6: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): wire export button and keyboard shortcuts"
```

---

### Task 5: Style Export Button

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add styles**

Append:

```css
.exportBtn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.exportBtn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat(style): add export button styles"
```

---

### Task 6: Verify End-to-End

**Files:**
- All of the above

- [ ] **Step 1: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Load a file, click Export, verify downloaded JSON. Test `R`, `Ctrl+E`, and `Esc`.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat: add export button and keyboard shortcuts"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 12 design doc is covered:
  - Export button markup → Task 1
  - Download helper → Task 2
  - cancelDrag → Task 3
  - Button/shortcut wiring → Task 4
  - Styles → Task 5
  - Verification → Task 6
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: `cancelDrag` returns `void`; `downloadExport` signature matches design.
