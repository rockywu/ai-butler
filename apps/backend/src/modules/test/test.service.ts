import type {
  NewTestRecord,
  TestRecord,
  TestRecordPatch,
  TestRepository,
} from './test.repository';

import { AppError } from '../../framework/core/app-error';

export type { TestRecord } from './test.repository';

export interface TestService {
  create(input: NewTestRecord): Promise<TestRecord>;
  get(id: number): Promise<TestRecord>;
  list(): Promise<TestRecord[]>;
  remove(id: number): Promise<{ id: number }>;
  update(id: number, input: TestRecordPatch): Promise<TestRecord>;
}

function missing(): never {
  throw new AppError({
    code: 2101,
    message: 'Test record not found',
    statusCode: 404,
  });
}

export function createTestService(repository: TestRepository): TestService {
  return {
    create(input) {
      return repository.insert(input);
    },
    async get(id) {
      return (await repository.findById(id)) ?? missing();
    },
    list() {
      return repository.findAll();
    },
    async remove(id) {
      if (!(await repository.delete(id))) {
        missing();
      }
      return { id };
    },
    async update(id, input) {
      return (await repository.update(id, input)) ?? missing();
    },
  };
}
