export interface Mus4Tub {
  schema: string;
  source: string;
  started_ms: number;
  stopped_ms: number;
  count: number;
  samples: Sample[];
}

export interface Sample {
  seq: number;
  t: number;
  dt: number;
  thr: number;
  str: number;
  mode: number;
  park: number;
  ch1: number;
  ch2: number;
  ch3: number;
  ch4: number;
  ch5: number;
  ch6: number;
  rct: number;
  rcs: number;
  pt: number;
  ps: number;
  gz: number;
  gx?: number;
  gy?: number;
  ax?: number;
  ay?: number;
  az?: number;
  gzf?: number;
  cur?: number;
  vol?: number;
  de?: number;
  da?: number;
  dc?: number;
}

export type ChannelKey = Exclude<keyof Sample, 'seq' | 't' | 'dt'>;

export interface ChannelDef {
  key: ChannelKey;
  label: string;
  color: string;
  unit?: string;
  defaultVisible?: boolean;
  category: string;
}

export interface Condition {
  channel: ChannelKey;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: number;
  combine: 'AND' | 'OR';
}

export interface FilterState {
  timeStartMs: number;
  timeEndMs: number;
  visibleChannels: Set<ChannelKey>;
  conditions: Condition[];
}

export interface AppState {
  original: Mus4Tub | null;
  samples: Sample[];
  filter: FilterState;
  filteredSamples: Sample[];
}
