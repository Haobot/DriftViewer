import type { Sample, ChannelKey } from './types';

export interface ChartConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}

interface Point { x: number; y: number; }

export function createChart(canvas: HTMLCanvasElement, config: ChartConfig) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  let dpr = window.devicePixelRatio || 1;

  const resize = () => {
    dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || config.width || 800;
    const h = canvas.clientHeight || config.height || 360;
    config.width = w;
    config.height = h;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawGrid = () => {
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
  };

  const drawSeries = (samples: Sample[], key: ChannelKey, color: string, min: number, max: number) => {
    if (samples.length < 2) return;
    const { width, height, padding } = config;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const tStart = samples[0].t;
    const tEnd = samples[samples.length - 1].t;
    const tRange = tEnd - tStart || 1;
    const valueRange = max - min;
    const midY = padding.top + plotH / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const x = padding.left + ((s.t - tStart) / tRange) * plotW;
      const normalized = valueRange === 0 ? 0 : 2 * ((Number(s[key] ?? 0) - min) / valueRange) - 1;
      const y = midY - normalized * (plotH / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const getMousePos = (e: MouseEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  let lastSamples: Sample[] = [];
  let lastVisibleChannels: Map<ChannelKey, { color: string; min: number; max: number }> = new Map();

  const drawSelection = (startX: number, endX: number) => {
    const { padding, height } = config;
    const plotH = height - padding.top - padding.bottom;
    const left = Math.min(startX, endX);
    const width = Math.abs(endX - startX);
    ctx.save();
    ctx.fillStyle = 'rgba(92, 200, 255, 0.15)';
    ctx.strokeStyle = 'rgba(92, 200, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.fillRect(left, padding.top, width, plotH);
    ctx.strokeRect(left, padding.top, width, plotH);
    ctx.restore();
  };

  const drawLeftYAxis = () => {
    const { height, padding } = config;
    const plotH = height - padding.top - padding.bottom;
    const x = padding.left;
    const minValue = -1;
    const maxValue = 1;

    ctx.save();
    ctx.strokeStyle = '#5a6b7d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    ctx.fillStyle = '#8fa1b5';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i * plotH) / 4;
      const ratio = 1 - i / 4;
      const value = minValue + ratio * (maxValue - minValue);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y);
      ctx.stroke();
      ctx.fillText(value.toFixed(1), x - 7, y);
    }
    ctx.restore();
  };

  const drawXAxis = () => {
    if (lastSamples.length < 2) return;
    const { width, height, padding } = config;
    const plotW = width - padding.left - padding.right;
    const y = height - padding.bottom;
    const tStart = lastSamples[0].t;
    const tEnd = lastSamples[lastSamples.length - 1].t;
    const tRange = tEnd - tStart || 1;
    const durationSeconds = tRange / 1000;
    const useDecimals = durationSeconds < 1;

    ctx.save();
    ctx.strokeStyle = '#5a6b7d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#8fa1b5';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (useDecimals) {
      const tickCount = Math.max(3, Math.min(6, Math.floor(plotW / 80)));
      for (let i = 0; i <= tickCount; i++) {
        const ratio = i / tickCount;
        const x = padding.left + ratio * plotW;
        const t = tStart + ratio * tRange;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
        ctx.fillText(`${(t / 1000).toFixed(2)}s`, x, y + 7);
      }
    } else {
      const rawStep = durationSeconds / 6;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalized = rawStep / magnitude;
      let step: number;
      if (normalized <= 1) step = 1 * magnitude;
      else if (normalized <= 2) step = 2 * magnitude;
      else if (normalized <= 5) step = 5 * magnitude;
      else step = 10 * magnitude;

      const startSec = Math.ceil((tStart / 1000) / step) * step;
      const endSec = Math.floor((tEnd / 1000) / step) * step;
      for (let sec = startSec; sec <= endSec + 1e-9; sec += step) {
        const t = sec * 1000;
        const ratio = (t - tStart) / tRange;
        const x = padding.left + clamp(ratio, 0, 1) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
        ctx.fillText(`${Math.round(sec)}s`, x, y + 7);
      }
    }
    ctx.restore();
  };

  const drawCrosshair = () => {
    if (!isHovering || lastSamples.length === 0) return;
    const { padding, height } = config;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hoverX, padding.top);
    ctx.lineTo(hoverX, height - padding.bottom);
    ctx.stroke();
    ctx.restore();
  };

  let isDragging = false;
  let dragStartX = 0;
  let dragEndX = 0;
  let isHovering = false;
  let hoverX = 0;
  let rangeCallback: ((startMs: number, endMs: number) => void) | null = null;
  let hoverCallback: ((info: { t: number; clientX: number; clientY: number; values: Map<ChannelKey, number> } | null) => void) | null = null;

  const xToTimeMs = (x: number): number => {
    if (lastSamples.length < 2) return 0;
    const { padding, width } = config;
    const plotW = width - padding.left - padding.right;
    const tStart = lastSamples[0].t;
    const tEnd = lastSamples[lastSamples.length - 1].t;
    const ratio = clamp((x - padding.left) / plotW, 0, 1);
    const ms = tStart + ratio * (tEnd - tStart);
    let closest = lastSamples[0].t;
    let best = Infinity;
    for (const s of lastSamples) {
      const d = Math.abs(s.t - ms);
      if (d < best) {
        best = d;
        closest = s.t;
      }
    }
    return closest;
  };

  const findNearestSample = (x: number): Sample | null => {
    if (lastSamples.length === 0) return null;
    const { padding, width } = config;
    const plotW = width - padding.left - padding.right;
    const ratio = clamp((x - padding.left) / plotW, 0, 1);
    const tStart = lastSamples[0].t;
    const tEnd = lastSamples[lastSamples.length - 1].t;
    const targetT = tStart + ratio * (tEnd - tStart);
    let closest: Sample | null = null;
    let best = Infinity;
    for (const s of lastSamples) {
      const d = Math.abs(s.t - targetT);
      if (d < best) {
        best = d;
        closest = s;
      }
    }
    return closest;
  };

  canvas.addEventListener('mousedown', (e) => {
    if (lastSamples.length < 2) return;
    const pos = getMousePos(e);
    isDragging = true;
    dragStartX = clamp(pos.x, config.padding.left, config.width - config.padding.right);
    dragEndX = dragStartX;
  });

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const pos = getMousePos(e);
    dragEndX = clamp(pos.x, config.padding.left, config.width - config.padding.right);
    draw(lastSamples, lastVisibleChannels);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    if (Math.abs(dragEndX - dragStartX) > 4 && rangeCallback) {
      rangeCallback(xToTimeMs(dragStartX), xToTimeMs(dragEndX));
    }
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (isDragging || lastSamples.length === 0 || !hoverCallback) return;
    const pos = getMousePos(e);
    hoverX = clamp(pos.x, config.padding.left, config.width - config.padding.right);
    isHovering = true;
    draw(lastSamples, lastVisibleChannels);
    const s = findNearestSample(pos.x);
    if (!s) {
      hoverCallback(null);
      return;
    }
    const values = new Map<ChannelKey, number>();
    for (const key of lastVisibleChannels.keys()) {
      values.set(key, Number(s[key] ?? 0));
    }
    hoverCallback({ t: s.t, clientX: e.clientX, clientY: e.clientY, values });
  };

  const handleCanvasMouseLeave = () => {
    isHovering = false;
    draw(lastSamples, lastVisibleChannels);
    if (hoverCallback) hoverCallback(null);
  };

  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseleave', handleCanvasMouseLeave);

  const draw = (samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max: number }>) => {
    lastSamples = samples;
    lastVisibleChannels = visibleChannels;
    drawGrid();
    for (const [key, meta] of visibleChannels) {
      drawSeries(samples, key, meta.color, meta.min, meta.max);
    }
    drawLeftYAxis();
    drawXAxis();
    drawCrosshair();
    if (isDragging) {
      drawSelection(dragStartX, dragEndX);
    }
  };

  resize();

  return {
    resize,
    draw,
    onRangeSelect: (callback: (startMs: number, endMs: number) => void) => {
      rangeCallback = callback;
      return () => { rangeCallback = null; };
    },
    cancelDrag: () => {
      if (!isDragging) return;
      isDragging = false;
      dragStartX = 0;
      dragEndX = 0;
      draw(lastSamples, lastVisibleChannels);
    },
    onHover: (callback: (info: { t: number; clientX: number; clientY: number; values: Map<ChannelKey, number> } | null) => void) => {
      hoverCallback = callback;
      return () => { hoverCallback = null; };
    },
    destroy: () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseleave', handleCanvasMouseLeave);
    },
  };
}
