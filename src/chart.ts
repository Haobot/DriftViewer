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
    canvas.width = config.width * dpr;
    canvas.height = config.height * dpr;
    canvas.style.width = `${config.width}px`;
    canvas.style.height = `${config.height}px`;
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
      const y = valueRange === 0
        ? midY
        : padding.top + (1 - (Number(s[key] ?? 0) - min) / valueRange) * plotH;
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

  let isDragging = false;
  let dragStartX = 0;
  let dragEndX = 0;
  let rangeCallback: ((startMs: number, endMs: number) => void) | null = null;

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

  const draw = (samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max: number }>) => {
    lastSamples = samples;
    drawGrid();
    for (const [key, meta] of visibleChannels) {
      drawSeries(samples, key, meta.color, meta.min, meta.max);
    }
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
    destroy: () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },
  };
}
