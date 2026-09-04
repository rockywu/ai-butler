import type { TSchema } from 'typebox';

import { Type } from 'typebox';

export function successEnvelopeSchema<T extends TSchema>(data: T) {
  return Type.Object({
    code: Type.Literal(0),
    data,
    message: Type.String(),
  });
}

export function success<T>(data: T, message = 'success') {
  return { code: 0 as const, data, message };
}
