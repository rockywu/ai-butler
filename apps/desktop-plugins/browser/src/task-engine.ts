import type { PluginError } from '@ai-butler/desktop-plugin-protocol';

import type { AiVerifier } from './ai-verifier';
import type { TaskDocument, TaskStep, TaskTarget } from './task-types';

export interface PlaywrightDriver {
  invoke: (
    target: TaskTarget,
    method: string,
    args: unknown[],
  ) => Promise<unknown>;
}

export type RunTaskResult = { error: PluginError; ok: false } | { ok: true };

export async function runTask(options: {
  driver: PlaywrightDriver;
  task: TaskDocument;
  verifier: AiVerifier;
}): Promise<RunTaskResult> {
  const queue = [...options.task.steps];

  while (queue.length > 0) {
    const step = queue.shift();
    if (!step) break;

    try {
      await options.driver.invoke(step.target, step.method, step.args);
      if (step.verify) {
        const decision = await options.verifier.verify({ stepId: step.id });
        const patched = await applyDecision(decision, queue, step);
        if (patched) return patched;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'step failed';
      const decision = await options.verifier.verify({
        errorMessage,
        stepId: step.id,
      });
      if (decision.action === 'continue') {
        continue;
      }
      const patched = await applyDecision(decision, queue, step, errorMessage);
      if (patched) return patched;
    }
  }

  return { ok: true };
}

async function applyDecision(
  decision: Awaited<ReturnType<AiVerifier['verify']>>,
  queue: TaskStep[],
  step: TaskStep,
  thrownMessage?: string,
): Promise<RunTaskResult | undefined> {
  if (decision.action === 'abort') {
    return {
      error: {
        code: decision.code,
        message: thrownMessage ?? `verification aborted at ${step.id}`,
      },
      ok: false,
    };
  }

  if (decision.action === 'patch') {
    queue.unshift(
      ...decision.patchSteps.map((patchStep) => ({
        ...patchStep,
        verify: false,
      })),
    );
  }

  return undefined;
}
