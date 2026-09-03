import type { TaskDocument } from './task-types';

import { describe, expect, it } from 'vitest';

import { BuiltinTaskSource, HttpTaskSource } from './task-source';
import sampleBlank from './tasks/sample.blank.json';

describe('builtinTaskSource', () => {
  it('returns sample.blank', async () => {
    const source = new BuiltinTaskSource({
      'sample.blank': sampleBlank as TaskDocument,
    });
    const result = await source.getTask('sample.blank');
    expect(result.ok && result.task.id).toBe('sample.blank');
  });
});

describe('httpTaskSource', () => {
  it('returns unavailable when the base URL is missing', async () => {
    const source = new HttpTaskSource({ baseUrl: null });
    await expect(source.getTask('remote-1')).resolves.toEqual({
      error: {
        code: 'unavailable',
        message: 'Browser task API is not configured',
      },
      ok: false,
    });
  });
});
