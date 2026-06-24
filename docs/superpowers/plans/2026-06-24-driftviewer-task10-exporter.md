# Task 10: Exporter Module

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a pure `buildExportPackage` function that produces a `mus4-tub.json` fragment from original metadata and filtered samples.

**Architecture:** A single pure function in `src/exporter.ts` transforms data. It preserves all original metadata and recomputes only `started_ms`, `stopped_ms`, `count`, and `samples`. Unit tests in `src/__tests__/exporter.test.ts` cover happy path, empty samples, and single-sample edge cases.

**Tech Stack:** TypeScript, Vitest

---

## File structure

| File | Responsibility |
|------|----------------|
| `src/exporter.ts` | Pure export package builder |
| `src/__tests__/exporter.test.ts` | Unit tests for the builder |

---

### Task 1: Create `src/exporter.ts`

**Files:**
- Create: `src/exporter.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/exporter.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the test and verify it fails**

```bash
npx vitest run src/__tests__/exporter.test.ts
```

Expected: FAIL with "Cannot find module '../exporter'" or "buildExportPackage is not defined".

- [ ] **Step 3: Write minimal implementation**

Create `src/exporter.ts`:

```typescript
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
```

- [ ] **Step 4: Run the test and verify it passes**

```bash
npx vitest run src/__tests__/exporter.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/exporter.ts src/__tests__/exporter.test.ts
git commit -m "feat(exporter): add buildExportPackage and tests"
```

---

### Task 2: Verify End-to-End

**Files:**
- All of the above

- [ ] **Step 1: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Final commit**

```bash
git commit --allow-empty -m "feat: implement exporter module"
```

---

## Self-review

- **Spec coverage**: Each requirement in the Task 10 design doc is covered:
  - Pure builder function → Task 1
  - Preserves metadata → test 1
  - Recomputes bounds/count → test 1
  - Empty samples throws → test 2
  - Single sample edge case → test 3
  - Verification → Task 2
- **Placeholder scan**: No TBD/TODO placeholders.
- **Type consistency**: `buildExportPackage(original: Mus4Tub, samples: Sample[]): Mus4Tub` matches `Mus4Tub` and `Sample` types from `src/types.ts`.
