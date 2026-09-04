import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';

import { drizzle } from 'drizzle-orm/postgres-js';

import { schema } from './schema';

export function createDatabase(client: Sql) {
  return drizzle(client, { schema });
}

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DatabaseExecutor = Database | Transaction;
