import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import { success } from '../../framework/http/envelope';
import {
  EchoBodySchema,
  EchoResponseSchema,
  PingResponseSchema,
} from './probe.schema';

export const probePlugin: FastifyPluginAsyncTypebox = async (app) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: PingResponseSchema } } },
    async () => success({ pong: true }),
  );

  app.post(
    '/poc/echo',
    {
      schema: {
        body: EchoBodySchema,
        response: { 200: EchoResponseSchema },
      },
    },
    async (request) => success(request.body),
  );
};
