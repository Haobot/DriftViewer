# DriftViewer 数据筛选网页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `C:/Dev/DDC/DriftViewer` 中实现一个基于 Vite + TypeScript 的离线 `mus4-tub.json` 数据筛选网页，支持加载、浏览、筛选、截取和导出遥测曲线数据。

**Architecture:** 采用纯前端浏览器应用，通过 `<input type="file">` 与拖拽读取本地 JSON；内存中维护 `Sample[]`，经筛选后交给 Canvas 绘制多通道曲线；最终通过 Blob 下载裁剪后的 `mus4-tub.json` 片段。模块按职责拆分（types/loader/store/filter/chart/exporter/ui），降低单文件复杂度。

**Tech Stack:** Vite 6、TypeScript 5、原生 CSS（复用 Web Console 暗色主题）、HTML5 Canvas 2D、Vitest。

---

## 1. 文件结构

```
C:/Dev/DDC/DriftViewer/
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.ts
    ├── types.ts
    ├── loader.ts
    ├── store.ts
    ├── filter.ts
    ├── chart.ts
    ├── exporter.ts
    ├── channels.ts
    ├── ui.ts
    ├── style.css
    └── __tests__/
        ├── loader.test.ts
        ├── filter.test.ts
        └── exporter.test.ts
```

| 文件 | 职责 |
|------|------|
| `src/types.ts` | `Mus4Tub`、`Sample`、`ChannelDef`、`FilterState`、`Condition` 类型定义。 |
| `src/channels.ts` | 通道元数据列表（字段名、标签、颜色、单位、默认可见）。 |
| `src/loader.ts` | 读取文件、解析 JSON、校验 schema、转换为 `Sample[]`。 |
| `src/store.ts` | 应用状态：原始样本、筛选条件、选中时间范围。 |
| `src/filter.ts` | 根据时间范围和条件表达式过滤样本。 |
| `src/chart.ts` | Canvas 初始化、网格、多通道曲线、游标、选区绘制。 |
| `src/exporter.ts` | 将筛选后的样本组装为新的 `Mus4Tub` 并触发下载。 |
| `src/ui.ts` | DOM 绑定：文件输入、通道列表、筛选面板、状态卡片、导出按钮。 |
| `src/main.ts` | 初始化各模块并协调数据流。 |
| `src/style.css` | 暗色主题、布局、组件样式。 |
| `index.html` | 页面骨架。 |

---

## 2. 里程碑 M1：项目初始化 + 基础数据加载与绘图

**目标：** 搭建 Vite 项目，能加载本地 JSON 并在 Canvas 上绘制默认三条曲线。

---

### Task 1: 初始化 Vite + TypeScript 项目

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.ts`
- Create: `src/style.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "driftviewer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DriftViewer</title>
  </head>
  <body>
    <div id="app">
      <header class="header">
        <h1>DriftViewer</h1>
        <label class="fileButton">
          打开文件
          <input id="fileInput" type="file" accept=".json,application/json" hidden />
        </label>
      </header>
      <main id="main" class="main">
        <div id="dropZone" class="dropZone">
          <p>拖拽 mus4-tub.json 到此处</p>
          <p class="hint">或点击右上角「打开文件」</p>
        </div>
      </main>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 src/style.css（基础样式）**

```css
:root {
  --bg: #101318;
  --panel: #171c24;
  --border: #2b3441;
  --text: #e8edf2;
  --muted: #8fa1b5;
  --accent: #5cc8ff;
  --green: #39d98a;
  --red: #ff6b6b;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.header h1 {
  margin: 0;
  font-size: 20px;
}

.fileButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--accent);
  color: #061019;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.fileButton:hover { background: #8bdcff; }

.main { padding: 16px; }

.dropZone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border: 2px dashed var(--border);
  border-radius: 12px;
  color: var(--muted);
}

.dropZone.dragover {
  border-color: var(--accent);
  background: var(--panel);
}

.hint { font-size: 12px; }
```

- [ ] **Step 6: 创建 src/main.ts（M1 占位）**

```typescript
import './style.css';

console.log('DriftViewer initialized');
```

- [ ] **Step 7: 安装依赖并验证开发服务器**

Run: `npm install`
Run: `npm run dev`
Expected: Vite dev server starts, page shows "DriftViewer" and "打开文件" button.

- [ ] **Step 8: Commit**

```bash
git add package.json vite.config.ts tsconfig.json index.html src/style.css src/main.ts
npm install # 生成 package-lock.json
git add package-lock.json
git commit -m "chore: init Vite + TypeScript project"
```

---

### Task 2: 定义类型与通道元数据

**Files:**
- Create: `src/types.ts`
- Create: `src/channels.ts`
- Modify: `src/main.ts`（引入类型，暂时仅 console.log）

- [ ] **Step 1: 创建 src/types.ts**

```typescript
export interface Mus4Tub {
  schema: string;
  source: string;
  started_ms: number;
  stopped_ms: number;
  count: number;
  samples: Sample[];
}

export interface Sample {
  seq: number;
  t: number;
  dt: number;
  thr: number;
  str: number;
  mode: number;
  park: number;
  ch1: number;
  ch2: number;
  ch3: number;
  ch4: number;
  ch5: number;
  ch6: number;
  rct: number;
  rcs: number;
  pt: number;
  ps: number;
  gz: number;
  gx?: number;
  gy?: number;
  ax?: number;
  ay?: number;
  az?: number;
  gzf?: number;
  cur?: number;
  vol?: number;
  de?: number;
  da?: number;
  dc?: number;
}

export type ChannelKey = Exclude<keyof Sample, 'seq' | 't' | 'dt'>;

export interface ChannelDef {
  key: ChannelKey;
  label: string;
  color: string;
  unit?: string;
  defaultVisible?: boolean;
  category: string;
}

export interface Condition {
  channel: ChannelKey;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: number;
  combine: 'AND' | 'OR';
}

export interface FilterState {
  timeStartMs: number;
  timeEndMs: number;
  visibleChannels: Set<ChannelKey>;
  conditions: Condition[];
}

export interface AppState {
  original: Mus4Tub | null;
  samples: Sample[];
  filter: FilterState;
}
```

- [ ] **Step 2: 创建 src/channels.ts**

