# Task 9 Design: Mouse Drag Range Selection on Chart

## 1. Goal

Allow users to click and drag horizontally on the Canvas chart to define a new time range. The selected range updates the store (`setTimeRange`) and the time-slider inputs, and the chart re-renders to show only the selected interval.

## 2. Proposed Approaches

### Approach A: Chart owns drag interaction and emits `onRangeSelect` (recommended)

`createChart` attaches mouse listeners to the canvas, handles coordinate mapping, draws a live selection rectangle, and notifies `main.ts` via a callback when the drag ends.

- **Pros**: chart already knows padding and coordinate mapping; visual feedback lives with drawing logic; `main.ts` stays thin.
- **Cons**: slightly broadens `createChart`'s responsibility, but it remains focused on the canvas.

### Approach B: Interaction logic lives in `main.ts`

`main.ts` listens to `mousedown`/`mousemove`/`mouseup` on the canvas element and computes time from mouse coordinates.

- **Pros**: no changes to `chart.ts` API.
- **Cons**: duplicates coordinate mapping between `chart.ts` and `main.ts`; harder to keep visual feedback in sync; `main.ts` becomes more coupled to canvas internals.

### Approach C: Separate interaction module

Create a new `chart-interactions.ts` that wraps the canvas and chart.

- **Pros**: very clean separation.
- **Cons**: extra module and wiring for a single interaction; overkill at this stage.

**Recommendation**: Approach A. It keeps coordinate mapping and visual feedback together while exposing a simple callback to the application.

## 3. Design

### 3.1 `createChart` API

Add an `onRangeSelect` method:

```typescript
export interface ChartController {
  resize: () => void;
  draw: (samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max }>) => void;
  onRangeSelect: (callback: (startMs: number, endMs: number) => void) => () => void;
}
```

`createChart` returns `ChartController`.

### 3.2 Drag behavior

- **Start**: on `mousedown` inside the plot area, record `startX` (CSS pixel, clamped to plot area) and set `isDragging = true`.
- **Move**: on `mousemove` while dragging:
  - Clamp current X to plot area.
  - Call the registered callback with the current `(startMs, endMs)` so consumers can update inputs live if desired.
  - Request a redraw that overlays a semi-transparent selection rectangle between `startX` and `currentX`.
- **End**: on `mouseup` (and `mouseleave`):
  - If the drag moved less than a small threshold (e.g. 4 px), treat it as a click and ignore.
  - Otherwise, call the callback with the final `(startMs, endMs)`.
  - Clear `isDragging`.

### 3.3 Coordinate mapping

Map a CSS pixel X coordinate to milliseconds using the **currently rendered samples'** time span:

```typescript
function xToTimeMs(x: number, samples: Sample[], plotArea: PlotArea): number {
  const tStart = samples[0].t;
  const tEnd = samples[samples.length - 1].t;
  const ratio = (x - plotArea.left) / plotArea.width;
  return tStart + ratio * (tEnd - tStart);
}
```

This matches the existing `drawSeries` mapping.

### 3.4 Visual feedback

During dragging, the chart draws the last full frame plus a vertical selection band:

```typescript
ctx.fillStyle = 'rgba(92, 200, 255, 0.15)';
ctx.fillRect(Math.min(startX, currentX), padding.top, Math.abs(currentX - startX), plotHeight);
ctx.strokeStyle = 'rgba(92, 200, 255, 0.6)';
ctx.strokeRect(Math.min(startX, currentX), padding.top, Math.abs(currentX - startX), plotHeight);
```

### 3.5 Wiring in `main.ts`

```typescript
chart.onRangeSelect((startMs, endMs) => {
  store.setTimeRange(Math.min(startMs, endMs), Math.max(startMs, endMs));
});
```

Because `store.subscribe(render)` already exists, the chart will redraw with the filtered subset automatically.

### 3.6 Updating slider inputs

`createUI` currently has a private `updateRangeInputs`. Expose it so `main.ts` can update the sliders when the store changes (e.g. from mouse selection):

```typescript
return { renderChannelList, renderStatusCards, rangeInfo, updateRangeInputs };
```

In `main.ts` `render()`:

```typescript
ui.updateRangeInputs(state.filteredSamples);
```

This keeps inputs in sync regardless of whether the range came from sliders, mouse selection, or keyboard reset.

## 4. Edge cases

| Scenario | Handling |
|----------|----------|
| No samples loaded | Ignore mouse events. |
| Drag outside plot area | Clamp X to plot area bounds. |
| Very small drag (< 4 px) | Ignore; treat as click. |
| Drag ends with start > end | Normalize before calling `setTimeRange`. |
| Window resized during drag | Re-clamp on each move; selection lives in CSS pixels. |

## 5. Testing

- **Unit test for coordinate mapping**: Extract `xToTimeMs` into a pure helper and test it with known samples.
- **DOM event integration test**: Dispatch `mousedown`/`mousemove`/`mouseup` on the canvas, assert that the callback receives the expected time range.
- **Manual smoke test**: Load a file, drag on the chart, confirm sliders and status cards update.

## 6. Files changed

- `src/chart.ts` – add drag handling, selection overlay, and `onRangeSelect`.
- `src/main.ts` – wire `onRangeSelect` to store; update slider inputs in render.
- `src/ui.ts` – expose `updateRangeInputs`.
- `src/__tests__/chart.test.ts` – new tests for chart interactions.

## 7. Out of scope

- Tooltip on hover (Task 13).
- Zoom/pan with wheel (future optimization).
- Keyboard shortcuts for range reset (Task 12).
