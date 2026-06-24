import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../store';
import type { Sample } from '../types';

const samples: Sample[] = [
  { seq: 1, t: 0, dt: 0, thr: 0, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
  { seq: 2, t: 10, dt: 10, thr: 50, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
  { seq: 3, t: 20, dt: 10, thr: 100, str: 0, mode: 0, park: 0, ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000, rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0 },
];

const original = {
  schema: 'test',
  source: 'test',
  started_ms: 0,
  stopped_ms: 20,
  count: samples.length,
  samples,
};

describe('createStore', () => {
  it('derives filteredSamples after setOriginal', () => {
    const store = createStore();

    store.setOriginal(original, samples);

    expect(store.getState().filteredSamples).toHaveLength(3);
  });

  it('recomputes filteredSamples when time range changes', () => {
    const store = createStore();
    store.setOriginal(original, samples);

    store.setTimeRange(10, 20);

    const filtered = store.getState().filteredSamples;
    expect(filtered).toHaveLength(2);
    expect(filtered.map((s) => s.seq)).toEqual([2, 3]);
  });

  it('notifies subscribers after filter recomputation', () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setOriginal(original, samples);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
