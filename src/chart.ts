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

  const draw = (samples: Sample[], visibleChannels: Map<ChannelKey, { color: string; min: number; max: number }>) => {
    drawGrid();
    for (const [key, meta] of visibleChannels) {
      drawSeries(samples, key, meta.color, meta.min, meta.max);
    }
  };

  resize();

  return { resize, draw };
}