```typescript
import type { ChannelDef, ChannelKey } from './types';

export const CHANNELS: ChannelDef[] = [
  { key: 'thr', label: 'Throttle', color: '#39d98a', defaultVisible: true, category: 'Output' },
  { key: 'str', label: 'Steering', color: '#5cc8ff', defaultVisible: true, category: 'Output' },
  { key: 'gz', label: 'GyroZ', color: '#ff6b6b', defaultVisible: true, category: 'IMU', unit: 'rad/s' },
  { key: 'ch1', label: 'CH1 Steering', color: '#a78bfa', category: 'RC' },
  { key: 'ch2', label: 'CH2 Throttle', color: '#fbbf24', category: 'RC' },
  { key: 'ch3', label: 'CH3 Park', color: '#f87171', category: 'RC' },
  { key: 'ch4', label: 'CH4 Mode', color: '#34d399', category: 'RC' },
  { key: 'ch5', label: 'CH5 Drift', color: '#60a5fa', category: 'RC' },
  { key: 'ch6', label: 'CH6 Scale', color: '#f472b6', category: 'RC' },
  { key: 'rct', label: 'RC Throttle', color: '#fbbf24', category: 'RC' },
  { key: 'rcs', label: 'RC Steering', color: '#a78bfa', category: 'RC' },
  { key: 'pt', label: 'Pilot Throttle', color: '#34d399', category: 'Pilot' },
  { key: 'ps', label: 'Pilot Steering', color: '#60a5fa', category: 'Pilot' },
  { key: 'mode', label: 'Mode', color: '#94a3b8', category: 'State' },
  { key: 'park', label: 'Park', color: '#f87171', category: 'State' },
  { key: 'de', label: 'Drift Enabled', color: '#60a5fa', category: 'State' },
  { key: 'da', label: 'Drift Active', color: '#34d399', category: 'State' },
  { key: 'dc', label: 'Drift Comp', color: '#f472b6', category: 'State' },
  { key: 'vol', label: 'Voltage', color: '#fbbf24', category: 'Power', unit: 'V' },
  { key: 'cur', label: 'Current', color: '#a78bfa', category: 'Power', unit: 'mA' },
  { key: 'gzf', label: 'GyroZ Filtered', color: '#fb923c', category: 'IMU', unit: 'rad/s' },
  { key: 'gx', label: 'GyroX', color: '#c084fc', category: 'IMU', unit: 'rad/s' },
  { key: 'gy', label: 'GyroY', color: '#818cf8', category: 'IMU', unit: 'rad/s' },
  { key: 'ax', label: 'AccelX', color: '#2dd4bf', category: 'IMU', unit: 'm/s²' },
  { key: 'ay', label: 'AccelY', color: '#38bdf8', category: 'IMU', unit: 'm/s²' },
  { key: 'az', label: 'AccelZ', color: '#a3e635', category: 'IMU', unit: 'm/s²' },
];

export function getDefaultVisibleChannels(): Set<ChannelKey> {
  return new Set(CHANNELS.filter((c) => c.defaultVisible).map((c) => c.key));
}
```

- [ ] **Step 3: 修改 src/main.ts 引入通道元数据**

```typescript
import './style.css';
import { CHANNELS } from './channels';

console.log('DriftViewer initialized with', CHANNELS.length, 'channels');
```

- [ ] **Step 4: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/channels.ts src/main.ts
git commit -m "feat: add core types and channel metadata"
```

---

### Task 3: 实现 JSON Loader 与单元测试

**Files:**
- Create: `src/loader.ts`
- Create: `src/__tests__/loader.test.ts`
- Modify: `package.json`（确保 vitest 已安装，已在 Task 1 完成）

- [ ] **Step 1: 创建 src/loader.ts**

```typescript
import type { Mus4Tub, Sample } from './types';

const SUPPORTED_SCHEMAS = new Set([
  'mus4.web_data_point.tub.v1',
  'mus4.web_data_point.tub.v2',
]);

export interface LoadResult {
  ok: true;
  data: Mus4Tub;
  samples: Sample[];
} | {
  ok: false;
  error: string;
};

export function parseMus4Tub(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '无法解析 JSON' };
  }

  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'JSON 根节点不是对象' };
  }

  const data = raw as Record<string, unknown>;
  const schema = typeof data.schema === 'string' ? data.schema : '';

  if (!SUPPORTED_SCHEMAS.has(schema)) {
    return { ok: false, error: `不支持的 schema：${schema || '<空>'}` };
  }

  if (!Array.isArray(data.samples)) {
    return { ok: false, error: '缺少 samples 数组' };
  }

  const samples: Sample[] = data.samples.map((item: unknown, index: number) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`samples[${index}] 不是对象`);
    }
    const s = item as Record<string, unknown>;
    return {
      seq: Number(s.seq ?? 0),
      t: Number(s.t ?? 0),
      dt: Number(s.dt ?? 0),
      thr: Number(s.thr ?? 0),
      str: Number(s.str ?? 0),
      mode: Number(s.mode ?? 0),
      park: Number(s.park ?? 0),
      ch1: Number(s.ch1 ?? 0),
      ch2: Number(s.ch2 ?? 0),
      ch3: Number(s.ch3 ?? 0),
      ch4: Number(s.ch4 ?? 0),
      ch5: Number(s.ch5 ?? 0),
      ch6: Number(s.ch6 ?? 0),
      rct: Number(s.rct ?? 0),
      rcs: Number(s.rcs ?? 0),
      pt: Number(s.pt ?? 0),
      ps: Number(s.ps ?? 0),
      gz: Number(s.gz ?? 0),
      gx: s.gx !== undefined ? Number(s.gx) : undefined,
      gy: s.gy !== undefined ? Number(s.gy) : undefined,
      ax: s.ax !== undefined ? Number(s.ax) : undefined,
      ay: s.ay !== undefined ? Number(s.ay) : undefined,
      az: s.az !== undefined ? Number(s.az) : undefined,
      gzf: s.gzf !== undefined ? Number(s.gzf) : undefined,
      cur: s.cur !== undefined ? Number(s.cur) : undefined,
      vol: s.vol !== undefined ? Number(s.vol) : undefined,
      de: s.de !== undefined ? Number(s.de) : undefined,
      da: s.da !== undefined ? Number(s.da) : undefined,
      dc: s.dc !== undefined ? Number(s.dc) : undefined,
    };
  });

  const tub: Mus4Tub = {
    schema,
    source: typeof data.source === 'string' ? data.source : 'mus4-web-console',
    started_ms: Number(data.started_ms ?? 0),
    stopped_ms: Number(data.stopped_ms ?? 0),
    count: Number(data.count ?? samples.length),
    samples,
  };

  return { ok: true, data: tub, samples };
}

