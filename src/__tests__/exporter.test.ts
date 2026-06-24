import { describe, expect, it } from 'vitest';
import { buildExportPackage } from '../exporter';
import type { Mus4Tub, Sample } from '../types';

const baseSample: Sample = {
  seq: 1, t: 0, dt: 0, thr: 0, str: 0, mode: 0, park: 0,
  ch1: 1000, ch2: 1500, ch3: 1000, ch4: 1000, ch5: 1000, ch6: 1000,
  rct: 0, rcs: 0, pt: 0, ps: 0, gz: 0,
};

function makeSamples(count: number): Sample[] {
  return Array.from({ length: count }, (_, i) => ({ ...baseSample, seq: i + 1, t: i * 10 }));
}

const original: Mus4Tub = {
  schema: 'mus4.web_data_point.tub.v1',
  source: 'mus4-web-console',
  started_ms: 0,
  stopped_ms: 50,
  count: 6,
  samples: makeSamples(6),
};

describe('buildExportPackage', () => {
  it('preserves metadata and recomputes bounds for a subset', () => {
    const filtered = original.samples.slice(1, 4); // t = 10..30
    const result = buildExportPackage(original, filtered);
    expect(result.schema).toBe(original.schema);
    expect(result.source).toBe(original.source);
    expect(result.started_ms).toBe(10);
    expect(result.stopped_ms).toBe(30);
    expect(result.count).toBe(3);
    expect(result.samples).toBe(filtered);
  });

  it('throws when given no samples', () => {
    expect(() => buildExportPackage(original, [])).toThrow('No samples to export');
  });

  it('handles a single sample', () => {
    const single = [original.samples[2]];
    const result = buildExportPackage(original, single);
    expect(result.started_ms).toBe(20);
    expect(result.stopped_ms).toBe(20);
    expect(result.count).toBe(1);
  });
});
