# Task 8: Wire filterSamples into Main Data Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the time-range slider, visible-channel toggles, and conditional filters affect the rendered chart and status cards by deriving `filteredSamples` in the store.

**Architecture:** The store owns raw samples and filter state; it derives `filteredSamples = filterSamples(samples, filter)` after every relevant mutation and exposes it through `getState`. The renderer and UI consume `state.filteredSamples` exclusively, eliminating any chance of drawing raw data.

**Tech Stack:** TypeScript, Vitest

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/types.ts` | `AppState` shape |
| `src/store.ts` | Derive and expose `filteredSamples` |
| `src/__tests__/store.test.ts` | Store behavior tests |
| `src/main.ts` | Pass `filteredSamples` to chart |
| `src/ui.ts` | Use `filteredSamples` in status cards and range info |

---

### Task 1: Add `filteredSamples` to `AppState`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Update `AppState` interface**

```typescript
export interface AppState {
  original: Mus4Tub | null;
  samples: Sample[];
  filter: FilterState;
  filteredSamples: Sample[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "types: add filteredSamples to AppState"
```

---

### Task 2: Derive `filteredSamples` in the Store

**Files:**
- Modify: `src/store.ts`

- [ ] **Step 1: Import `filterSamples`**

```typescript
import { filterSamples } from './filter';
```

- [ ] **Step 2: Add helper to recompute derived state**

Inside `createStore`, before returning the API:

```typescript
const recompute = () => {
  state.filteredSamples = filterSamples(state.samples, state.filter);
};
recompute();
```

- [ ] **Step 3: Call `recompute()` before notifying in every setter**

Update `setOriginal`, `setTimeRange`, `setVisibleChannels`, and `setConditions` so the derived array is always fresh before listeners run:

```typescript
setOriginal: (data: Mus4Tub, samples: Sample[]) => {
  state.original = data;
  state.samples = samples;
  if (samples.length > 0) {
    state.filter.timeStartMs = samples[0].t;
    state.filter.timeEndMs = samples[samples.length - 1].t;
  }
  recompute();
  listeners.forEach((fn) => fn());
},
setTimeRange: (start: number, end: number) => {
  state.filter.timeStartMs = start;
  state.filter.timeEndMs = end;
  recompute();
  listeners.forEach((fn) => fn());
},
setVisibleChannels: (channels: Set<ChannelKey>) => {
  state.filter.visibleChannels = channels;
  recompute();
  listeners.forEach((fn) => fn());
},
setConditions: (conditions: FilterState['conditions']) => {
  state.filter.conditions = conditions;
  recompute();
  listeners.forEach((fn) => fn());
},
```

- [ ] **Step 3: Commit**

```bash
git add src/store.ts
git commit -m "feat(store): derive filteredSamples on every mutation"
```

---

### Task 3: Test Store-Derived Filtering

**Files:**
- Create: `src/__tests__/store.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../store';
import type { Sample } from '../types';

const samples: Sample[] = [
  { seq: 1, t: 0, dt: 0, thr: 0, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
  { seq: 2, t: 10, dt: 10, thr: 50, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
  { seq: 3, t: 20, dt: 10, thr: 100, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
];

describe('createStore', () => {
  it('derives filteredSamples after setOriginal', () => {
    const store = createStore();
    store.setOriginal({ schema: 'v1', source: 'test', started_ms: 0, stopped_ms: 20, count: 3, samples }, samples);
    expect(store.getState().filteredSamples).toHaveLength(3);
  });

  it('recomputes filteredSamples when time range changes', () => {
    const store = createStore();
    store.setOriginal({ schema: 'v1', source: 'test', started_ms: 0, stopped_ms: 20, count: 3, samples }, samples);
    store.setTimeRange(0, 10);
    expect(store.getState().filteredSamples.map((s) => s.t)).toEqual([0, 10]);
  });

  it('notifies subscribers after filter recomputation', () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setOriginal({ schema: 'v1', source: 'test', started_ms: 0, stopped_ms: 20, count: 3, samples }, samples);
    expect(listener).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test and verify it passes**

```bash
npx vitest run src/__tests__/store.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/store.test.ts
git commit -m "test(store): add filteredSamples derivation tests"
```

---

### Task 4: Chart Consumes `filteredSamples`

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Pass `filteredSamples` to `chart.draw`**

```typescript
chart.draw(state.filteredSamples, visible);
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): draw filtered samples on chart"
```

---

### Task 5: Status Cards Use `filteredSamples`

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: Use filtered data in `renderStatusCards`**

```typescript
function renderStatusCards() {
  const state = store.getState();
  const samples = state.filteredSamples;
  statusCards.innerHTML = '';
  const cards = [
    { label: 'Samples', value: String(samples.length) },
    { label: 'Duration', value: samples.length > 1 ? `${((samples[samples.length - 1].t - samples[0].t) / 1000).toFixed(1)}s` : '0s' },
    { label: 'Raw', value: String(state.samples.length) },
  ];
  cards.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'statusCard';
    div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
    statusCards.appendChild(div);
  });

  if (rangeInfo) {
    const f = state.filteredSamples;
    rangeInfo.textContent = f.length > 0
      ? `${f.length} samples / ${((f[f.length - 1].t - f[0].t) / 1000).toFixed(1)}s`
      : '0 samples';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui.ts
git commit -m "feat(ui): show filtered sample count and duration"
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

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Load a sample `mus4-tub.json`, move the time-range sliders, toggle channels, and confirm:
- Chart updates to the selected range.
- Status cards show filtered sample count and duration.
- `rangeInfo` updates.

- [ ] **Step 4: Final commit (if any changes)**

```bash
git add -A
git commit -m "feat: wire filterSamples into main data flow" || echo "nothing to commit"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 8 design doc is covered:
  - State shape change → Task 1
  - Store derivation → Task 2
  - Rendering change → Task 4
  - Status card / rangeInfo change → Task 5
  - Tests → Task 3 and Task 6
- **Placeholder scan**: No TBD/TODO placeholders; every step includes exact code or commands.
- **Type consistency**: `filteredSamples` is added to `AppState` in Task 1 and consumed as `state.filteredSamples` in Tasks 4 and 5.