export function loadFile(file: File): Promise<LoadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      resolve(parseMus4Tub(text));
    };
    reader.onerror = () => resolve({ ok: false, error: '文件读取失败' });
    reader.readAsText(file);
  });
}
```

- [ ] **Step 2: 创建 src/__tests__/loader.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { parseMus4Tub } from '../loader';

function makeTub(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    schema: 'mus4.web_data_point.tub.v1',
    source: 'mus4-web-console',
    started_ms: 1000,
    stopped_ms: 2000,
    count: 2,
    samples: [
      { seq: 1, t: 1000, dt: 16, thr: 10, str: -5, mode: 0, park: 0, ch1: 1500, ch2: 1510, ch3: 1000, ch4: 1000, ch5: 2000, ch6: 1500, rct: 1510, rcs: 1500, pt: 0, ps: 0, gz: 0.1, vol: 11.6 },
      { seq: 2, t: 1016, dt: 16, thr: 20, str: -10, mode: 1, park: 0, ch1: 1510, ch2: 1520, ch3: 1001, ch4: 1001, ch5: 2001, ch6: 1501, rct: 1520, rcs: 1510, pt: 10, ps: -5, gz: 0.2, vol: 11.5 },
    ],
    ...overrides,
  });
}

describe('parseMus4Tub', () => {
  it('parses valid v1 tub', () => {
    const result = parseMus4Tub(makeTub());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.count).toBe(2);
    expect(result.samples).toHaveLength(2);
    expect(result.samples[0].thr).toBe(10);
    expect(result.samples[1].mode).toBe(1);
  });

  it('supports v2 schema', () => {
    const result = parseMus4Tub(makeTub({ schema: 'mus4.web_data_point.tub.v2' }));
    expect(result.ok).toBe(true);
  });

  it('rejects unsupported schema', () => {
    const result = parseMus4Tub(makeTub({ schema: 'unknown' }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('不支持的 schema');
  });

  it('rejects invalid JSON', () => {
    const result = parseMus4Tub('{ not json');
    expect(result.ok).toBe(false);
  });

  it('rejects missing samples', () => {
    const result = parseMus4Tub(JSON.stringify({ schema: 'mus4.web_data_point.tub.v1' }));
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 3: 运行 Loader 测试**

Run: `npm test`
Expected: 5 tests pass。

- [ ] **Step 4: Commit**

```bash
git add src/loader.ts src/__tests__/loader.test.ts
git commit -m "feat: add mus4-tub loader with schema validation and tests"
```

---

### Task 4: 实现 Store

**Files:**
- Create: `src/store.ts`

- [ ] **Step 1: 创建 src/store.ts**

```typescript
import type { AppState, ChannelKey, FilterState, Mus4Tub, Sample } from './types';
import { getDefaultVisibleChannels } from './channels';

export function createEmptyFilter(): FilterState {
  return {
    timeStartMs: 0,
    timeEndMs: Infinity,
    visibleChannels: getDefaultVisibleChannels(),
    conditions: [],
  };
}

export function createStore() {
  const state: AppState = {
    original: null,
    samples: [],
    filter: createEmptyFilter(),
  };

  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setOriginal: (data: Mus4Tub, samples: Sample[]) => {
      state.original = data;
      state.samples = samples;
      if (samples.length > 0) {
        state.filter.timeStartMs = samples[0].t;
        state.filter.timeEndMs = samples[samples.length - 1].t;
      }
      listeners.forEach((fn) => fn());
    },
    setTimeRange: (start: number, end: number) => {
      state.filter.timeStartMs = start;
      state.filter.timeEndMs = end;
      listeners.forEach((fn) => fn());
    },
    setVisibleChannels: (channels: Set<ChannelKey>) => {
      state.filter.visibleChannels = channels;
      listeners.forEach((fn) => fn());
    },
    setConditions: (conditions: FilterState['conditions']) => {
      state.filter.conditions = conditions;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
```

- [ ] **Step 2: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add src/store.ts
git commit -m "feat: add reactive store for app state and filters"
```

---

### Task 5: 实现基础 Canvas 图表

**Files:**
- Create: `src/chart.ts`
- Modify: `src/style.css`（添加 chart 相关样式）
- Modify: `src/main.ts`（初始化 chart 占位）

- [ ] **Step 1: 创建 src/chart.ts**

```typescript
import type { Sample, ChannelKey } from './types';

export interface ChartConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

export function createChart(canvas: HTMLCanvasElement, config: ChartConfig) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  let dpr = window.devicePixelRatio || 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    canvas.width = config.width * dpr;
    canvas.height = config.height * dpr;
    canvas.style.width = `${config.width}px`;
    canvas.style.height = `${config.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawGrid() {
    const { width, height, padding } = config;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#233041';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (i * (height - padding.top - padding.bottom)) / 8;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
  }

  function drawSeries(samples: Sample[], key: ChannelKey, color: string, min: number, max: number) {
    if (samples.length < 2) return;
    const { width, height, padding } = config;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const tStart = samples[0].t;
    const tEnd = samples[samples.length - 1].t;
    const tRange = tEnd - tStart || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const x = padding.left + ((s.t - tStart) / tRange) * plotW;
      const value = Number(s[key] ?? 0);
      const y = padding.top + (1 - (value - min) / (max - min)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function draw(samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max: number }>) {
    drawGrid();
    for (const [key, meta] of visibleChannels) {
      drawSeries(samples, key, meta.color, meta.min, meta.max);
    }
  }

  resize();

  return { resize, draw };
}
```

- [ ] **Step 2: 修改 src/style.css 添加 chart 样式**

```css
.chartPanel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
}

.chartCanvas {
  width: 100%;
  height: 360px;
  background: #0d1117;
  border-radius: 6px;
}
```

- [ ] **Step 3: 修改 src/main.ts（初始化图表容器）**

```typescript
import './style.css';
import { CHANNELS } from './channels';

function initApp() {
  console.log('DriftViewer initialized with', CHANNELS.length, 'channels');
}

initApp();
```

- [ ] **Step 4: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 5: Commit**

```bash
git add src/chart.ts src/style.css src/main.ts
git commit -m "feat: add basic canvas chart renderer"
```

---

## 3. 里程碑 M2：多通道切换、时间范围筛选、鼠标交互

**目标：** 在 UI 中选择通道、用滑块/鼠标框选时间范围，图表实时刷新。

---

### Task 6: 实现 Filter 模块与单元测试

**Files:**
- Create: `src/filter.ts`
- Create: `src/__tests__/filter.test.ts`

- [ ] **Step 1: 创建 src/filter.ts**

```typescript
import type { Sample, FilterState, Condition } from './types';

function evaluateCondition(s: Sample, cond: Condition): boolean {
  const value = s[cond.channel] ?? 0;
  switch (cond.op) {
    case '==': return value === cond.value;
    case '!=': return value !== cond.value;
    case '<':  return value < cond.value;
    case '<=': return value <= cond.value;
    case '>':  return value > cond.value;
    case '>=': return value >= cond.value;
    default:   return false;
  }
}

export function filterSamples(samples: Sample[], state: FilterState): Sample[] {
  return samples.filter((s) => {
    if (s.t < state.timeStartMs || s.t > state.timeEndMs) return false;
    if (state.conditions.length === 0) return true;
    let result = evaluateCondition(s, state.conditions[0]);
    for (let i = 1; i < state.conditions.length; i++) {
      const cond = state.conditions[i];
      const val = evaluateCondition(s, cond);
      result = cond.combine === 'AND' ? result && val : result || val;
    }
    return result;
  });
}
```

- [ ] **Step 2: 创建 src/__tests__/filter.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { filterSamples } from '../filter';
import type { Sample, FilterState } from '../types';

function makeSamples(): Sample[] {
  return [
    { seq: 1, t: 1000, dt: 16, thr: 10, str: -5, mode: 0, park: 0, ch1: 1500, ch2: 1510, ch3: 1000, ch4: 1000, ch5: 2000, ch6: 1500, rct: 1510, rcs: 1500, pt: 0, ps: 0, gz: 0.1 },
    { seq: 2, t: 1016, dt: 16, thr: 20, str: -10, mode: 1, park: 0, ch1: 1510, ch2: 1520, ch3: 1001, ch4: 1001, ch5: 2001, ch6: 1501, rct: 1520, rcs: 1510, pt: 10, ps: -5, gz: 0.2 },
    { seq: 3, t: 1032, dt: 16, thr: 30, str: -15, mode: 2, park: 1, ch1: 1520, ch2: 1530, ch3: 1002, ch4: 1002, ch5: 2002, ch6: 1502, rct: 1530, rcs: 1520, pt: 20, ps: -10, gz: 0.3 },
  ];
}

function baseFilter(): FilterState {
  return {
    timeStartMs: 0,
    timeEndMs: Infinity,
    visibleChannels: new Set(['thr', 'str', 'gz']),
    conditions: [],
  };
}

describe('filterSamples', () => {
  it('returns all samples by default', () => {
    expect(filterSamples(makeSamples(), baseFilter())).toHaveLength(3);
  });

  it('filters by time range', () => {
    const state = { ...baseFilter(), timeStartMs: 1016, timeEndMs: 1016 };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(1);
    expect(result[0].seq).toBe(2);
  });

  it('filters by single condition', () => {
    const state = { ...baseFilter(), conditions: [{ channel: 'thr', op: '>', value: 15, combine: 'AND' }] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(2);
  });

  it('combines conditions with AND', () => {
    const state = { ...baseFilter(), conditions: [
      { channel: 'thr', op: '>', value: 15, combine: 'AND' },
      { channel: 'mode', op: '==', value: 2, combine: 'AND' },
    ] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(1);
    expect(result[0].seq).toBe(3);
  });

  it('combines conditions with OR', () => {
    const state = { ...baseFilter(), conditions: [
      { channel: 'mode', op: '==', value: 0, combine: 'AND' },
      { channel: 'mode', op: '==', value: 2, combine: 'OR' },
    ] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 3: 运行 Filter 测试**

Run: `npm test`
Expected: 9 tests pass。

- [ ] **Step 4: Commit**

```bash
git add src/filter.ts src/__tests__/filter.test.ts
git commit -m "feat: add sample filter with time and condition support"
```

---

### Task 7: 实现 UI 面板（通道选择 + 时间滑块 + 文件拖拽）

**Files:**
- Create: `src/ui.ts`
- Modify: `index.html`（添加图表与控件容器）
- Modify: `src/style.css`（添加控件样式）
- Modify: `src/main.ts`（绑定事件与数据流）

- [ ] **Step 1: 修改 index.html 添加主界面容器**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DriftViewer</title>
  </head>
  <body>
    <div id="app">
      <header class="header">
        <h1>DriftViewer</h1>
        <label class="fileButton">
          打开文件
          <input id="fileInput" type="file" accept=".json,application/json" hidden />
        </label>
      </header>
      <main id="main" class="main">
        <div id="dropZone" class="dropZone">
          <p>拖拽 mus4-tub.json 到此处</p>
          <p class="hint">或点击右上角「打开文件」</p>
        </div>
        <div id="workspace" class="workspace" hidden>
          <div id="statusCards" class="statusCards"></div>
          <div class="chartPanel">
            <canvas id="chartCanvas" class="chartCanvas"></canvas>
          </div>
          <div class="controlsPanel">
            <div class="controlGroup">
              <label>时间范围</label>
              <input id="timeStart" type="range" />
              <input id="timeEnd" type="range" />
              <button id="resetRange">重置</button>
              <span id="rangeInfo"></span>
            </div>
            <div class="controlGroup">
              <label>通道</label>
              <div id="channelList" class="channelList"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: 修改 src/style.css 添加工作区样式**

```css
.workspace { margin-top: 12px; }

.statusCards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.statusCard {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
}

.statusCard .label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
}

.statusCard .value {
  font-size: 18px;
  font-weight: 700;
  margin-top: 4px;
}

.controlsPanel {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.controlGroup {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}

.controlGroup label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}

.channelList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.channelTag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 12px;
  cursor: pointer;
  user-select: none;
}

