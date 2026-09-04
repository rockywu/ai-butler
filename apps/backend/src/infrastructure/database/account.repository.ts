import type { DatabaseExecutor } from './client';

import { asc } from 'drizzle-orm';

import { accounts } from './schema';

export interface NewAccount {
  balance: number;
  id: string;
}

export async function createAccount(
  executor: DatabaseExecutor,
  account: NewAccount,
): Promise<void> {
  await executor.insert(accounts).values(account);
}

export function listAccounts(executor: DatabaseExecutor) {
  return executor.select().from(accounts).orderBy(asc(accounts.id));
}
