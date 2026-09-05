import { Type } from 'typebox';

import { successEnvelopeSchema } from './envelope';

export const LiveResponseSchema = successEnvelopeSchema(
  Type.Object({ status: Type.Literal('live') }),
);

export const ReadyResponseSchema = successEnvelopeSchema(
  Type.Object({ status: Type.Literal('ready') }),
);

export const NotReadyResponseSchema = Type.Object({
  code: Type.Literal(5030),
  data: Type.Null(),
  message: Type.Literal('not ready'),
});
