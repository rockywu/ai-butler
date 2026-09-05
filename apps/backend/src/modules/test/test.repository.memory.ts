import type {
  NewTestRecord,
  TestRecord,
  TestRecordPatch,
  TestRepository,
} from './test.repository';

export function createMemoryTestRepository(): TestRepository {
  const records = new Map<number, TestRecord>();
  let nextId = 1;

  return {
    async delete(id) {
      return records.delete(id);
    },
    async findAll() {
      return [...records.values()].toSorted(
        (left, right) => left.id - right.id,
      );
    },
    async findById(id) {
      return records.get(id);
    },
    async insert(input: NewTestRecord) {
      const record = { id: nextId, key: input.key, value: input.value };
      nextId += 1;
      records.set(record.id, record);
      return record;
    },
    async update(id, input: TestRecordPatch) {
      const current = records.get(id);
      if (!current) {
        return undefined;
      }
      const record = {
        id,
        key: input.key ?? current.key,
        value: input.value === undefined ? current.value : input.value,
      };
      records.set(id, record);
      return record;
    },
  };
}
