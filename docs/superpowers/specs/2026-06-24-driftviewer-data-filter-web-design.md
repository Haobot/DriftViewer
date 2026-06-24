# DriftViewer 数据筛选网页设计方案

## 1. 背景与目标

### 1.1 背景

`C:\Dev\DDC\Firmware\MUS4_FW\MUS4_FW.ino` 的 Web Console 已经支持：

- 通过 `/api/data?since=<seq>` 拉取实时遥测曲线（Throttle / Steering / GyroZ）。
- 通过 WebSocket 二进制通道低延迟推送曲线数据。
- 通过页面上的「录制」按钮把遥测点累积到浏览器内存，停止后以下载 `mus4-tub.json` 的方式保存到电脑。

当前用户在 Web Console 中录制并下载数据已经成功，但下载后的 `mus4-tub.json` 缺少一个离线浏览、筛选和截取曲线数据的工具。

### 1.2 目标

在 `C:\Dev\DDC\DriftViewer` 中开发一个与 MUS4_FW Web Console 风格相似的**离线数据筛选网页**，用于：

1. 加载本地 `mus4-tub.json` 文件。
2. 以曲线方式浏览所有通道（与 Web Console 类似的暗色主题、Canvas 绘图）。
3. 按时间范围、通道、条件表达式筛选并高亮数据段。
4. 截取（裁剪）选中的数据段，导出为新的 `mus4-tub.json` 片段。
5. 完全在浏览器端运行，不依赖后端服务，保护数据隐私。

### 1.3 非目标

- 不修改 MUS4_FW 固件代码或 Web Console 行为。
- 不做模型训练、神经网络推理等下游任务。
- 不引入用户账号、云端同步或数据上传。
- 不替代 Web Console 的实时功能；DriftViewer 只处理已下载的离线文件。

---

## 2. 现有数据格式

### 2.1 Web Console 下载的 Tub JSON

文件示例（已脱敏）：

```json
{
  "schema": "mus4.web_data_point.tub.v1",
  "source": "mus4-web-console",
  "started_ms": 238122,
  "stopped_ms": 241521,
  "count": 160,
  "samples": [
    {
      "seq": 11194,
      "t": 238122,
      "dt": 22,
      "thr": 2,
      "str": -10,
      "mode": 0,
      "park": 0,
      "ch1": 1436,
      "ch2": 1537,
      "ch3": 999,
      "ch4": 1000,
      "ch5": 2000,
      "ch6": 1373,
      "rct": 1537,
      "rcs": 1436,
      "pt": 0,
      "ps": 0,
      "gz": 0.0021316998172551394,
      "gzf": 0.004646481014788151,
      "dc": 0,
      "de": 1,
      "da": 0,
      "vol": 11.605140686035156
    }
  ]
}
```

### 2.2 字段清单

| 字段 | 含义 | 单位/范围 |
|------|------|-----------|
| `seq` | 全局递增序列号 | uint32 |
| `t` | 固件时间戳 | ms |
| `dt` | 与上一点的间隔 | ms |
| `thr` | 输出油门 | -100 ~ 100 |
| `str` | 输出转向 | -100 ~ 100 |
| `mode` | 驾驶模式 | 0=MANUAL, 1=ASSIST, 2=AUTO |
| `park` | Park 状态 | 0=UNLOCKED, 1=LOCKED |
| `ch1` ~ `ch6` | RC 原始通道 PWM | μs，约 1000~2000 |
| `rct` / `rcs` | RC 油门/转向 | -100 ~ 100 |
| `pt` / `ps` | Pilot 油门/转向 | -100 ~ 100 |
| `cur` | 电流 | mA |
| `vol` | 电压 | V |
| `gz` / `gx` / `gy` | 陀螺仪 Z/X/Y | rad/s |
| `ax` / `ay` / `az` | 加速度 X/Y/Z | m/s² |
| `de` | Drift 使能 | 0/1 |
| `da` | Drift 激活 | 0/1 |
| `dc` | Drift 补偿 | -70 ~ 70 |
| `gzf` | 滤波后 GyroZ | rad/s |

### 2.3 Web Console 实时接口（供参考）

- `GET /api/data?since=<seq>` → `{"points": [...], "latest": {...}}`
- `points` 仅包含轻量字段：`seq, t, dt, thr, str, gz`。
- `latest` 包含完整字段（与 Tub JSON 样本一致）。
- WebSocket 二进制协议字段顺序见 `WebConsoleAssets.h` 的 `decodeBinaryDataPayload`。

---

