import type { Database } from './client';

import { fileURLToPath } from 'node:url';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createAccount, listAccounts } from './account.repository';
import { appendAudit, listAudits } from './audit.repository';
import { createDatabase } from './client';

describe('database transaction', () => {
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

  it('rolls back changes made by two repositories in one transaction', async () => {
    await expect(
      database.transaction(async (transaction) => {
        await createAccount(transaction, {
          balance: 100,
          id: 'account-1',
        });
        await appendAudit(transaction, {
          accountId: 'account-1',
          event: 'created',
          id: 'audit-1',
        });
        throw new Error('force rollback');
      }),
    ).rejects.toThrow('force rollback');

    expect(await listAccounts(database)).toEqual([]);
    expect(await listAudits(database)).toEqual([]);
  });
});
