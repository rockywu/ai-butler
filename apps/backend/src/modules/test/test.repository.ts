export interface TestRecord {
  id: number;
  key: string;
  value: unknown;
}

export interface NewTestRecord {
  key: string;
  value: unknown;
}

export interface TestRecordPatch {
  key?: string;
  value?: unknown;
}

export interface TestRepository {
  delete(id: number): Promise<boolean>;
  findAll(): Promise<TestRecord[]>;
  findById(id: number): Promise<TestRecord | undefined>;
  insert(input: NewTestRecord): Promise<TestRecord>;
  update(id: number, input: TestRecordPatch): Promise<TestRecord | undefined>;
}
