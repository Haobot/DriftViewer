> # Task 11: Conditional Filter UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a UI panel for building conditional filters that are applied to the sample data.

**Architecture:** The conditions panel is rendered by `createUI` in `src/ui.ts`. Each condition row contains channel, operator, value, and combine selects. Changes rebuild the `Condition[]` and call `store.setConditions`, which triggers `filterSamples` and re-renders the chart.

**Tech Stack:** TypeScript, native DOM APIs, CSS

---

## File structure

| File | Responsibility |
|------|----------------|
| `index.html` | Conditions control group markup |
| `src/ui.ts` | `renderConditions`, add/remove/change handlers |
| `src/style.css` | Conditions panel styles |

---

### Task 1: Add conditions markup to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert conditions control group**

Inside `#workspace > .controlsPanel`, after the channel group, add:

```html
<div class="controlGroup">
  <label>条件筛选</label>
  <div id="conditionList" class="conditionList"></div>
  <button id="addCondition" type="button" class="addCondition">+ 添加条件</button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(html): add conditional filter panel markup"
```

---

### Task 2: Implement `renderConditions` in `src/ui.ts`

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: Import `Condition` type**

```typescript
import type { Store } from './store';
import type { Condition } from './types'; // add this line
import { CHANNELS } from './channels';
import { loadFile, type LoadResult } from './loader';
```

- [ ] **Step 2: Get DOM elements**

After the existing element getters, add:

```typescript
const conditionList = document.getElementById('conditionList') as HTMLDivElement;
const addCondition = document.getElementById('addCondition') as HTMLButtonElement;
```

- [ ] **Step 3: Add helper to build conditions from DOM**

```typescript
const OPS: Condition['op'][] = ['==', '!=', '<', '<=', '>', '>='];
const COMBINES: Condition['combine'][] = ['AND', 'OR'];

function readConditions(): Condition[] {
  const rows = conditionList.querySelectorAll('.conditionRow');
  const conditions: Condition[] = [];
  rows.forEach((row) => {
    const channel = (row.querySelector('.condChannel') as HTMLSelectElement).value as Condition['channel'];
    const op = (row.querySelector('.condOp') as HTMLSelectElement).value as Condition['op'];
    const value = Number((row.querySelector('.condValue') as HTMLInputElement).value);
    const combine = (row.querySelector('.condCombine') as HTMLSelectElement).value as Condition['combine'];
    conditions.push({ channel, op, value: Number.isNaN(value) ? 0 : value, combine });
  });
  return conditions;
}
```

- [ ] **Step 4: Add `renderConditions` function**

```typescript
function renderConditions() {
  const conditions = store.getState().filter.conditions;
  conditionList.innerHTML = '';

  conditions.forEach((cond, index) => {
    const row = document.createElement('div');
    row.className = 'conditionRow';

    const channelSelect = document.createElement('select');
    channelSelect.className = 'condChannel';
    CHANNELS.forEach((ch) => {
      const opt = document.createElement('option');
      opt.value = ch.key;
      opt.textContent = ch.label;
      if (ch.key === cond.channel) opt.selected = true;
      channelSelect.appendChild(opt);
    });

    const opSelect = document.createElement('select');
    opSelect.className = 'condOp';
    OPS.forEach((op) => {
      const opt = document.createElement('option');
      opt.value = op;
      opt.textContent = op;
      if (op === cond.op) opt.selected = true;
      opSelect.appendChild(opt);
    });

    const valueInput = document.createElement('input');
    valueInput.className = 'condValue';
    valueInput.type = 'number';
    valueInput.value = String(cond.value);

    const combineSelect = document.createElement('select');
    combineSelect.className = 'condCombine';
    COMBINES.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (c === cond.combine) opt.selected = true;
      combineSelect.appendChild(opt);
    });
    combineSelect.hidden = index === 0;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      const next = readConditions();
      next.splice(index, 1);
      store.setConditions(next);
    });

    row.appendChild(channelSelect);
    row.appendChild(opSelect);
    row.appendChild(valueInput);
    row.appendChild(combineSelect);
    row.appendChild(removeBtn);

    const onChange = () => store.setConditions(readConditions());
    channelSelect.addEventListener('change', onChange);
    opSelect.addEventListener('change', onChange);
    valueInput.addEventListener('input', onChange);
    combineSelect.addEventListener('change', onChange);

    conditionList.appendChild(row);
  });
}
```

- [ ] **Step 5: Wire add-condition button**

After `resetRange.addEventListener(...)`, add:

```typescript
addCondition.addEventListener('click', () => {
  const next = readConditions();
  next.push({ channel: 'thr', op: '>', value: 0, combine: 'AND' });
  store.setConditions(next);
});
```

- [ ] **Step 6: Expose `renderConditions` and call it from render**

Update the return statement:

```typescript
return { renderChannelList, renderStatusCards, renderConditions, rangeInfo, updateRangeInputs, updateRangeValues };
```

In `src/main.ts`, the `render` function should also call `ui.renderConditions()`. (This will be done in Task 3.)

- [ ] **Step 7: Commit**

```bash
git add src/ui.ts
git commit -m "feat(ui): add conditional filter rendering and wiring"
```

---

### Task 3: Call `renderConditions` from `main.ts` and add styles

**Files:**
- Modify: `src/main.ts`
- Modify: `src/style.css`

- [ ] **Step 1: Update `render` in `src/main.ts`**

Add `ui.renderConditions();` after `ui.renderStatusCards();`:

```typescript
const render = () => {
  // ... existing render logic ...
  chart.draw(state.filteredSamples, visible);
  ui.renderChannelList();
  ui.renderStatusCards();
  ui.renderConditions();
  ui.updateRangeValues(state.filter.timeStartMs, state.filter.timeEndMs);
};
```

- [ ] **Step 2: Add styles to `src/style.css`**

Append:

```css
.conditionList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.conditionRow {
  display: flex;
  gap: 8px;
  align-items: center;
}

.conditionRow select,
.conditionRow input {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}

.conditionRow input { width: 80px; }

.conditionRow button {
  background: transparent;
  border: none;
  color: var(--red);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.addCondition {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}

.addCondition:hover { border-color: var(--accent); color: var(--accent); }
```

- [ ] **Step 3: Type-check and test**

```bash
npx tsc --noEmit
npm test
```

Expected: no errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/style.css
git commit -m "feat: render conditions panel and add styles"
```

---

### Task 4: Verify End-to-End

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

Load a sample file, add a condition like `thr > 50`, and confirm the chart and status cards update.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "feat: add conditional filter UI"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 11 design doc is covered:
  - HTML control group → Task 1
  - `renderConditions` in `ui.ts` → Task 2
  - Add/remove/change wiring → Task 2
  - Styles → Task 3
  - Render loop integration → Task 3
  - Verification → Task 4
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: Uses `Condition`, `Condition['op']`, and `Condition['combine']` from `src/types.ts`.