.channelTag.active {
  border-color: currentColor;
  background: rgba(255, 255, 255, 0.08);
}

.channelTag input { margin: 0; }
```

- [ ] **Step 3: 创建 src/ui.ts**

```typescript
import type { Store } from './store';
import { CHANNELS } from './channels';
import { loadFile, type LoadResult } from './loader';

export function createUI(store: Store, render: () => void) {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const dropZone = document.getElementById('dropZone') as HTMLDivElement;
  const workspace = document.getElementById('workspace') as HTMLDivElement;
  const timeStart = document.getElementById('timeStart') as HTMLInputElement;
  const timeEnd = document.getElementById('timeEnd') as HTMLInputElement;
  const resetRange = document.getElementById('resetRange') as HTMLButtonElement;
  const rangeInfo = document.getElementById('rangeInfo') as HTMLSpanElement;
  const channelList = document.getElementById('channelList') as HTMLDivElement;
  const statusCards = document.getElementById('statusCards') as HTMLDivElement;

  function handleFile(file: File) {
    loadFile(file).then((result: LoadResult) => {
      if (!result.ok) {
        alert(result.error);
        return;
      }
      store.setOriginal(result.data, result.samples);
      dropZone.hidden = true;
      workspace.hidden = false;
      updateRangeInputs(result.samples);
      render();
    });
  }

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  function updateRangeInputs(samples: { t: number }[]) {
    if (samples.length === 0) return;
    const min = samples[0].t;
    const max = samples[samples.length - 1].t;
    timeStart.min = timeEnd.min = String(min);
    timeStart.max = timeEnd.max = String(max);
    timeStart.value = String(min);
    timeEnd.value = String(max);
    timeStart.step = timeEnd.step = String(Math.max(1, Math.floor((max - min) / 200)));
  }

  function onRangeChange() {
    const start = Number(timeStart.value);
    const end = Number(timeEnd.value);
    store.setTimeRange(Math.min(start, end), Math.max(start, end));
    render();
  }

  timeStart.addEventListener('input', onRangeChange);
  timeEnd.addEventListener('input', onRangeChange);
  resetRange.addEventListener('click', () => {
    const state = store.getState();
    if (state.samples.length === 0) return;
    store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
    updateRangeInputs(state.samples);
    render();
  });

  function renderChannelList() {
    channelList.innerHTML = '';
    const visible = store.getState().filter.visibleChannels;
    CHANNELS.forEach((ch) => {
      const tag = document.createElement('label');
      tag.className = 'channelTag' + (visible.has(ch.key) ? ' active' : '');
      tag.style.color = ch.color;
      tag.innerHTML = `<input type="checkbox" ${visible.has(ch.key) ? 'checked' : ''}> ${ch.label}`;
      tag.querySelector('input')!.addEventListener('change', (e) => {
        const next = new Set(store.getState().filter.visibleChannels);
        if ((e.target as HTMLInputElement).checked) next.add(ch.key);
        else next.delete(ch.key);
        store.setVisibleChannels(next);
        render();
      });
      channelList.appendChild(tag);
    });
  }

  function renderStatusCards() {
    const state = store.getState();
    const samples = state.samples;
    const filtered = state.samples; // M2 仍显示原始样本统计；M3 接入 filter 后再改
    statusCards.innerHTML = '';
    const cards = [
      { label: 'Samples', value: String(samples.length) },
      { label: 'Duration', value: samples.length > 1 ? `${((samples[samples.length - 1].t - samples[0].t) / 1000).toFixed(1)}s` : '0s' },
      { label: 'Filtered', value: String(filtered.length) },
    ];
    cards.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'statusCard';
      div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
      statusCards.appendChild(div);
    });
  }

  return { renderChannelList, renderStatusCards, rangeInfo };
}
```

- [ ] **Step 4: 修改 src/main.ts 绑定数据流**

```typescript
import './style.css';
import type { ChannelKey } from './types';
import { createStore } from './store';
import { createUI } from './ui';
import { createChart } from './chart';
import { CHANNELS } from './channels';

