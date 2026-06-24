> # Task 14 Design: Responsive Layout and Empty States

## 1. Goal

Make the application usable on smaller screens and provide clear empty-state messaging before any data is loaded.

## 2. Proposed Approaches

### Approach A: CSS media query + JS empty-state toggle (recommended)

Use a standard `@media` query to switch `#workspace` from a side-by-side layout to a stacked layout on narrow viewports. Use JavaScript to show/hide an empty-state overlay inside the chart panel when no file is loaded.

- **Pros**: simple, widely supported, easy to test by resizing the browser.
- **Cons**: fixed breakpoint; cannot respond to container width.

### Approach B: CSS Container Queries

Apply `container-type: inline-size` to `#workspace` and use `@container` rules.

- **Pros**: responds to the workspace container, not just viewport.
- **Cons**: less widely supported in older browsers; overkill for this project.

### Approach C: JavaScript-driven layout

Measure the workspace width in JS and toggle classes.

- **Pros**: precise control.
- **Cons**: unnecessary complexity; CSS media queries are sufficient.

**Recommendation**: Approach A.

## 3. Design

### 3.1 Responsive layout

`#workspace` currently uses CSS Grid with two columns. Add a media query:

```css
@media (max-width: 900px) {
  #workspace {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  .controlsPanel {
    order: 2;
  }
  .chartPanel {
    order: 1;
  }
}
```

Also reduce padding/header font sizes slightly:

```css
@media (max-width: 600px) {
  .header h1 { font-size: 20px; }
  .header { padding: 12px 16px; }
  .controlsPanel, .chartPanel { padding: 16px; }
}
```

### 3.2 Chart empty state

Add to `index.html` inside `.chartPanel`:

```html
<div id="chartEmpty" class="chartEmpty">
  <div class="chartEmptyIcon">📈</div>
  <div class="chartEmptyTitle">暂无数据</div>
  <div class="chartEmptyHint">打开一个 mus4-tub.json 文件，或将文件拖拽到此处开始查看。</div>
</div>
```

In `src/main.ts`, show/hide based on loaded state:

```typescript
const chartEmpty = document.getElementById('chartEmpty') as HTMLDivElement;

const render = () => {
  const state = store.getState();
  chartEmpty.hidden = state.samples.length > 0;
  // ... rest of render
};
```

Style `.chartEmpty` to be centered over the chart area:

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

.chartEmptyIcon { font-size: 40px; }
.chartEmptyTitle { font-size: 16px; font-weight: 700; color: var(--text); }
.chartEmptyHint { font-size: 13px; max-width: 280px; }
```

### 3.3 Drop zone feedback

The drop zone already handles `dragover`/`dragleave`/`drop`. Add a CSS class and visual feedback:

```css
#dropZone.dragOver {
  border-color: var(--accent);
  background: rgba(92, 200, 255, 0.08);
}
```

Update `src/ui.ts` drag handlers to toggle the class:

```typescript
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragOver');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragOver');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragOver');
  // ... existing logic
});
```

## 4. Data flow

No new store API needed. The empty state is driven by `state.samples.length`.

## 5. Testing

- Manual: resize browser to < 900px and confirm controls move below chart.
- Manual: load app without file and confirm chart empty state is visible.
- Manual: drag a file over drop zone and confirm visual feedback.

## 6. Files changed

- `index.html` – add chart empty state markup.
- `src/main.ts` – toggle empty state visibility in render.
- `src/ui.ts` – add/remove `dragOver` class on drop zone.
- `src/style.css` – responsive media queries and empty state/drop zone styles.

## 7. Out of scope

- Mobile-specific gestures.
- Full-screen chart mode.
- Animated transitions.
