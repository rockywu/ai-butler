import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import type { ProbeService } from './probe.service';

import { AppError } from '../../framework/core/app-error';
import { getRequestContext } from '../../framework/core/request-context';
import { success } from '../../framework/http/envelope';
import {
  ContextResponseSchema,
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

  app.get(
    '/poc/context',
    { schema: { response: { 200: ContextResponseSchema } } },
    async () => {
      await Promise.resolve();
      const { requestId } = getRequestContext();
      return success({ requestId });
    },
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
