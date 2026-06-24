> # DriftViewer

一个基于浏览器的 mus4-tub JSON 数据可视化工具。支持拖拽上传、时间范围筛选、通道切换、条件过滤、鼠标框选、数据导出等功能。

## 功能

- 📂 拖拽或点击上传 `mus4-tub.json` 文件
- 📈 Canvas 绘制多通道时序曲线
- ⏱️ 时间范围滑块 + 鼠标框选
- 🎚️ 通道显示/隐藏
- 🔍 条件筛选（支持 AND/OR 组合）
- 💾 导出过滤后的 JSON 数据
- ⌨️ 键盘快捷键
- 📱 响应式布局

## 技术栈

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)
- 原生 Canvas 2D API

## 快速开始

```bash
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5175/`。

## 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm test` | 运行单元测试 |
| `npx tsc --noEmit` | 类型检查 |

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `R` | 重置时间范围到完整数据 |
| `Ctrl/Cmd + E` | 导出当前过滤结果 |
| `Esc` | 取消正在进行的框选 |

## 数据格式

本工具读取 `mus4.web_data_point.tub.v1` 格式的 JSON 文件，包含以下字段：

```json
{
  "schema": "mus4.web_data_point.tub.v1",
  "source": "...",
  "started_ms": 0,
  "stopped_ms": 1000,
  "count": 101,
  "samples": [
    {
      "seq": 1,
      "t": 0,
      "dt": 0,
      "thr": 0,
      "str": 0,
      "mode": 0,
      "park": 0,
      "ch1": 1000,
      "ch2": 1500,
      "ch3": 1000,
      "ch4": 1000,
      "ch5": 1000,
      "ch6": 1000,
      "rct": 0,
      "rcs": 0,
      "pt": 0,
      "ps": 0,
      "gz": 0
    }
  ]
}
```

## 项目结构

```
src/
  channels.ts      # 通道元数据
  chart.ts         # Canvas 图表与鼠标框选
  exporter.ts      # 数据导出
  filter.ts        # 样本过滤
  loader.ts        # JSON 加载
  main.ts          # 应用入口
  store.ts         # 状态管理
  style.css        # 样式
  types.ts         # 类型定义
  ui.ts            # UI 渲染与交互
  __tests__/       # 单元测试
```

## 许可证

MIT
