import type { PluginError } from '@ai-butler/desktop-plugin-protocol';

import type { TaskDocument } from './task-types';

export type TaskSourceResult =
  | { error: PluginError; ok: false }
  | { ok: true; task: TaskDocument };

export interface TaskSource {
  getTask: (taskId: string) => Promise<TaskSourceResult>;
}

export class BuiltinTaskSource implements TaskSource {
  constructor(private readonly tasks: Record<string, TaskDocument>) {}

  async getTask(taskId: string): Promise<TaskSourceResult> {
    const task = this.tasks[taskId];
    if (!task) {
      return {
        error: {
          code: 'invalid_argument',
          message: `Unknown task: ${taskId}`,
        },
        ok: false,
      };
    }
    return { ok: true, task };
  }
}

export class HttpTaskSource implements TaskSource {
  constructor(
    private readonly options: {
      baseUrl: null | string;
      fetchFn?: typeof fetch;
    },
  ) {}

  async getTask(taskId: string): Promise<TaskSourceResult> {
    if (!this.options.baseUrl) {
      return {
        error: {
          code: 'unavailable',
          message: 'Browser task API is not configured',
        },
        ok: false,
      };
    }

    const fetchFn = this.options.fetchFn ?? fetch;
    const response = await fetchFn(
      `${this.options.baseUrl}/desktop-plugins/browser/tasks/${taskId}`,
    );
    const body = (await response.json()) as {
      code: number;
      data: TaskDocument;
    };
    if (body.code !== 0) {
      return {
        error: {
          code: 'invalid_argument',
          message: `Task not found: ${taskId}`,
        },
        ok: false,
      };
    }
    return { ok: true, task: body.data };
  }
}
