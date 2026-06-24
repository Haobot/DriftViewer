import type { Mus4Tub, Sample } from './types';

const SUPPORTED_SCHEMAS = new Set([
  'mus4.web_data_point.tub.v1',
  'mus4.web_data_point.tub.v2',
]);

export type LoadResult = {
  ok: true;
  data: Mus4Tub;
  samples: Sample[];
} | {
  ok: false;
  error: string;
};

export function parseMus4Tub(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: '无法解析 JSON' };
  }

  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'JSON 根节点不是对象' };
  }

  const data = raw as Record<string, unknown>;
  const schema = typeof data.schema === 'string' ? data.schema : '';

  if (!SUPPORTED_SCHEMAS.has(schema)) {
    return { ok: false, error: `不支持的 schema：${schema || '<空>'}` };
  }

  if (!Array.isArray(data.samples)) {
    return { ok: false, error: '缺少 samples 数组' };
  }

  const samples: Sample[] = [];
  for (let index = 0; index < data.samples.length; index++) {
    const item = data.samples[index];
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `samples[${index}] 不是对象` };
    }
    const s = item as Record<string, unknown>;
    samples.push({
      seq: Number(s.seq ?? 0),
      t: Number(s.t ?? 0),
      dt: Number(s.dt ?? 0),
      thr: Number(s.thr ?? 0),
      str: Number(s.str ?? 0),
      mode: Number(s.mode ?? 0),
      park: Number(s.park ?? 0),
      ch1: Number(s.ch1 ?? 0),
      ch2: Number(s.ch2 ?? 0),
      ch3: Number(s.ch3 ?? 0),
      ch4: Number(s.ch4 ?? 0),
      ch5: Number(s.ch5 ?? 0),
      ch6: Number(s.ch6 ?? 0),
      rct: Number(s.rct ?? 0),
      rcs: Number(s.rcs ?? 0),
      pt: Number(s.pt ?? 0),
      ps: Number(s.ps ?? 0),
      gz: Number(s.gz ?? 0),
      gx: s.gx !== undefined ? Number(s.gx) : undefined,
      gy: s.gy !== undefined ? Number(s.gy) : undefined,
      ax: s.ax !== undefined ? Number(s.ax) : undefined,
      ay: s.ay !== undefined ? Number(s.ay) : undefined,
      az: s.az !== undefined ? Number(s.az) : undefined,
      gzf: s.gzf !== undefined ? Number(s.gzf) : undefined,
      cur: s.cur !== undefined ? Number(s.cur) : undefined,
      vol: s.vol !== undefined ? Number(s.vol) : undefined,
      de: s.de !== undefined ? Number(s.de) : undefined,
      da: s.da !== undefined ? Number(s.da) : undefined,
      dc: s.dc !== undefined ? Number(s.dc) : undefined,
    });
  }

  const tub: Mus4Tub = {
    schema,
    source: typeof data.source === 'string' ? data.source : 'mus4-web-console',
    started_ms: Number(data.started_ms ?? 0),
    stopped_ms: Number(data.stopped_ms ?? 0),
    count: Number(data.count ?? samples.length),
    samples,
  };

  return { ok: true, data: tub, samples };
}

export function loadFile(file: File): Promise<LoadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      resolve(parseMus4Tub(text));
    };
    reader.onerror = () => resolve({ ok: false, error: '文件读取失败' });
    reader.onabort = () => resolve({ ok: false, error: '文件读取已取消' });
    reader.readAsText(file);
  });
}
