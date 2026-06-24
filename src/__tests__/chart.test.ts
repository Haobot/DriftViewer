import { describe, expect, it, vi } from 'vitest';
import { createChart } from '../chart';
import type { Sample, ChannelKey } from '../types';

const SAMPLE: Sample = {
  seq: 1, t: 0, dt: 0, thr: 0, str: 0, mode: 0, park: 0,
  ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000,
  rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0,
};

function makeSamples(count: number): Sample[] {
  return Array.from({ length: count }, (_, i) => ({ ...SAMPLE, seq: i + 1, t: i * 10 }));
}

function makeContext(): CanvasRenderingContext2D {
  return {
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = makeContext();
  canvas.getContext = vi.fn((type: string) => (type === '2d' ? ctx : null)) as typeof canvas.getContext;
  canvas.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 400,
    height: 360,
    top: 0,
    left: 0,
    right: 400,
    bottom: 360,
    toJSON: () => ({}),
  }));
  return canvas;
}

const CONFIG = {
  width: 400,
  height: 360,
  padding: { top: 20, right: 20, bottom: 30, left: 44 },
};

describe('createChart range selection', () => {
  it('calls onRangeSelect with a normalized time range after drag', () => {
    const canvas = makeCanvas();
    const chart = createChart(canvas, CONFIG);
    const samples = makeSamples(11);
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();

    chart.draw(samples, visible);

    const callback = vi.fn();
    chart.onRangeSelect(callback);

    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 60, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 100 }));

    expect(callback).toHaveBeenCalled();

    const [startMs, endMs] = callback.mock.calls[callback.mock.calls.length - 1] as [number, number];

    expect(startMs).toBeLessThan(endMs);
    expect(startMs).toBeGreaterThanOrEqual(0);
    expect(endMs).toBeLessThanOrEqual(100);
    expect(startMs % 10).toBe(0);
    expect(endMs % 10).toBe(0);

    chart.destroy();
  });

  it('ignores tiny drags', () => {
    const canvas = makeCanvas();
    const chart = createChart(canvas, CONFIG);
    const samples = makeSamples(11);
    const visible = new Map<ChannelKey, { color: string; min: number; max: number }>();

    chart.draw(samples, visible);

    const callback = vi.fn();
    chart.onRangeSelect(callback);

    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 102, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 102, clientY: 100 }));

    expect(callback).not.toHaveBeenCalled();

    chart.destroy();
  });
});
