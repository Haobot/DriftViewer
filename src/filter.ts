import type { Sample, FilterState, Condition } from './types';

function evaluateCondition(s: Sample, cond: Condition): boolean {
  const value = s[cond.channel] ?? 0;
  switch (cond.op) {
    case '==': return value === cond.value;
    case '!=': return value !== cond.value;
    case '<':  return value < cond.value;
    case '<=': return value <= cond.value;
    case '>':  return value > cond.value;
    case '>=': return value >= cond.value;
    default:   return false;
  }
}

export function filterSamples(samples: Sample[], state: FilterState): Sample[] {
  return samples.filter((s) => {
    if (s.t < state.timeStartMs || s.t > state.timeEndMs) return false;
    if (state.conditions.length === 0) return true;
    let result = evaluateCondition(s, state.conditions[0]);
    for (let i = 1; i < state.conditions.length; i++) {
      const cond = state.conditions[i];
      const val = evaluateCondition(s, cond);
      result = cond.combine === 'AND' ? result && val : result || val;
    }
    return result;
  });
}
