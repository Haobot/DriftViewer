# Task 11 Design: Conditional Filter UI

## 1. Goal

Add a UI panel that lets users build a list of conditional filters. Each condition targets a channel with an operator and a numeric value. Multiple conditions can be combined with AND/OR. The conditions are stored in the store and applied by the existing `filterSamples` function.

## 2. Proposed Approaches

### Approach A: Render rows dynamically in `ui.ts` (recommended)

`createUI` adds a `renderConditions` function that builds DOM rows from `store.getState().filter.conditions`. Each row contains channel/operator/value/combine selects and a remove button. Changes rebuild the conditions array and call `store.setConditions`.

- **Pros**: consistent with existing `renderChannelList`; no extra template in HTML; state-driven.
- **Cons**: `ui.ts` grows slightly, but remains focused on UI.

### Approach B: Static template in `index.html`

Add a hidden template row in `index.html` and clone it when adding conditions.

- **Pros**: easier to style the row structure.
- **Cons**: splits logic across HTML and TS; harder to keep in sync.

### Approach C: Separate conditions module

Create `src/conditions-ui.ts` that owns the panel.

- **Pros**: keeps `ui.ts` smaller.
- **Cons**: extra module and wiring for a single panel; overkill at this stage.

**Recommendation**: Approach A.

## 3. Design

### 3.1 HTML

Add a conditions control group inside `#workspace > .controlsPanel`:

```html
<div class="controlGroup">
  <label>条件筛选</label>
  <div id="conditionList" class="conditionList"></div>
  <button id="addCondition" type="button">+ 添加条件</button>
</div>
```

### 3.2 `ui.ts` additions

- Get `#conditionList` and `#addCondition` elements.
- Add `renderConditions()`:
  - Clear the container.
  - For each condition in `state.filter.conditions`, create a row with:
    - `<select>` for channel (populated from `CHANNELS`).
    - `<select>` for operator (`==`, `!=`, `<`, `<=`, `>`, `>=`).
    - `<input type="number">` for value.
    - `<select>` for combine (`AND`, `OR`), hidden for the first row.
    - `<button type="button">×</button>` to remove the row.
  - Attach `input`/`change` listeners that rebuild the conditions array and call `store.setConditions(newConditions)`.
- Add `#addCondition` click handler that appends a default condition:
  ```typescript
  { channel: 'thr', op: '>', value: 0, combine: 'AND' }
  ```
  and calls `store.setConditions`.

### 3.3 Default conditions

When no conditions exist, show an empty list. The first condition's `combine` field is ignored by `filterSamples`, but the UI still stores it as `'AND'`.

### 3.4 Styling

Add minimal CSS in `src/style.css`:

```css
.conditionList { display: flex; flex-direction: column; gap: 8px; }
.conditionRow { display: flex; gap: 8px; align-items: center; }
.conditionRow select, .conditionRow input { padding: 4px 8px; border-radius: 4px; border: 1px solid #2b3441; background: #171c24; color: #e6e6e6; }
.conditionRow button { background: transparent; border: none; color: #ff6b6b; cursor: pointer; }
```

## 4. Data flow

```
User adds/changes/removes condition row
        ↓
ui.ts rebuilds Condition[]
        ↓
store.setConditions(conditions)
        ↓
store recomputes filteredSamples
        ↓
render() updates chart and status cards
```

## 5. Testing

- Manual smoke test: add a condition like `thr > 50`, confirm chart and status cards update.
- Existing `filter.test.ts` already covers condition evaluation logic; no new unit tests required for the UI itself.

## 6. Files changed

- `index.html` – add conditions control group.
- `src/ui.ts` – add `renderConditions`, expose it, and wire add/remove/change handlers.
- `src/style.css` – add conditions panel styles.

## 7. Out of scope

- Expression parser / free-text input.
- Validation messages for invalid values.
- Preset condition templates.
