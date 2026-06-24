# Task 9: Mouse Drag Range Selection on Chart

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users click and drag horizontally on the Canvas chart to select a time range, which updates the store and the time-slider inputs.

**Architecture:** The chart module owns drag interaction and coordinate mapping. It exposes `onRangeSelect(callback)` and draws a live selection overlay during dragging. `main.ts` wires the callback to `store.setTimeRange`. `ui.ts` exposes `updateRangeInputs` so `main.ts` can keep the sliders in sync when the range changes from any source.

**Tech Stack:** TypeScript, Vitest, jsdom (for DOM event tests)

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/ui.ts` | Expose `updateRangeInputs` so `main.ts` can sync sliders |
| `src/chart.ts` | Add drag handling, selection overlay, and `onRangeSelect` |
| `src/main.ts` | Wire `onRangeSelect` to store; call `ui.updateRangeInputs` in render |
| `src/__tests__/chart.test.ts` | Test coordinate helper and DOM drag events |

---

### Task 1: Expose `updateRangeInputs` from `createUI`

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: Update return object**

Change the return statement of `createUI` from:
```typescript
return { renderChannelList, renderStatusCards, rangeInfo };
```
to:
```typescript
return { renderChannelList, renderStatusCards, rangeInfo, updateRangeInputs };
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui.ts
git commit -m "feat(ui): expose updateRangeInputs for external sync"
```

---

### Task 2: Add `onRangeSelect` drag handling to `chart.ts`

**Files:**
- Modify: `src/chart.ts`

- [ ] **Step 1: Add helper types and coordinate mapping**

At the top of `createChart`, add:

```typescript
interface Point { x: number; y: number; }

const getMousePos = (e: MouseEvent): Point => {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

let lastSamples: Sample[] = [];
```

- [ ] **Step 2: Store samples on each draw**

Inside the `draw` function, before drawing:

```typescript
lastSamples = samples;
```

- [ ] **Step 3: Add selection drawing helper**

```typescript
const drawSelection = (startX: number, endX: number) => {
  const { padding, height } = config;
  const plotH = height - padding.top - padding.bottom;
  const left = Math.min(startX, endX);
  const width = Math.abs(endX - startX);
  ctx.save();
  ctx.fillStyle = 'rgba(92, 200, 255, 0.15)';
  ctx.strokeStyle = 'rgba(92, 200, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.fillRect(left, padding.top, width, plotH);
  ctx.strokeRect(left, padding.top, width, plotH);
  ctx.restore();
};
```

- [ ] **Step 4: Add drag state and listeners**

After `resize()`, add:

```typescript
let isDragging = false;
let dragStartX = 0;
let dragEndX = 0;
let rangeCallback: ((startMs: number, endMs: number) => void) | null = null;

const xToTimeMs = (x: number): number => {
  if (lastSamples.length < 2) return 0;
  const { padding, width } = config;
  const plotLeft = padding.left;
  const plotW = width - padding.left - padding.right;
  const tStart = lastSamples[0].t;
  const tEnd = lastSamples[lastSamples.length - 1].t;
  const ratio = clamp((x - plotLeft) / plotW, 0, 1);
  return tStart + ratio * (tEnd - tStart);
};

canvas.addEventListener('mousedown', (e) => {
  if (lastSamples.length < 2) return;
  const pos = getMousePos(e);
  isDragging = true;
  dragStartX = clamp(pos.x, config.padding.left, config.width - config.padding.right);
  dragEndX = dragStartX;
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const pos = getMousePos(e);
  dragEndX = clamp(pos.x, config.padding.left, config.width - config.padding.right);
  if (rangeCallback && Math.abs(dragEndX - dragStartX) > 4) {
    rangeCallback(xToTimeMs(dragStartX), xToTimeMs(dragEndX));
  }
  draw(lastSamples, visibleChannelsDuringDrag); // will be handled in Step 5
});

window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  if (Math.abs(dragEndX - dragStartX) > 4 && rangeCallback) {
    rangeCallback(xToTimeMs(dragStartX), xToTimeMs(dragEndX));
  }
});
```

Wait — the `mousemove` handler needs to redraw with the last visible channels. The current `draw` signature does not store visible channels. We will address this in the next step.

- [ ] **Step 5: Track visible channels and redraw with selection**

Add near `lastSamples`:

```typescript
let lastVisibleChannels: Map<ChannelKey, { color: string; min: number; max: number }> = new Map();
```

Update `draw`:

```typescript
const draw = (samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max: number }>) => {
  lastSamples = samples;
  lastVisibleChannels = visibleChannels;
  drawGrid();
  for (const [key, meta] of visibleChannels) {
    drawSeries(samples, key, meta.color, meta.min, meta.max);
  }
  if (isDragging) {
    drawSelection(dragStartX, dragEndX);
  }
};
```

Update the `mousemove` handler to call `draw(lastSamples, lastVisibleChannels);`.

- [ ] **Step 6: Add `onRangeSelect` to returned API**

```typescript
return {
  resize,
  draw,
  onRangeSelect: (callback: (startMs: number, endMs: number) => void) => {
    rangeCallback = callback;
    return () => { rangeCallback = null; };
  },
};
```

- [ ] **Step 7: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/chart.ts
git commit -m "feat(chart): add mouse drag range selection with live overlay"
```

