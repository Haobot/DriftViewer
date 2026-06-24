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
