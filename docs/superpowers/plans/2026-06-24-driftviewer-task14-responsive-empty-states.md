> # Task 14: Responsive Layout and Empty States

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the layout adapt to narrow viewports and add empty-state messaging and drop-zone feedback.

**Architecture:** A CSS media query stacks the chart above the controls on small screens. An empty-state element in the chart panel is shown when no samples are loaded. Drop-zone CSS classes are toggled during drag operations for visual feedback.

**Tech Stack:** TypeScript, native DOM APIs, CSS

---

## File structure

| File | Responsibility |
|------|----------------|
| `index.html` | Chart empty state markup |
| `src/main.ts` | Toggle chart empty state visibility |
| `src/ui.ts` | Drop-zone dragOver class toggling |
| `src/style.css` | Responsive layout, empty state, and drop-zone styles |

---

### Task 1: Add Chart Empty State Markup

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert empty state inside chart panel**

Inside `.chartPanel`, before the canvas, add:

```html
<div id="chartEmpty" class="chartEmpty" hidden>
  <div class="chartEmptyIcon">📈</div>
  <div class="chartEmptyTitle">暂无数据</div>
  <div class="chartEmptyHint">打开一个 mus4-tub.json 文件，或将文件拖拽到此处开始查看。</div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(html): add chart empty state markup"
```

---

### Task 2: Toggle Chart Empty State in `main.ts`

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Get empty state element**

After `const canvas = ...`, add:

```typescript
const chartEmpty = document.getElementById('chartEmpty') as HTMLDivElement;
```

- [ ] **Step 2: Toggle visibility in render**

At the top of the `render` function, add:

```typescript
const render = () => {
  const state = store.getState();
  chartEmpty.hidden = state.samples.length > 0;
  // ... existing render logic ...
};
```

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat(main): toggle chart empty state"
```

---

### Task 3: Add Drop Zone Drag Feedback in `ui.ts`

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: Toggle `dragOver` class**

Find the drop zone event listeners and update them:

```typescript
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragOver');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragOver');
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragOver');
  // ... existing drop logic ...
});
```

- [ ] **Step 2: Commit**

```bash
git add src/ui.ts
git commit -m "feat(ui): add dragOver feedback to drop zone"
```

---

### Task 4: Add Responsive CSS and Styles

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add chart empty state styles**

Append:

```css
.chartEmpty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: var(--muted);
  text-align: center;
  gap: 8px;
}

.chartEmpty[hidden] { display: none; }

.chartEmptyIcon { font-size: 40px; }

.chartEmptyTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.chartEmptyHint {
  font-size: 13px;
  max-width: 280px;
}
```

- [ ] **Step 2: Add drop zone drag-over style**

Find the `#dropZone` rule and add a `.dragOver` variant:

```css
#dropZone.dragOver {
  border-color: var(--accent);
  background: rgba(92, 200, 255, 0.08);
}
```

- [ ] **Step 3: Add responsive media query**

Append:

```css
@media (max-width: 900px) {
  #workspace {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  .chartPanel { order: 1; }
  .controlsPanel { order: 2; }
}

@media (max-width: 600px) {
  .header { padding: 12px 16px; }
  .header h1 { font-size: 20px; }
  .controlsPanel, .chartPanel { padding: 16px; }
  .fileButton, .exportBtn { padding: 6px 12px; font-size: 12px; }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "feat(style): responsive layout, empty state and drop zone styles"
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

- Confirm chart empty state is visible before loading a file.
- Load a file and confirm empty state disappears.
- Resize browser below 900px and confirm chart stacks above controls.
- Drag a file over the drop zone and confirm visual feedback.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat: responsive layout and empty states"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 14 design doc is covered:
  - Chart empty state markup → Task 1
  - Empty state toggle → Task 2
  - Drop zone feedback → Task 3
  - Responsive CSS and styles → Task 4
  - Verification → Task 5
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: `chartEmpty.hidden` is boolean; `dropZone.classList` is standard DOM API.