## 3. 候选方案

### 方案 A：纯静态单文件 HTML/JS

**做法**：把所有 HTML、CSS、JavaScript 打包进一个 `index.html`，通过 `<input type="file">` 加载本地 JSON。

**优点**：

- 零构建、零依赖，双击即可在浏览器打开。
- 与 Web Console 的 "PROGMEM 单文件" 风格一致。
- 不需要 Node.js、包管理器或构建脚本。

**缺点**：

- 随着功能增加，单文件会迅速膨胀，难以维护。
- 没有类型检查，容易在字段名、数据类型上出错。
- 难以写单元测试。

### 方案 B：Vite + TypeScript 模块化应用（推荐）

**做法**：使用 Vite 作为构建工具，TypeScript 开发，按功能拆分为多个模块；最终产物为静态文件，可部署到任意静态服务器或直接用 `vite preview` 打开。

**优点**：

- 类型安全，字段与 JSON schema 对齐。
- 模块清晰（数据加载、筛选、渲染、导出分离）。
- 现代开发体验（热更新、ESM、可选 UI 组件库）。
- 构建产物仍是纯静态文件，部署简单。

**缺点**：

- 需要 Node.js 和一次 `npm install`。
- 比单文件方案多一个构建步骤。

### 方案 C：Python + Web 框架（Flask/FastAPI）

**做法**：用 Python 读取本地 JSON，后端做筛选和裁剪，前端仅负责展示。

**优点**：

- 可利用现有 Python 工具链（如 `tools/train_tub_driver.py`）。
- 适合后续扩展批量处理、模型训练 pipeline。

**缺点**：

- 对于「本地看文件」这个场景过于重量级。
- 需要启动后端服务，使用门槛高于纯前端方案。
- 与 Web Console 的「浏览器单页应用」体验不一致。

### 推荐

**采用方案 B：Vite + TypeScript 模块化应用**。它在可维护性、类型安全和部署便捷性之间取得平衡，同时保留与 Web Console 相似的视觉风格和纯浏览器运行特性。

---

## 4. 架构设计

### 4.1 总体架构

