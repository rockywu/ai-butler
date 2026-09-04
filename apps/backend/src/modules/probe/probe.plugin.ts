import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { Type } from 'typebox';

const responseSchema = Type.Object({
  code: Type.Literal(0),
  data: Type.Object({ pong: Type.Boolean() }),
  message: Type.String(),
});

export const probePlugin: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: responseSchema } } },
    async () => ({
      code: 0 as const,
      data: { pong: true },
      message: 'success',
    }),
  );
};
