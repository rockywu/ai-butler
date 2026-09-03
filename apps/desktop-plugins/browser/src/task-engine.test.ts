import type { PlaywrightDriver } from './task-engine';
import type { TaskDocument, TaskStep } from './task-types';

import { describe, expect, it } from 'vitest';

import { MockAiVerifier } from './ai-verifier';
import { runTask } from './task-engine';

function createRecordingDriver(
  impl?: PlaywrightDriver['invoke'],
): PlaywrightDriver & { calls: Array<[string, string, unknown[]]> } {
  const calls: Array<[string, string, unknown[]]> = [];
  return {
    calls,
    async invoke(target, method, args) {
      calls.push([target, method, args]);
      if (impl) return impl(target, method, args);
      if (target === 'context' && method === 'newPage') return 'page-1';
      return undefined;
    },
  };
}

const sampleTask: TaskDocument = {
  id: 'sample.blank',
  steps: [
    { args: [], id: 'new-page', method: 'newPage', target: 'context' },
    {
      args: ['about:blank'],
      id: 'goto-blank',
      method: 'goto',
      target: 'page',
      verify: true,
    },
  ],
};

describe('runTask', () => {
  it('runs steps and verifies when asked', async () => {
    const driver = createRecordingDriver();
    const verifier = new MockAiVerifier();
    await expect(
      runTask({ driver, task: sampleTask, verifier }),
    ).resolves.toEqual({ ok: true });
    expect(driver.calls).toEqual([
      ['context', 'newPage', []],
      ['page', 'goto', ['about:blank']],
    ]);
  });

  it('aborts when a failed step is rejected by the verifier', async () => {
    const driver = createRecordingDriver(async (target, method) => {
      if (method === 'goto') throw new Error('boom');
      if (target === 'context' && method === 'newPage') return 'page-1';
      return undefined;
    });
    const result = await runTask({
      driver,
      task: sampleTask,
      verifier: {
        verify: async () => ({ action: 'abort', code: 'internal' }),
      },
    });
    expect(result).toEqual({
      error: { code: 'internal', message: 'boom' },
      ok: false,
    });
  });

  it('inserts patch steps after a failure then continues', async () => {
    let gotoAttempts = 0;
    const driver = createRecordingDriver(async (target, method) => {
      if (method === 'goto') {
        gotoAttempts += 1;
        if (gotoAttempts === 1) throw new Error('boom');
      }
      if (target === 'context' && method === 'newPage') return 'page-1';
      return undefined;
    });
    const patchSteps: TaskStep[] = [
      {
        args: ['about:blank'],
        id: 'retry',
        method: 'goto',
        target: 'page',
      },
    ];
    const result = await runTask({
      driver,
      task: sampleTask,
      verifier: {
        verify: async () => ({ action: 'patch', patchSteps }),
      },
    });
    expect(result).toEqual({ ok: true });
    expect(driver.calls).toEqual([
      ['context', 'newPage', []],
      ['page', 'goto', ['about:blank']],
      ['page', 'goto', ['about:blank']],
    ]);
  });
});
