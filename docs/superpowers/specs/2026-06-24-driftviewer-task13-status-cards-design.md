# Task 13 Design: Improved Status Cards

## 1. Goal

Enhance the status card strip with more useful at-a-glance metrics about the loaded file, visible channels, active filters, and current selection.

## 2. Proposed Approaches

### Approach A: Extend existing card array (recommended)

Keep the current `renderStatusCards` structure but add computed metrics to the cards array.

- **Pros**: minimal change; consistent with existing code; easy to maintain.
- **Cons**: cards may become crowded on very narrow screens (addressed with responsive CSS).

### Approach B: Separate cards into groups

Group cards by category: "Data", "View", "Filter".

- **Pros**: more organized.
- **Cons**: extra DOM and CSS complexity; overkill for six cards.

### Approach C: Sparkline mini-charts

Add tiny trend charts inside cards.

- **Pros**: visually rich.
- **Cons**: far beyond scope; unnecessary for this task.

**Recommendation**: Approach A.

## 3. Design

### 3.1 Metrics

`renderStatusCards` will render the following cards in order:

| Label | Value |
|-------|-------|
| Samples | `filteredSamples.length` |
| Duration | `${((last.t - first.t) / 1000).toFixed(1)}s` |
| Rate | `${(filteredSamples.length / durationSeconds).toFixed(1)} Hz` (when duration > 0) |
| Channels | `filter.visibleChannels.size` |
| Conditions | `filter.conditions.length` |
| Filtered | `${((filteredSamples.length / samples.length) * 100).toFixed(1)}%` (when samples.length > 0) |
| Raw | `samples.length` |

### 3.2 Empty state

If `samples.length === 0` (no file loaded), render only one card: `{ label: 'Samples', value: '0' }`. This avoids division by zero and keeps the strip clean.

### 3.3 Styling

Update `src/style.css`:

```css
.statusCards {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

## 4. Data flow

`renderStatusCards` already reads from `store.getState()`. No new store API is needed.

## 5. Testing

- Existing tests already verify the store/filter pipeline. No new unit tests are required for the UI itself.
- Manual smoke test: load a file and confirm all seven cards display plausible values. Change filters and confirm values update.

## 6. Files changed

- `src/ui.ts` – update `renderStatusCards`.
- `src/style.css` – update status card styles.

## 7. Out of scope

- Trend sparklines.
- Card grouping/sections.
- Click-to-filter interactions.
