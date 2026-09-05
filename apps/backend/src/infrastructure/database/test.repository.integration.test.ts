import type { Database } from './client';

import { fileURLToPath } from 'node:url';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase } from './client';
import { createPgTestRepository } from './test.repository';

describe('test repository', () => {
  let closeClient: () => Promise<void> = async () => {};
  let database: Database;
  let stopContainer: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const container = await new PostgreSqlContainer(
      'postgres:17-alpine',
    ).start();
    stopContainer = () => container.stop().then(() => undefined);
    const client = postgres(container.getConnectionUri(), { max: 2 });
    closeClient = () => client.end();
    database = createDatabase(client);
    await migrate(database, {
      migrationsFolder: fileURLToPath(
        new URL('../../../migrations', import.meta.url),
      ),
    });
  }, 60_000);

  afterAll(async () => {
    await closeClient();
    await stopContainer();
  });

  it('stores mixed JSON values and supports CRUD', async () => {
    const repository = createPgTestRepository(database);

    const created = await repository.insert({
      key: 'payload',
      value: { items: [1, 'x'], ok: true },
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created.key).toBe('payload');
    expect(created.value).toEqual({ items: [1, 'x'], ok: true });

    expect(await repository.findById(created.id)).toEqual(created);
    expect(await repository.findAll()).toEqual([created]);

    const updated = await repository.update(created.id, { value: 42 });
    expect(updated).toEqual({ id: created.id, key: 'payload', value: 42 });

    await expect(repository.delete(created.id)).resolves.toBe(true);
    expect(await repository.findAll()).toEqual([]);
  });
});
