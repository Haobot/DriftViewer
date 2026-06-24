import { describe, it, expect } from 'vitest';
import { filterSamples } from '../filter';
import type { Sample, FilterState, ChannelKey } from '../types';

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
    visibleChannels: new Set(['thr', 'str', 'gz'] as ChannelKey[]),
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
    const state: FilterState = { ...baseFilter(), conditions: [{ channel: 'thr', op: '>', value: 15, combine: 'AND' }] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(2);
  });

  it('combines conditions with AND', () => {
    const state: FilterState = { ...baseFilter(), conditions: [
      { channel: 'thr', op: '>', value: 15, combine: 'AND' },
      { channel: 'mode', op: '==', value: 2, combine: 'AND' },
    ] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(1);
    expect(result[0].seq).toBe(3);
  });

  it('combines conditions with OR', () => {
    const state: FilterState = { ...baseFilter(), conditions: [
      { channel: 'mode', op: '==', value: 0, combine: 'AND' },
      { channel: 'mode', op: '==', value: 2, combine: 'OR' },
    ] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty samples', () => {
    expect(filterSamples([], baseFilter())).toHaveLength(0);
  });

  it('returns empty array when time range has no matches', () => {
    const state = { ...baseFilter(), timeStartMs: 5000, timeEndMs: 6000 };
    expect(filterSamples(makeSamples(), state)).toHaveLength(0);
  });

  it('supports != operator', () => {
    const state: FilterState = { ...baseFilter(), conditions: [{ channel: 'mode', op: '!=', value: 0, combine: 'AND' }] };
    const result = filterSamples(makeSamples(), state);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.mode !== 0)).toBe(true);
  });

  it('returns empty array when no condition matches', () => {
    const state: FilterState = { ...baseFilter(), conditions: [{ channel: 'thr', op: '>', value: 100, combine: 'AND' }] };
    expect(filterSamples(makeSamples(), state)).toHaveLength(0);
  });
});
