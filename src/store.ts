import type { AppState, ChannelKey, FilterState, Mus4Tub, Sample } from './types';
import { getDefaultVisibleChannels } from './channels';

export function createEmptyFilter(): FilterState {
  return {
    timeStartMs: 0,
    timeEndMs: Infinity,
    visibleChannels: getDefaultVisibleChannels(),
    conditions: [],
  };
}

export function createStore() {
  const state: AppState = {
    original: null,
    samples: [],
    filter: createEmptyFilter(),
  };

  const listeners = new Set<() => void>();

  return {
    /**
     * Returns the current app state. The returned reference must be treated
     * as read-only; mutations should only be performed through the store's
     * setter methods so that subscribers are notified.
     */
    getState: () => state,
    setOriginal: (data: Mus4Tub, samples: Sample[]) => {
      state.original = data;
      state.samples = samples;
      if (samples.length > 0) {
        state.filter.timeStartMs = samples[0].t;
        state.filter.timeEndMs = samples[samples.length - 1].t;
      }
      listeners.forEach((fn) => fn());
    },
    setTimeRange: (start: number, end: number) => {
      state.filter.timeStartMs = start;
      state.filter.timeEndMs = end;
      listeners.forEach((fn) => fn());
    },
    setVisibleChannels: (channels: Set<ChannelKey>) => {
      state.filter.visibleChannels = channels;
      listeners.forEach((fn) => fn());
    },
    setConditions: (conditions: FilterState['conditions']) => {
      state.filter.conditions = conditions;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
