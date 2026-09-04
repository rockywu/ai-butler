import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import type { ProbeService } from './probe.service';

import { AppError } from '../../framework/core/app-error';
import { success } from '../../framework/http/envelope';
import {
  EchoBodySchema,
  EchoResponseSchema,
  PingResponseSchema,
} from './probe.schema';

interface ProbePluginOptions {
  service: ProbeService;
}

export const probePlugin: FastifyPluginAsyncTypebox<
  ProbePluginOptions
> = async (app, options) => {
  app.get(
    '/poc/ping',
    { schema: { response: { 200: PingResponseSchema } } },
    async () => success(options.service.read()),
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

  app.get('/poc/errors/business', async () => {
    throw new AppError({
      code: 2001,
      message: 'Probe conflict',
      statusCode: 409,
    });
  });

  app.get('/poc/errors/system', async () => {
    throw new Error('database-password');
  });
};
