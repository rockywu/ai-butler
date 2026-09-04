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

  it('rejects throughput loss above 10 percent', () => {
    expect(
      evaluateBudget({
        bareP95Ms: 2,
        bareRequestsPerSecond: 10_000,
        frameworkP95Ms: 2.5,
        frameworkRequestsPerSecond: 8900,
      }),
    ).toEqual({
      latencyDeltaMs: 0.5,
      passed: false,
      throughputLossRatio: 0.11,
    });
  });

  it('rejects p95 latency delta above 1ms', () => {
    expect(
      evaluateBudget({
        bareP95Ms: 0,
        bareRequestsPerSecond: 10_000,
        frameworkP95Ms: 1.01,
        frameworkRequestsPerSecond: 9200,
      }),
    ).toEqual({
      latencyDeltaMs: 1.01,
      passed: false,
      throughputLossRatio: 0.08,
    });
  });
});
