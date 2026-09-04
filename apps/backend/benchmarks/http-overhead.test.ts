import { describe, expect, it } from 'vitest';

import { evaluateBudget, percentile } from './http-overhead';

describe('hTTP benchmark math', () => {
  it('calculates p95 and relative throughput loss', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95)).toBe(10);
    expect(
      evaluateBudget({
        bareP95Ms: 2,
        bareRequestsPerSecond: 10_000,
        frameworkP95Ms: 2.5,
        frameworkRequestsPerSecond: 9200,
      }),
    ).toEqual({
      latencyDeltaMs: 0.5,
      passed: true,
      throughputLossRatio: 0.08,
    });
  });
});
