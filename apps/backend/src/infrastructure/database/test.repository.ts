import type { TestRepository } from '../../modules/test/test.repository';
import type { DatabaseExecutor } from './client';

import { asc, eq } from 'drizzle-orm';

import { testRecords } from './schema';

export function createPgTestRepository(
  executor: DatabaseExecutor,
): TestRepository {
  return {
    async delete(id) {
      const deleted = await executor
        .delete(testRecords)
        .where(eq(testRecords.id, id))
        .returning({ id: testRecords.id });
      return deleted.length > 0;
    },
    findAll() {
      return executor.select().from(testRecords).orderBy(asc(testRecords.id));
    },
    async findById(id) {
      const [record] = await executor
        .select()
        .from(testRecords)
        .where(eq(testRecords.id, id))
        .limit(1);
      return record;
    },
    async insert(input) {
      const [record] = await executor
        .insert(testRecords)
        .values(input)
        .returning();
      if (!record) {
        throw new Error('Failed to insert test record');
      }
      return record;
    },
    async update(id, input) {
      const [record] = await executor
        .update(testRecords)
        .set(input)
        .where(eq(testRecords.id, id))
        .returning();
      return record;
    },
  };
}
