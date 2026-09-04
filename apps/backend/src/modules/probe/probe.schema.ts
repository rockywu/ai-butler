import { Type } from 'typebox';

import { successEnvelopeSchema } from '../../framework/http/envelope';

export const EchoBodySchema = Type.Object({
  value: Type.String({ minLength: 1 }),
});

export const EchoResponseSchema = successEnvelopeSchema(EchoBodySchema);
export const ContextResponseSchema = successEnvelopeSchema(
  Type.Object({ requestId: Type.String() }),
);
export const PingResponseSchema = successEnvelopeSchema(
  Type.Object({
    pong: Type.Boolean(),
    source: Type.String(),
  }),
);