```
┌─────────────────────────────────────────────────────────┐
│                     DriftViewer (Browser)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  FileLoader │  │  FilterPanel │  │  ChartRenderer  │  │
│  │  (加载 JSON) │  │  (筛选条件)  │  │  (Canvas 曲线)  │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│         └────────────────┼───────────────────┘           │
│                          ▼                               │
│                  ┌───────────────┐                       │
│                  │  SampleStore  │                       │
│                  │  (内存数据集)  │                       │
│                  └───────┬───────┘                       │
│                          │                               │
│                          ▼                               │
│                  ┌───────────────┐                       │
│                  │  Exporter     │                       │
│                  │  (导出片段)   │                        │
│                  └───────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 模块职责

| 模块 | 文件 | 职责 |
|------|------|------|
| `types` | `src/types.ts` | 定义 `Mus4Tub`、`Sample`、`ChannelKey`、`Filter` 等类型。 |
| `loader` | `src/loader.ts` | 通过 `<input type="file">` 读取 JSON，校验 schema，解析样本。 |
| `store` | `src/store.ts` | 保存原始样本、当前筛选条件、选中时间范围。 |
| `filter` | `src/filter.ts` | 根据时间范围、通道值范围、布尔条件、表达式过滤样本。 |
| `chart` | `src/chart.ts` | Canvas 绘制多通道曲线、网格、游标、选区。 |
| `exporter` | `src/exporter.ts` | 将筛选后的样本重新组装为 `mus4-tub.json` 并触发下载。 |
| `ui` | `src/ui.ts` / 组件 | 状态卡片、通道图例、筛选面板、工具栏。 |
| `main` | `src/main.ts` | 初始化、事件绑定、模块协调。 |

### 4.3 技术栈

- **构建工具**：Vite 6
- **语言**：TypeScript 5
- **样式**：原生 CSS，复用 Web Console 暗色主题变量
- **绘图**：HTML5 Canvas 2D（与 Web Console 一致）
- **测试**：Vitest（可选，首版可只加数据解析/筛选单元测试）
- **包管理器**：npm

---

## 5. 功能设计

### 5.1 文件加载

- 页面顶部提供「打开文件」按钮，支持选择本地 `mus4-tub.json`。
- 支持拖拽文件到页面加载。
- 加载后显示：文件名、schema 版本、样本总数、时间跨度、采样率估算。
- 若 schema 不兼容（既不是 `v1` 也不是 `v2`），给出明确错误提示。

### 5.2 通道选择与显示

- 默认显示与 Web Console 一致的 3 条曲线：`thr`（绿色）、`str`（蓝色）、`gz`（红色）。
- 提供通道列表，用户可勾选/取消勾选任意通道：
  - 输出：`thr`, `str`
  - RC 原始：`ch1` ~ `ch6`
  - RC 解析：`rct`, `rcs`
  - Pilot：`pt`, `ps`
  - IMU：`gz`, `gx`, `gy`, `ax`, `ay`, `az`, `gzf`
  - 状态：`mode`, `park`, `de`, `da`, `dc`
  - 电源：`cur`, `vol`
- 每个通道自动计算 Y 轴范围（最小/最大值），或在用户指定范围时固定。
- 通道过多时，通过右侧图例垂直滚动或折叠分类。

### 5.3 时间范围筛选

- 图表下方提供时间滑块（双滑块），用于设置起止时间。
- 支持鼠标在 Canvas 上框选时间范围。
- 提供「重置范围」按钮恢复全量。
- 选中范围后，统计信息实时更新：样本数、持续时间、平均采样率。

### 5.4 条件筛选

- 提供条件表达式输入框，例如：
  - `ch2 > 1500` — 只保留油门 RC 通道大于 1500 μs 的段。
  - `mode == 2 && thr > 50` — 自动模式下油门大于 50 的段。
  - `park == 0` — 排除 Park Locked 状态。
- 表达式中可用的变量为所有通道字段名。
- 条件筛选结果默认采用「仅显示满足条件的数据点」；可选切换为「高亮显示」模式（不满足条件的点置灰，满足条件的点保持原色）。
- 支持多个条件组合（AND / OR），通过简单 UI 添加/删除条件行。第一个条件的 `combine` 字段无效，后续条件依次按 AND/OR 与前序结果组合。

### 5.5 数据截取与导出

- 用户确定时间范围和/或条件后，点击「导出选中段」。
- 导出文件保持 `mus4-web-console` source 和原始 schema 版本。
- `started_ms` / `stopped_ms` / `count` 按选中样本重新计算。
- 默认文件名：`mus4-tub-<开始时间>-<结束时间>.json`。
- 导出前预览片段信息（样本数、时间跨度）。

### 5.6 交互与视图

- 鼠标悬停显示当前时间点的所有通道数值（Tooltip）。
- 滚轮缩放时间轴，Shift+滚轮平移。
- 键盘快捷键：
  - `R`：重置视图到全量时间范围。
  - `Ctrl/Cmd + E`：导出当前选中段。
  - `Esc`：取消当前框选或清除条件输入框焦点。
- 响应式布局：在窄屏下将图例放到图表下方。

### 5.7 状态卡片（与 Web Console 对齐）

页面顶部保留类似 Web Console 的状态卡片：

- `File`：文件名 / 样本数 / 时长
- `Mode`：当前鼠标位置或选中段的主导 mode
- `Park`：选中段是否包含 Park Locked
- `Drift`：drift 激活比例
- `Voltage`：平均电压 / 最小电压

---

## 6. UI/UX 设计

### 6.1 视觉风格

直接复用 Web Console 的设计语言：

- 背景：`#101318`
- 面板：`#171c24`，边框 `#2b3441`
- 主强调色：`#5cc8ff`（蓝）、`#39d98a`（绿）、`#ff6b6b`（红）
- 字体：`system-ui, sans-serif`
- 圆角：`8px` 面板、`999px` 按钮

### 6.2 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  DriftViewer            [打开文件]  [导出]  [帮助]       │
├─────────────────────────────────────────────────────────┤
│  [File] [Mode] [Park] [Drift] [Voltage]  状态卡片        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                      Canvas 曲线区                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  时间范围： [开始] ─────────── [结束]  [重置]            │
├─────────────────────────────────────────────────────────┤
│  通道： ☑ thr ☑ str ☑ gz ...                            │
├─────────────────────────────────────────────────────────┤
│  条件：  [字段 ▼] [操作符 ▼] [值 ▼] [+]                  │
├─────────────────────────────────────────────────────────┤
│  选中段信息：160 样本 / 3.4s                              │
└─────────────────────────────────────────────────────────┘
```

### 6.3 空状态

- 未加载文件时，中央显示提示：「拖拽 mus4-tub.json 到此处，或点击打开文件」。
- 提供示例数据下载链接（可选，用于测试 UI）。

---

## 7. 数据流

```
1. 用户选择文件
   ↓
