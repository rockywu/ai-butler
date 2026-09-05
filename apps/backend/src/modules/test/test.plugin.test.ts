import type { TestRecord, TestService } from './test.service';

import { afterEach, describe, expect, it } from 'vitest';

import { createTestApp } from '../../app/create-test-app';
import { AppError } from '../../framework/core/app-error';

function notFound(): never {
  throw new AppError({
    code: 2101,
    message: 'Test record not found',
    statusCode: 404,
  });
}

function fakeService(
  records: TestRecord[] = [],
  overrides: Partial<TestService> = {},
): TestService {
  return {
    async create(input) {
      return { id: 1, key: input.key, value: input.value };
    },
    async get(id) {
      return records.find((record) => record.id === id) ?? notFound();
    },
    async list() {
      return records;
    },
    async remove(id) {
      return { id };
    },
    async update(id, input) {
      const current = records.find((record) => record.id === id);
      if (!current) {
        notFound();
      }
      return {
        id,
        key: input.key ?? current.key,
        value: input.value === undefined ? current.value : input.value,
      };
    },
    ...overrides,
  };
}

describe('test CRUD routes', () => {
  let app: Awaited<ReturnType<typeof createTestApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('creates a record with a mixed JSON value', async () => {
    app = await createTestApp({
      dependencies: { testService: fakeService() },
    });

    const response = await app.inject({
      method: 'POST',
      payload: { key: 'theme', value: { dark: true, scale: 1.2 } },
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      code: 0,
      data: { id: 1, key: 'theme', value: { dark: true, scale: 1.2 } },
      message: 'success',
    });
  });

  it('lists, reads, updates and deletes a record', async () => {
    const record = { id: 7, key: 'count', value: 3 };
    app = await createTestApp({
      dependencies: { testService: fakeService([record]) },
    });

    const listed = await app.inject({ method: 'GET', url: '/test' });
    expect(listed.statusCode).toBe(200);
    expect(listed.json().data).toEqual([record]);

    const found = await app.inject({ method: 'GET', url: '/test/7' });
    expect(found.statusCode).toBe(200);
    expect(found.json().data).toEqual(record);

    const updated = await app.inject({
      method: 'PUT',
      payload: { value: 'three' },
      url: '/test/7',
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data).toEqual({
      id: 7,
      key: 'count',
      value: 'three',
    });

    const removed = await app.inject({ method: 'DELETE', url: '/test/7' });
    expect(removed.statusCode).toBe(200);
    expect(removed.json()).toEqual({
      code: 0,
      data: { id: 7 },
      message: 'success',
    });
  });

  it('maps a missing record to code 2101', async () => {
    app = await createTestApp({
      dependencies: { testService: fakeService() },
    });

    const response = await app.inject({ method: 'GET', url: '/test/9' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      code: 2101,
      data: null,
      message: 'Test record not found',
    });
  });

  it('rejects an oversized key', async () => {
    app = await createTestApp({
      dependencies: { testService: fakeService() },
    });

    const response = await app.inject({
      method: 'POST',
      payload: { key: 'k'.repeat(51), value: true },
      url: '/test',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 1000,
      data: null,
      message: 'Request validation failed',
    });
  });
});
