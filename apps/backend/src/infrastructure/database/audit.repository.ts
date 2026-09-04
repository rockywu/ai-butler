import type { DatabaseExecutor } from './client';

import { asc } from 'drizzle-orm';

import { auditLogs } from './schema';

export interface NewAudit {
  accountId: string;
  event: string;
  id: string;
}

export async function appendAudit(
  executor: DatabaseExecutor,
  audit: NewAudit,
): Promise<void> {
  await executor.insert(auditLogs).values(audit);
}

export function listAudits(executor: DatabaseExecutor) {
  return executor.select().from(auditLogs).orderBy(asc(auditLogs.id));
}