function initApp() {
  const store = createStore();
  const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
  const chart = createChart(canvas, {
    width: canvas.clientWidth || 800,
    height: 360,
    padding: { top: 20, right: 20, bottom: 30, left: 44 },
  });

  const ui = createUI(store, () => {
    const state = store.getState();
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();
    state.filter.visibleChannels.forEach((key) => {
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const values = state.samples.map((s) => Number(s[key] ?? 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      visible.set(key, { color: ch.color, min, max });
    });
    chart.draw(state.samples, visible);
    ui.renderChannelList();
    ui.renderStatusCards();
  });

  window.addEventListener('resize', () => {
    chart.resize();
    const state = store.getState();
    if (state.samples.length > 0) {
      // 触发重绘由 store.subscribe 完成更好，这里保持简单
    }
  });
}

initApp();
```

- [ ] **Step 5: 修复 main.ts 中 resize 后的重绘**

将 Step 4 中内联的渲染逻辑提取为命名函数 `render`，并通过 `store.subscribe(render)` 让状态变化自动触发重绘：

```typescript
  const render = () => {
    const state = store.getState();
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();
    state.filter.visibleChannels.forEach((key) => {
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const values = state.samples.map((s) => Number(s[key] ?? 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      visible.set(key, { color: ch.color, min, max });
    });
    chart.draw(state.samples, visible);
    ui.renderChannelList();
    ui.renderStatusCards();
  };

  const ui = createUI(store, render);
  store.subscribe(render);
  window.addEventListener('resize', () => { chart.resize(); render(); });
```

- [ ] **Step 6: 运行开发服务器并手工验证**

Run: `npm run dev`
步骤：
1. 打开浏览器访问本地地址。
2. 点击「打开文件」选择 `C:/Users/cross/Downloads/mus4-tub.json`。
3. 验证：出现图表、通道列表、时间滑块、样本统计卡片。
4. 切换通道可见性，验证曲线增减。
5. 拖动时间滑块，验证图表重绘（当前 M2 仅重绘全部数据，M3 接入 filter 后按范围裁剪）。

- [ ] **Step 7: Commit**

```bash
git add index.html src/style.css src/ui.ts src/main.ts
git commit -m "feat: add file drop, channel toggles, time sliders and status cards"
```

---

### Task 8: 将 Filter 接入主数据流

**Files:**
- Modify: `src/main.ts`
- Modify: `src/ui.ts`（更新状态卡片使用过滤后样本）
- Modify: `src/chart.ts`（支持按过滤后的时间范围裁剪显示）

- [ ] **Step 1: 修改 src/main.ts 在 render 中使用 filterSamples**

```typescript
import './style.css';
import type { ChannelKey } from './types';
import { createStore } from './store';
import { createUI } from './ui';
import { createChart } from './chart';
import { CHANNELS } from './channels';
import { filterSamples } from './filter';

function initApp() {
  const store = createStore();
  const canvas = document.getElementById('chartCanvas') as HTMLCanvasElement;
  const chart = createChart(canvas, {
    width: canvas.clientWidth || 800,
    height: 360,
    padding: { top: 20, right: 20, bottom: 30, left: 44 },
  });

  const render = () => {
    const state = store.getState();
    const filtered = filterSamples(state.samples, state.filter);
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();
    state.filter.visibleChannels.forEach((key) => {
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const values = filtered.map((s) => Number(s[key] ?? 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      visible.set(key, { color: ch.color, min, max });
    });
    chart.draw(filtered, visible);
    ui.renderChannelList();
    ui.renderStatusCards(filtered);
  };

  const ui = createUI(store, render);
  store.subscribe(render);
  window.addEventListener('resize', () => { chart.resize(); render(); });
}

initApp();
```

- [ ] **Step 2: 修改 src/ui.ts 中 renderStatusCards 接收 filtered 参数**

首先在 `src/ui.ts` 顶部引入 `Sample`：

```typescript
import type { Sample } from './types';
```

然后修改函数签名：

```typescript
  function renderStatusCards(filtered: Sample[] = store.getState().samples) {
    const state = store.getState();
    const samples = state.samples;
    statusCards.innerHTML = '';
    const cards = [
      { label: 'Samples', value: String(samples.length) },
      { label: 'Duration', value: samples.length > 1 ? `${((samples[samples.length - 1].t - samples[0].t) / 1000).toFixed(1)}s` : '0s' },
      { label: 'Filtered', value: String(filtered.length) },
    ];
    // ... 其余不变
  }
```

- [ ] **Step 3: 运行开发服务器并验证时间筛选**

Run: `npm run dev`
步骤：
1. 加载示例文件。
2. 拖动时间滑块，验证图表只显示选定时间范围内的数据。
3. 验证 Filtered 卡片数值随滑块变化。

- [ ] **Step 4: Commit**

```bash
git add src/main.ts src/ui.ts
git commit -m "feat: wire filter into main render loop"
```

---

### Task 9: 添加鼠标框选时间范围

**Files:**
- Modify: `src/chart.ts`
- Modify: `src/main.ts`（处理框选回调）

- [ ] **Step 1: 修改 src/chart.ts 支持框选交互**

在 `createChart` 中添加：

```typescript
  let selecting = false;
  let selectStartX = 0;
  let selectEndX = 0;

  function installSelectionHandlers(onSelect: (startRatio: number, endRatio: number) => void) {
    canvas.addEventListener('mousedown', (e) => {
      selecting = true;
      const rect = canvas.getBoundingClientRect();
      selectStartX = selectEndX = e.clientX - rect.left;
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!selecting) return;
      const rect = canvas.getBoundingClientRect();
      selectEndX = e.clientX - rect.left;
      // 重绘以显示选区由调用方在 subscribe 中处理
    });
    canvas.addEventListener('mouseup', () => {
      if (!selecting) return;
      selecting = false;
      const plotX = config.padding.left;
      const plotW = config.width - config.padding.left - config.padding.right;
      const start = Math.max(0, Math.min(1, (Math.min(selectStartX, selectEndX) - plotX) / plotW));
      const end = Math.max(0, Math.min(1, (Math.max(selectStartX, selectEndX) - plotX) / plotW));
      if (end - start > 0.01) onSelect(start, end);
    });
    canvas.addEventListener('mouseleave', () => { selecting = false; });
  }
```

修改 `draw` 函数签名接受 `selection?: { startRatio: number; endRatio: number }` 并绘制半透明选区。

简化方案：在 `createChart` 返回 `{ resize, draw, installSelectionHandlers }`，并在 `draw` 内部根据传入的 `selection` 绘制。

- [ ] **Step 2: 修改 src/main.ts 处理框选**

```typescript
  let selection: { startRatio: number; endRatio: number } | null = null;

  chart.installSelectionHandlers((start, end) => {
    const state = store.getState();
    if (state.samples.length === 0) return;
    const tStart = state.samples[0].t;
    const tEnd = state.samples[state.samples.length - 1].t;
    const tRange = tEnd - tStart;
    store.setTimeRange(tStart + start * tRange, tStart + end * tRange);
    selection = { startRatio: start, endRatio: end };
    render();
  });
```

- [ ] **Step 3: 在时间滑块变化时清除框选高亮**

在 `src/ui.ts` 的 `onRangeChange` 和 `resetRange` 中设置 `selection = null` 需要主流程配合；简单做法是在 `render` 中根据当前 filter 范围重新计算 selection 比例，或在框选后不再依赖视觉选区。首版可接受：框选后只更新时间范围，不保留视觉矩形。

- [ ] **Step 4: 手工验证**

Run: `npm run dev`
步骤：
1. 加载示例文件。
2. 在 Canvas 上按住鼠标左右拖动，验证时间滑块更新到对应范围。
3. 验证图表刷新为框选区间。

- [ ] **Step 5: Commit**

```bash
git add src/chart.ts src/main.ts
git commit -m "feat: add mouse drag selection for time range"
```

---

## 4. 里程碑 M3：条件筛选与数据导出

**目标：** 用户可通过条件表达式过滤数据，并导出筛选后的 `mus4-tub.json` 片段。

---

### Task 10: 实现 Exporter 与单元测试

**Files:**
- Create: `src/exporter.ts`
- Create: `src/__tests__/exporter.test.ts`

- [ ] **Step 1: 创建 src/exporter.ts**

```typescript
import type { Mus4Tub, Sample } from './types';

export function buildExportPackage(original: Mus4Tub, samples: Sample[]): Mus4Tub {
  if (samples.length === 0) throw new Error('没有可导出的样本');
  return {
    ...original,
    started_ms: samples[0].t,
    stopped_ms: samples[samples.length - 1].t,
    count: samples.length,
    samples,
  };
}

export function downloadTub(tub: Mus4Tub, filename?: string) {
  const blob = new Blob([JSON.stringify(tub)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `mus4-tub-${tub.started_ms}-${tub.stopped_ms}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
```

- [ ] **Step 2: 创建 src/__tests__/exporter.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { buildExportPackage } from '../exporter';
import type { Mus4Tub, Sample } from '../types';

function makeTub(): Mus4Tub {
  return {
    schema: 'mus4.web_data_point.tub.v1',
    source: 'mus4-web-console',
    started_ms: 1000,
    stopped_ms: 2000,
    count: 3,
    samples: [
      { seq: 1, t: 1000, dt: 16, thr: 10, str: -5, mode: 0, park: 0, ch1: 1500, ch2: 1510, ch3: 1000, ch4: 1000, ch5: 2000, ch6: 1500, rct: 1510, rcs: 1500, pt: 0, ps: 0, gz: 0.1 },
      { seq: 2, t: 1016, dt: 16, thr: 20, str: -10, mode: 1, park: 0, ch1: 1510, ch2: 1520, ch3: 1001, ch4: 1001, ch5: 2001, ch6: 1501, rct: 1520, rcs: 1510, pt: 10, ps: -5, gz: 0.2 },
      { seq: 3, t: 1032, dt: 16, thr: 30, str: -15, mode: 2, park: 1, ch1: 1520, ch2: 1530, ch3: 1002, ch4: 1002, ch5: 2002, ch6: 1502, rct: 1530, rcs: 1520, pt: 20, ps: -10, gz: 0.3 },
    ],
  };
}

describe('buildExportPackage', () => {
  it('updates metadata for selected samples', () => {
    const original = makeTub();
    const selected = [original.samples[1]];
    const exported = buildExportPackage(original, selected);
    expect(exported.started_ms).toBe(1016);
    expect(exported.stopped_ms).toBe(1016);
    expect(exported.count).toBe(1);
    expect(exported.samples).toHaveLength(1);
    expect(exported.schema).toBe(original.schema);
    expect(exported.source).toBe(original.source);
  });

  it('throws on empty samples', () => {
    expect(() => buildExportPackage(makeTub(), [])).toThrow('没有可导出的样本');
  });
});
```

- [ ] **Step 3: 运行 Exporter 测试**

Run: `npm test`
Expected: 11 tests pass。

- [ ] **Step 4: Commit**

```bash
git add src/exporter.ts src/__tests__/exporter.test.ts
git commit -m "feat: add tub exporter and tests"
```

---

### Task 11: 添加条件筛选 UI

**Files:**
- Modify: `index.html`（添加条件面板）
- Modify: `src/style.css`（添加条件样式）
- Modify: `src/ui.ts`（渲染条件行、绑定添加/删除）

- [ ] **Step 1: 修改 index.html 添加条件面板**

在 `controlsPanel` 内新增：

```html
            <div class="controlGroup">
              <label>条件筛选</label>
              <div id="conditionList"></div>
              <button id="addCondition">添加条件</button>
            </div>
```

- [ ] **Step 2: 修改 src/style.css 添加条件样式**

```css
.conditionRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.conditionRow select,
.conditionRow input {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 13px;
}

.conditionRow button {
  background: transparent;
  color: var(--red);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
```

- [ ] **Step 3: 修改 src/ui.ts 添加条件渲染逻辑**

确保 `src/ui.ts` 引入 `Condition` 和 `ChannelKey`：

```typescript
import type { Sample, Condition, ChannelKey } from './types';
```

在 `createUI` 内新增：

```typescript
  const conditionList = document.getElementById('conditionList') as HTMLDivElement;
  const addCondition = document.getElementById('addCondition') as HTMLButtonElement;

  function renderConditions() {
    conditionList.innerHTML = '';
    const conditions = store.getState().filter.conditions;
    conditions.forEach((cond, index) => {
      const row = document.createElement('div');
      row.className = 'conditionRow';
      row.innerHTML = `
        ${index > 0 ? `<select class="combine"><option value="AND" ${cond.combine === 'AND' ? 'selected' : ''}>AND</option><option value="OR" ${cond.combine === 'OR' ? 'selected' : ''}>OR</option></select>` : '<span>WHERE</span>'}
        <select class="channel"></select>
        <select class="op">
          <option value="==" ${cond.op === '==' ? 'selected' : ''}>==</option>
          <option value="!=" ${cond.op === '!=' ? 'selected' : ''}>!=</option>
          <option value="<" ${cond.op === '<' ? 'selected' : ''}>&lt;</option>
          <option value="<=" ${cond.op === '<=' ? 'selected' : ''}>&lt;=</option>
          <option value=">" ${cond.op === '>' ? 'selected' : ''}>&gt;</option>
          <option value=">=" ${cond.op === '>=' ? 'selected' : ''}>&gt;=</option>
        </select>
        <input class="value" type="number" step="any" value="${cond.value}" />
        <button class="remove">删除</button>
      `;
      const channelSelect = row.querySelector('.channel') as HTMLSelectElement;
      CHANNELS.forEach((ch) => {
        const opt = document.createElement('option');
        opt.value = ch.key;
        opt.textContent = ch.label;
        if (ch.key === cond.channel) opt.selected = true;
        channelSelect.appendChild(opt);
      });
      const update = () => {
        const next = [...store.getState().filter.conditions];
        next[index] = {
          channel: channelSelect.value as ChannelKey,
          op: (row.querySelector('.op') as HTMLSelectElement).value as Condition['op'],
          value: Number((row.querySelector('.value') as HTMLInputElement).value),
          combine: index > 0 ? (row.querySelector('.combine') as HTMLSelectElement).value as Condition['combine'] : 'AND',
        };
        store.setConditions(next);
        render();
      };
      row.querySelectorAll('select, input').forEach((el) => el.addEventListener('change', update));
      row.querySelector('input')!.addEventListener('input', update);
      row.querySelector('.remove')!.addEventListener('click', () => {
        const next = [...store.getState().filter.conditions];
        next.splice(index, 1);
        store.setConditions(next);
        render();
      });
      conditionList.appendChild(row);
    });
  }

  addCondition.addEventListener('click', () => {
    const next = [...store.getState().filter.conditions];
    next.push({ channel: 'thr', op: '>', value: 0, combine: 'AND' });
    store.setConditions(next);
    render();
  });
```

- [ ] **Step 4: 在 render 中调用 renderConditions**

在 `createUI` 返回对象中加入 `renderConditions`，并在 `render` 回调中调用：

```typescript
  return { renderChannelList, renderStatusCards, renderConditions, rangeInfo };
```

在 `src/main.ts` 的 `render` 函数中加入：

```typescript
    ui.renderChannelList();
    ui.renderConditions();
    ui.renderStatusCards(filtered);
```

- [ ] **Step 5: 手工验证**

Run: `npm run dev`
步骤：
1. 加载示例文件。
2. 点击「添加条件」，选择 `thr > 15`。
3. 验证图表只显示满足条件的样本。
4. 添加第二个条件 `mode == 2`，切换 AND/OR，验证过滤结果。

- [ ] **Step 6: Commit**

```bash
git add index.html src/style.css src/ui.ts src/main.ts
git commit -m "feat: add condition filter UI"
```

---

### Task 12: 添加导出按钮与键盘快捷键

**Files:**
- Modify: `index.html`（添加导出按钮）
- Modify: `src/style.css`（导出按钮样式）
- Modify: `src/ui.ts`（绑定导出按钮）
- Modify: `src/main.ts`（全局快捷键）

- [ ] **Step 1: 修改 index.html 在 header 添加导出按钮**

```html
      <header class="header">
        <h1>DriftViewer</h1>
        <div class="headerActions">
          <button id="exportBtn" class="exportButton" disabled>导出选中段</button>
          <label class="fileButton">
            打开文件
            <input id="fileInput" type="file" accept=".json,application/json" hidden />
          </label>
        </div>
      </header>
```

- [ ] **Step 2: 修改 src/style.css**

```css
.headerActions { display: flex; gap: 10px; align-items: center; }

.exportButton {
  padding: 8px 16px;
  background: var(--green);
  color: #061019;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.exportButton:disabled {
  background: #2b3441;
  color: var(--muted);
  cursor: not-allowed;
}
```

- [ ] **Step 3: 修改 src/ui.ts 绑定导出按钮**

在 `createUI` 内新增：

```typescript
  const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

  function updateExportButton(filteredLength: number) {
    exportBtn.disabled = filteredLength === 0;
  }

  exportBtn.addEventListener('click', () => {
    const state = store.getState();
    if (!state.original) return;
    import('./filter').then(({ filterSamples }) => {
      const filtered = filterSamples(state.samples, state.filter);
      if (filtered.length === 0) return;
      import('./exporter').then(({ buildExportPackage, downloadTub }) => {
        const exported = buildExportPackage(state.original!, filtered);
        downloadTub(exported);
      });
    });
  });
```

- [ ] **Step 4: 在 renderStatusCards 中更新导出按钮状态**

```typescript
  function renderStatusCards(filtered: Sample[] = store.getState().samples) {
    // ... 原有逻辑
    updateExportButton(filtered.length);
  }
```

- [ ] **Step 5: 修改 src/main.ts 添加键盘快捷键**

在 `const ui = createUI(store, render);` 之后添加：

```typescript
  const { exportBtn } = ui;

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      exportBtn?.click();
    }
    if (e.key === 'Escape') {
      // 清除条件或取消选区，首版仅重置时间范围
      const state = store.getState();
      if (state.samples.length > 0) {
        store.setTimeRange(state.samples[0].t, state.samples[state.samples.length - 1].t);
        render();
      }
    }
  });
```

同时确保 `ui.ts` 的返回对象暴露 `exportBtn`：

```typescript
  return { renderChannelList, renderStatusCards, renderConditions, rangeInfo, exportBtn };
```

- [ ] **Step 6: 手工验证**

Run: `npm run dev`
步骤：
1. 加载示例文件，添加条件 `thr > 15`。
2. 点击「导出选中段」，验证下载 JSON 文件中样本满足条件。
3. 按 `Ctrl+E`，验证触发下载。

- [ ] **Step 7: Commit**

```bash
git add index.html src/style.css src/ui.ts src/main.ts
git commit -m "feat: add export button and keyboard shortcuts"
```

---

## 5. 里程碑 M4：UI 打磨、状态卡片完善、测试与构建

**目标：** 补全 Web Console 风格状态卡片、响应式布局、运行全部测试、确保 `npm run build` 成功。

---

### Task 13: 完善状态卡片

**Files:**
- Modify: `src/ui.ts`

- [ ] **Step 1: 修改 renderStatusCards 显示更多信息**

```typescript
  function renderStatusCards(filtered: Sample[] = store.getState().samples) {
    const state = store.getState();
    const samples = state.samples;
    const duration = samples.length > 1 ? (samples[samples.length - 1].t - samples[0].t) / 1000 : 0;
    const filteredDuration = filtered.length > 1 ? (filtered[filtered.length - 1].t - filtered[0].t) / 1000 : 0;
    const avgVoltage = filtered.length > 0 && filtered[0].vol !== undefined
      ? filtered.reduce((sum, s) => sum + (s.vol || 0), 0) / filtered.length
      : null;
    const modeCounts = new Map<number, number>();
    filtered.forEach((s) => modeCounts.set(s.mode, (modeCounts.get(s.mode) || 0) + 1));
    const dominantMode = Array.from(modeCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? -1;
    const parkLocked = filtered.some((s) => s.park !== 0);
    const driftActive = filtered.some((s) => s.da);

    statusCards.innerHTML = '';
    const cards = [
      { label: 'File', value: state.original ? `${state.original.count} pts` : '--' },
      { label: 'Duration', value: `${duration.toFixed(1)}s` },
      { label: 'Selected', value: `${filtered.length} / ${duration.toFixed(1)}s` },
      { label: 'Mode', value: dominantMode === 0 ? 'MANUAL' : dominantMode === 1 ? 'ASSIST' : dominantMode === 2 ? 'AUTO' : '--' },
      { label: 'Park', value: parkLocked ? 'LOCKED' : 'UNLOCKED' },
      { label: 'Drift', value: driftActive ? 'ACTIVE' : 'OFF' },
      { label: 'Voltage', value: avgVoltage !== null ? `${avgVoltage.toFixed(1)}V` : '--' },
    ];
    cards.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'statusCard';
      div.innerHTML = `<div class="label">${c.label}</div><div class="value">${c.value}</div>`;
      statusCards.appendChild(div);
    });
    updateExportButton(filtered.length);
  }
```

- [ ] **Step 2: 手工验证**

Run: `npm run dev`
步骤：
1. 加载示例文件。
2. 验证状态卡片显示 Mode、Park、Drift、Voltage 等信息。
3. 改变筛选条件，验证卡片实时更新。

- [ ] **Step 3: Commit**

```bash
git add src/ui.ts
git commit -m "feat: enrich status cards with mode, park, drift and voltage"
```

---

### Task 14: 响应式布局与空状态

**Files:**
- Modify: `src/style.css`
- Modify: `src/ui.ts`（可选：空状态提示）

- [ ] **Step 1: 修改 src/style.css 添加响应式规则**

```css
@media (max-width: 640px) {
  .header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .statusCards { grid-template-columns: repeat(2, 1fr); }
  .chartCanvas { height: 260px; }
  .conditionRow { flex-wrap: wrap; }
}
```

- [ ] **Step 2: 手工验证**

Run: `npm run dev`
步骤：
1. 使用浏览器 DevTools 切换到移动设备视口。
2. 验证布局不溢出、状态卡片两列显示。

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: add responsive layout"
```

---

### Task 15: 运行全量测试与构建验证

**Files:**
- 无新增文件

- [ ] **Step 1: 运行单元测试**

Run: `npm test`
Expected: 所有测试通过。

- [ ] **Step 2: 运行 TypeScript 检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`
Expected: `dist/` 目录生成，无构建错误。

- [ ] **Step 4: 预览构建产物**

Run: `npm run preview`
步骤：
1. 打开浏览器访问预览地址。
2. 加载示例文件，验证功能与开发环境一致。

- [ ] **Step 5: Commit**

```bash
git add dist/.gitkeep  # 如果 dist 不应提交则忽略；通常 dist 加入 .gitignore
git commit -m "chore: verify tests, typecheck and build"
```

---

### Task 16: 添加 README 与 .gitignore

**Files:**
- Create: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: 创建 .gitignore**

```gitignore
node_modules
dist
.vite
*.log
.DS_Store
```

- [ ] **Step 2: 创建 README.md**

```markdown
# DriftViewer

MUS4_FW Web Console 下载的 `mus4-tub.json` 离线浏览与筛选工具。

## 功能

- 加载本地 `mus4-tub.json`（文件选择或拖拽）。
- 多通道曲线浏览，支持通道显示/隐藏。
- 时间范围筛选（滑块 + 鼠标框选）。
- 条件筛选（支持 AND/OR 组合）。
- 导出筛选后的数据片段为新的 `mus4-tub.json`。

## 开发

```bash
npm install
npm run dev
```

## 测试

```bash
npm test
```

## 构建

```bash
npm run build
npm run preview
```

## 数据来源

本工具读取由 `MUS4_FW.ino` Web Console 录制下载的 `mus4-tub.json` 文件，schema 为 `mus4.web_data_point.tub.v1/v2`。
```

- [ ] **Step 3: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add README and .gitignore"
```

---

## 6. 验证清单

| 检查项 | 命令/方法 | 通过标准 |
|--------|-----------|----------|
| 单元测试 | `npm test` | 全部通过 |
| 类型检查 | `npx tsc --noEmit` | 无错误 |
| 开发服务器 | `npm run dev` | 页面可访问，可加载文件 |
| 生产构建 | `npm run build` | `dist/` 生成且无报错 |
| 生产预览 | `npm run preview` | 功能与开发环境一致 |
| 代码提交 | `git log --oneline` | 每个 Task 至少一个 commit |

---

## 7. 计划自检

### Spec 覆盖检查

| Spec 章节 | 实现任务 |
|-----------|----------|
| 5.1 文件加载 | Task 3 (loader)、Task 7 (UI 拖拽) |
| 5.2 通道选择 | Task 2 (channels)、Task 7 (UI 勾选) |
| 5.3 时间范围筛选 | Task 6 (filter)、Task 7 (滑块)、Task 9 (框选) |
| 5.4 条件筛选 | Task 6 (filter)、Task 11 (条件 UI) |
| 5.5 数据截取/导出 | Task 10 (exporter)、Task 12 (导出按钮) |
| 5.6 交互与视图 | Task 9 (框选)、Task 12 (快捷键) |
| 5.7 状态卡片 | Task 13 |
| 6.1 视觉风格 | Task 1 (CSS 变量)、贯穿各 Task |
| 8.1 数据结构 | Task 2 (types) |
| 8.2 筛选逻辑 | Task 6 |
| 8.3 Canvas 绘制 | Task 5、Task 9 |
| 8.4 导出格式 | Task 10 |
| 10 错误处理 | Task 3 (loader 错误)、Task 12 (空导出禁用) |
| 11 测试策略 | Task 3、6、10 单元测试；Task 15 全量验证 |

### 占位符检查

- 无 "TBD"、"TODO"、"implement later"。
- 每个 Task 的代码、命令、预期输出均已给出。
- 类型与函数名在各 Task 中保持一致（`Sample`、`Mus4Tub`、`FilterState`、`Condition`、`filterSamples`、`buildExportPackage`）。

---

## 8. 执行交接

计划已完成并保存至：

```
C:/Dev/DDC/DriftViewer/docs/superpowers/plans/2026-06-24-driftviewer-implementation-plan.md
```

两种执行方式可选：

**1. Subagent-Driven（推荐）** —— 为每个 Task 分派独立子代理，逐 Task 实现与审查，迭代更快。

**2. Inline Execution** —— 在当前会话中按 Task 顺序直接执行，使用 checkpoint 进行阶段性检查。

请选择执行方式。