2. Loader 读取 → 解析 JSON → 校验 schema → 生成 Sample[]
   ↓
3. Store 保存原始数据
   ↓
4. 用户调整时间范围 / 通道 / 条件
   ↓
5. Filter 计算可见样本 filteredSamples
   ↓
6. Chart 根据 filteredSamples 和可见通道重绘
   ↓
7. 用户点击导出
   ↓
8. Exporter 用 filteredSamples 生成新 Tub JSON → Blob → 下载
```

---

## 8. 关键实现细节

### 8.1 数据结构

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

export interface ChannelDef {
  key: keyof Sample;
  label: string;
  color: string;
  unit?: string;
  defaultVisible?: boolean;
}

export interface FilterState {
  timeStartMs: number;
  timeEndMs: number;
  visibleChannels: Set<string>;
  conditions: Condition[];
}

export interface Condition {
  channel: keyof Sample;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: number;
  combine: 'AND' | 'OR';
}
```

### 8.2 筛选逻辑

```typescript
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

export function filterSamples(
  samples: Sample[],
  state: FilterState
): Sample[] {
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

### 8.3 Canvas 绘制策略

- 使用 `devicePixelRatio` 适配高分屏。
- 对每条可见通道，按时间映射到 X 坐标，按值映射到 Y 坐标。
- 当数据点超过 Canvas 像素宽度时，对相邻点做桶聚合（min/max/mean），避免 overdraw。
- 绘制网格、Y 轴标签、X 轴时间标签、通道图例。
- 绘制选中时间范围的半透明遮罩。

### 8.4 导出文件格式

导出文件保持与原文件一致的 schema，仅更新外层元信息：

```typescript
export function buildExportPackage(
  original: Mus4Tub,
  samples: Sample[]
): Mus4Tub {
  if (samples.length === 0) throw new Error('No samples to export');
  return {
    ...original,
    started_ms: samples[0].t,
    stopped_ms: samples[samples.length - 1].t,
    count: samples.length,
    samples,
  };
}
```

---

## 9. 项目结构

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
    ├── ui.ts
    ├── channels.ts
    ├── style.css
    └── __tests__/
        ├── loader.test.ts
        ├── filter.test.ts
        └── exporter.test.ts
```

---

## 10. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 文件不是 JSON | 弹窗/Toast 提示「无法解析 JSON」 |
| schema 不兼容 | 提示「不支持的 schema：xxx，仅支持 mus4.web_data_point.tub.v1/v2」 |
| 样本为空 | 提示「文件不包含任何样本」 |
| 筛选结果为空 | 禁用导出按钮，提示「当前筛选条件没有匹配样本」 |
| 表达式语法错误 | 高亮输入框，给出示例 |

---

## 11. 测试策略

- **单元测试**：使用 Vitest 覆盖 `loader.ts`、`filter.ts`、`exporter.ts`。
- **集成测试**：使用 Playwright 加载示例文件，验证图表渲染、筛选、导出文件名。
- **手工测试**：用真实 `mus4-tub.json` 验证大文件（>12000 样本）性能。

---

## 12. 迭代计划（建议）

| 阶段 | 内容 | 交付物 |
|------|------|--------|
| M1 | 项目初始化、文件加载、基础 Canvas 绘图 | 可看单条曲线的网页 |
| M2 | 多通道切换、时间范围筛选、鼠标交互 | 可浏览多通道并框选 |
| M3 | 条件筛选、数据导出 | 可截取并下载片段 |
| M4 | 状态卡片、快捷键、响应式、测试 | 与 Web Console 体验对齐 |

---

## 13. 与 Web Console 的对应关系

| Web Console | DriftViewer |
|-------------|-------------|
| `/api/data` 实时拉取 | 加载本地 `mus4-tub.json` |
| Canvas 实时曲线 | Canvas 离线曲线 |
| 顶部状态卡片 | 文件/选中段统计卡片 |
| Tub 录制/下载 | 文件加载/片段导出 |
| 暗色主题 | 复用相同配色 |

---

## 14. 待确认事项（设计评审后决定）

1. 是否需要同时支持从 Web Console 直接「打开到 DriftViewer」？（例如通过 URL 参数预加载）
2. 是否需要把筛选后的数据也导出为 CSV，方便用 Excel / Python 分析？
3. 是否需要在 DriftViewer 中同时显示多个文件对比？
4. 是否采用第三方图表库（如 Chart.js / uPlot）替代自研 Canvas 绘制？
5. 是否需要把项目部署到 GitHub Pages，方便在线访问？
