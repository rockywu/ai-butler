export type TaskTarget = 'browser' | 'context' | 'page';

export interface TaskStep {
  args: unknown[];
  id: string;
  method: string;
  target: TaskTarget;
  verify?: boolean;
}

export interface TaskDocument {
  browserType?: 'chrome' | 'edge';
  id: string;
  steps: TaskStep[];
}
