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

export function downloadExport(data: Mus4Tub, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `mus4-tub-${data.started_ms}-${data.stopped_ms}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
