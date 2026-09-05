import { Type } from 'typebox';

import { successEnvelopeSchema } from '../../framework/http/envelope';

export const TestKeySchema = Type.String({ maxLength: 50, minLength: 1 });
export const TestValueSchema = Type.Unknown();

export const TestRecordSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  key: TestKeySchema,
  value: TestValueSchema,
});

export const CreateTestBodySchema = Type.Object({
  key: TestKeySchema,
  value: TestValueSchema,
});

export const UpdateTestBodySchema = Type.Object(
  {
    key: Type.Optional(TestKeySchema),
    value: Type.Optional(TestValueSchema),
  },
  { minProperties: 1 },
);

export const TestIdParamsSchema = Type.Object({
  id: Type.String({ pattern: '^[1-9][0-9]*$' }),
});

export const TestRecordResponseSchema = successEnvelopeSchema(TestRecordSchema);
export const TestListResponseSchema = successEnvelopeSchema(
  Type.Array(TestRecordSchema),
);
export const TestDeleteResponseSchema = successEnvelopeSchema(
  Type.Object({ id: Type.Integer({ minimum: 1 }) }),
);
