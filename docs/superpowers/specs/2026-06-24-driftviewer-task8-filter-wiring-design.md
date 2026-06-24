# Task 8 Design: Wire `filterSamples` into the Main Data Flow

## 1. Goal

Make the time-range slider, visible-channel toggles, and future conditional filters actually affect the rendered chart and status cards. Today `src/main.ts` passes raw `state.samples` to `chart.draw`, and `src/ui.ts` status cards also read raw samples, so filters have no visual effect.

## 2. Proposed Approaches

### Approach A: Compute filtered data inside the Store (recommended)

The store owns both the raw samples and the filter state, so it is the natural place to derive `filteredSamples`. Every setter that changes `samples` or `filter` recomputes `filteredSamples` and notifies subscribers.

- **Pros**: single source of truth; chart, status cards, and future exporter all consume the same derived data; easy to test by reading `store.getState().filteredSamples`.
- **Cons**: recomputes the filter on every state change, including channel visibility changes (which do not affect sample filtering). Negligible for the target file sizes (< 20k samples).

### Approach B: Compute filtered data in the render function

`render()` calls `filterSamples(state.samples, state.filter)` and passes the result to chart and status cards.

- **Pros**: minimal store changes; no derived state to keep in sync.
- **Cons**: every subscriber and every future consumer has to remember to filter; duplicated logic and risk of inconsistency (e.g. exporter might use raw samples by mistake).

### Approach C: Memoized selector

Add a `selectFilteredSamples(state)` utility that memoizes by filter identity.

- **Pros**: performance guarantee.
- **Cons**: over-engineered for current scale; adds caching complexity before there is a measured need.

**Recommendation**: Approach A. It keeps the data flow explicit and prevents consumers from accidentally using raw samples.

## 3. Design

### 3.1 State shape

`AppState` gains one derived field:

```typescript
export interface AppState {
  original: Mus4Tub | null;
  samples: Sample[];
  filter: FilterState;
  filteredSamples: Sample[];
}
```

`filteredSamples` is always the result of `filterSamples(state.samples, state.filter)`.

### 3.2 Store changes

- Initialise `filteredSamples` to `[]`.
- After every mutation of `samples` or `filter`, recompute `filteredSamples` and then notify listeners.
- `getState` returns `filteredSamples` by reference (treat as read-only).

### 3.3 Rendering changes

In `src/main.ts`:

```typescript
chart.draw(state.filteredSamples, visible);
```

instead of `chart.draw(state.samples, visible)`.

### 3.4 Status card changes

In `src/ui.ts` `renderStatusCards`:

- Use `state.filteredSamples` for the `Samples` and `Duration` cards.
- Add a `Filtered` card showing the count of filtered samples.
- Update `rangeInfo.textContent` to show the current filtered sample count and time range.

### 3.5 Data flow

```
User interaction (slider / checkbox / condition)
        ↓
store.setTimeRange / setVisibleChannels / setConditions
        ↓
store recomputes filteredSamples = filterSamples(samples, filter)
        ↓
listeners notified → render()
        ↓
chart.draw(filteredSamples, visibleChannels)
ui.renderStatusCards(filteredSamples)
```

## 4. Testing

- Update existing filter tests if necessary (none expected).
- Add a store test verifying that `filteredSamples` is recomputed when `setTimeRange` or `setConditions` is called.
- Run full test suite: `npm test`.
- Manual smoke test: load a sample file, move the time slider, confirm the chart and status cards update.

## 5. Files changed

- `src/types.ts` – add `filteredSamples` to `AppState`.
- `src/store.ts` – derive and expose `filteredSamples`.
- `src/main.ts` – use `state.filteredSamples` for the chart.
- `src/ui.ts` – use `state.filteredSamples` for status cards and `rangeInfo`.
- `src/__tests__/store.test.ts` – new store tests (if not present, create).

## 6. Out of scope

- Performance optimisation or memoisation (to be revisited if profiling shows a need).
- Conditional-filter UI (Task 11).
- Mouse range selection (Task 9).
- Exporter wiring (Task 10 / 12).
