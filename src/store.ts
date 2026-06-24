import type { AppState, ChannelKey, FilterState, Mus4Tub, Sample } from './types';
import { getDefaultVisibleChannels } from './channels';
import { filterSamples } from './filter';

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
    filteredSamples: [],
  };

  const listeners = new Set<() => void>();

  const recompute = () => {
    state.filteredSamples = filterSamples(state.samples, state.filter);
  };
  recompute();

  return {
    /**
     * Returns a shallow snapshot of the current app state. The `samples` and
     * `filteredSamples` arrays are returned by reference for performance; treat
     * them as read-only. Mutations should only be performed through the store's
     * setter methods so that subscribers are notified.
     */
    getState: () => ({
      original: state.original,
      samples: state.samples,
      filter: {
        ...state.filter,
        visibleChannels: new Set(state.filter.visibleChannels),
        conditions: state.filter.conditions.map((c) => ({ ...c })),
      },
      filteredSamples: state.filteredSamples,
    }),
    setOriginal: (data: Mus4Tub, samples: Sample[]) => {
      state.original = data;
      state.samples = samples;
      if (samples.length > 0) {
        state.filter.timeStartMs = samples[0].t;
        state.filter.timeEndMs = samples[samples.length - 1].t;
      }
      recompute();
      listeners.forEach((fn) => fn());
    },
    setTimeRange: (start: number, end: number) => {
      state.filter.timeStartMs = start;
      state.filter.timeEndMs = end;
      recompute();
      listeners.forEach((fn) => fn());
    },
    setVisibleChannels: (channels: Set<ChannelKey>) => {
      state.filter.visibleChannels = channels;
      recompute();
      listeners.forEach((fn) => fn());
    },
    setConditions: (conditions: FilterState['conditions']) => {
      state.filter.conditions = conditions;
      recompute();
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
