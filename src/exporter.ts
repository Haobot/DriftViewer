import type { Mus4Tub, Sample } from './types';

export function buildExportPackage(original: Mus4Tub, samples: Sample[]): Mus4Tub {
  if (samples.length === 0) {
    throw new Error('No samples to export');
  }
  return {
    ...original,
    started_ms: samples[0].t,
    stopped_ms: samples[samples.length - 1].t,
    count: samples.length,
    samples,
  };
}