---

### Task 3: Wire `onRangeSelect` in `main.ts` and update inputs in render

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Register callback**

After `const ui = createUI(store, render);`, add:

```typescript
chart.onRangeSelect((startMs, endMs) => {
  store.setTimeRange(Math.min(startMs, endMs), Math.max(startMs, endMs));
});
```

- [ ] **Step 2: Update slider inputs on every render**

Inside the `render` function, after drawing the chart, add:

```typescript
ui.updateRangeInputs(state.filteredSamples);
```

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): wire chart range selection to store and sync sliders"
```

---

### Task 4: Add Chart Interaction Tests

**Files:**
- Create: `src/__tests__/chart.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { createChart } from '../chart';
import type { Sample } from '../types';

const SAMPLE: Sample = {
  seq: 1, t: 0, dt: 0, thr: 0, str: 0, mode: 0, park: 0,
  ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000,
  rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0,
};

function makeSamples(count: number): Sample[] {
  return Array.from({ length: count }, (_, i) => ({ ...SAMPLE, seq: i + 1, t: i * 10 }));
}

describe('createChart', () => {
  it('calls onRangeSelect with normalized time range after drag', () => {
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 400, height: 360 } as DOMRect));
    const chart = createChart(canvas, {
      width: 400,
      height: 360,
      padding: { top: 20, right: 20, bottom: 30, left: 44 },
    });

    const samples = makeSamples(11); // t = 0..100
    chart.draw(samples, new Map());

    const callback = vi.fn();
    chart.onRangeSelect(callback);

    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 60, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, bubbles: true }));

    expect(callback).toHaveBeenCalled();
    const [startMs, endMs] = callback.mock.calls[callback.mock.calls.length - 1];
    expect(startMs).toBeLessThan(endMs);
    expect(startMs).toBeGreaterThanOrEqual(0);
    expect(endMs).toBeLessThanOrEqual(100);
  });

  it('ignores tiny drags', () => {
    const canvas = document.createElement('canvas');
    canvas.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 400, height: 360 } as DOMRect));
    const chart = createChart(canvas, {
      width: 400,
      height: 360,
      padding: { top: 20, right: 20, bottom: 30, left: 44 },
    });

    chart.draw(makeSamples(11), new Map());
    const callback = vi.fn();
    chart.onRangeSelect(callback);

    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 102, bubbles: true }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 102, bubbles: true }));

    expect(callback).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run chart tests**

```bash
npx vitest run src/__tests__/chart.test.ts
```

Expected: tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/chart.test.ts
git commit -m "test(chart): add mouse drag range selection tests"
```

---

### Task 5: Verify End-to-End

**Files:**
- All of the above

- [ ] **Step 1: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run full test suite**

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

Load a sample file, drag horizontally on the chart, and confirm:
- A semi-transparent selection rectangle appears during drag.
- The time-range sliders update to the selected interval.
- The chart and status cards re-render to the selected range.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat: add mouse drag range selection on chart"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 9 design doc is covered:
  - Chart owns drag interaction → Task 2
  - Live selection overlay → Task 2
  - `onRangeSelect` callback → Task 2
  - `main.ts` wiring to store → Task 3
  - Slider input sync → Tasks 1 and 3
  - Tests → Task 4
  - E2E verification → Task 5
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: `onRangeSelect` callback signature `(startMs: number, endMs: number) => void` is consistent throughout.
