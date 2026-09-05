import { integer, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core';

export const accounts = pgTable('poc_accounts', {
  balance: integer().notNull(),
  id: text().primaryKey(),
});

export const auditLogs = pgTable('poc_audit_logs', {
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  event: text().notNull(),
  id: text().primaryKey(),
});

export const testRecords = pgTable('test', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  key: varchar({ length: 50 }).notNull(),
  value: jsonb().$type<unknown>().notNull(),
});

export const schema = { accounts, auditLogs, testRecords };
