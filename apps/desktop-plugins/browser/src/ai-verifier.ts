import type { TaskStep } from './task-types';

export interface VerifyInput {
  errorMessage?: string;
  stepId: string;
  url?: string;
}

export type VerifyResult =
  | { action: 'abort'; code: 'internal' | 'user_cancelled' }
  | { action: 'continue' }
  | { action: 'patch'; patchSteps: TaskStep[] };

export interface AiVerifier {
  verify: (input: VerifyInput) => Promise<VerifyResult>;
}

export class MockAiVerifier implements AiVerifier {
  async verify(_input: VerifyInput): Promise<VerifyResult> {
    return { action: 'continue' };
  }
}
