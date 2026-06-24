> # Task 13: Improved Status Cards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add useful metrics to the status card strip and make the layout responsive.

**Architecture:** `renderStatusCards` in `src/ui.ts` computes metrics from `state.filteredSamples`, `state.samples`, `state.filter.visibleChannels`, and `state.filter.conditions`. The cards array is expanded and rendered into the existing `#statusCards` container. `src/style.css` updates the card container to wrap and gives each card a minimum width.

**Tech Stack:** TypeScript, native DOM APIs, CSS

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/ui.ts` | Compute and render status cards |
| `src/style.css` | Status card layout and styling |

---

### Task 1: Update `renderStatusCards` in `src/ui.ts`

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: Replace the card-building logic**

Find the `renderStatusCards` function and replace the card array with:

```typescript
function renderStatusCards() {
  const state = store.getState();
  const samples = state.filteredSamples;
  statusCards.innerHTML = '';

  let cards: { label: string; value: string }[];

  if (state.samples.length === 0) {
    cards = [{ label: 'Samples', value: '0' }];
  } else {
    const durationSeconds = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
    const rate = durationSeconds > 0 ? (samples.length / durationSeconds).toFixed(1) : '-';
    const filteredPercent = state.samples.length > 0
      ? `${((samples.length / state.samples.length) * 100).toFixed(1)}%`
      : '0%';

    cards = [
      { label: 'Samples', value: String(samples.length) },
      { label: 'Duration', value: durationSeconds > 0 ? `${durationSeconds.toFixed(1)}s` : '0s' },
      { label: 'Rate', value: `${rate} Hz` },
      { label: 'Channels', value: String(state.filter.visibleChannels.size) },
      { label: 'Conditions', value: String(state.filter.conditions.length) },
      { label: 'Filtered', value: filteredPercent },
      { label: 'Raw', value: String(state.samples.length) },
    ];
  }

  cards.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'statusCard';
    div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
    statusCards.appendChild(div);
  });
}
```

- [ ] **Step 2: Remove old rangeInfo update if still present**

If `renderStatusCards` still updates `rangeInfo.textContent`, move that logic to the end of the `render` function in `src/main.ts` instead (this keeps `renderStatusCards` focused on cards). If it is already elsewhere, leave it.

- [ ] **Step 3: Type-check and test**

```bash
npx tsc --noEmit
npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/ui.ts
git commit -m "feat(ui): add sampling rate, channels, conditions and filtered percent cards"
```

---

### Task 2: Update Status Card Styles

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Update `.statusCards` and `.statusCard`**

Find existing status card styles and replace with:

```css
.statusCards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.statusCard {
  flex: 1 1 100px;
  min-width: 90px;
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}

.statusCard .label {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}

.statusCard .value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat(style): make status cards responsive"
```

---

### Task 3: Verify End-to-End

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

Load a file and confirm all status cards display correctly. Resize the browser and confirm cards wrap.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat: improve status cards"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 13 design doc is covered:
  - New metrics → Task 1
  - Empty state → Task 1
  - Responsive layout → Task 2
  - Verification → Task 3
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: `renderStatusCards` uses the same store state shape as Tasks 8 and 11.
