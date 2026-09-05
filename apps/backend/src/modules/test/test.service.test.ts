import { describe, expect, it } from 'vitest';

import { AppError } from '../../framework/core/app-error';
import { createMemoryTestRepository } from './test.repository.memory';
import { createTestService } from './test.service';

describe('createTestService', () => {
  it('creates, lists, updates and deletes mixed values', async () => {
    const service = createTestService(createMemoryTestRepository());

    const created = await service.create({
      key: 'flag',
      value: [1, 'x', false],
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created).toMatchObject({ key: 'flag', value: [1, 'x', false] });

    expect(await service.list()).toEqual([created]);
    expect(await service.get(created.id)).toEqual(created);

    const updated = await service.update(created.id, { value: null });
    expect(updated).toEqual({ id: created.id, key: 'flag', value: null });

    await expect(service.remove(created.id)).resolves.toEqual({
      id: created.id,
    });
    expect(await service.list()).toEqual([]);
  });

  it('throws 2101 when the record is missing', async () => {
    const service = createTestService(createMemoryTestRepository());

    await expect(service.get(1)).rejects.toMatchObject({
      code: 2101,
      statusCode: 404,
    });
    await expect(service.get(1)).rejects.toBeInstanceOf(AppError);
  });
});
