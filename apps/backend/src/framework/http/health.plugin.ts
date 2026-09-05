import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import type { ReadinessGate } from '../core/readiness';

import fp from 'fastify-plugin';

import { success } from './envelope';
import {
  LiveResponseSchema,
  NotReadyResponseSchema,
  ReadyResponseSchema,
} from './health.schema';

export interface HealthChecker {
  check(): Promise<void> | void;
  name: string;
}

export interface HealthPluginOptions {
  checkers: HealthChecker[];
  readinessGate: ReadinessGate;
}

export function sanitizeHealthError(message: string): string {
  return message
    .replaceAll(/[a-z][\w+.-]*:\/\/\S+/gi, '[Redacted]')
    .replaceAll(/DATABASE_URL=\S+/gi, 'DATABASE_URL=[Redacted]')
    .replaceAll(/password=\S+/gi, 'password=[Redacted]');
}

const healthPlugin: FastifyPluginAsyncTypebox<HealthPluginOptions> = async (
  app,
  options,
) => {
  app.get(
    '/livez',
    { schema: { response: { 200: LiveResponseSchema } } },
    async () => success({ status: 'live' as const }),
  );

  app.get(
    '/readyz',
    {
      schema: {
        response: {
          200: ReadyResponseSchema,
          503: NotReadyResponseSchema,
        },
      },
    },
    async (_request, reply) => {
      if (!options.readinessGate.isReady()) {
        return reply.status(503).send({
          code: 5030 as const,
          data: null,
          message: 'not ready' as const,
        });
      }

      const results = await Promise.allSettled(
        options.checkers.map(async (checker) => checker.check()),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          const message =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);
          app.log.error(
            {
              checker: options.checkers[index]?.name,
              err: new Error(sanitizeHealthError(message)),
            },
            'readiness checker failed',
          );
        }
      }

      if (results.some((result) => result.status === 'rejected')) {
        return reply.status(503).send({
          code: 5030 as const,
          data: null,
          message: 'not ready' as const,
        });
      }

      return success({ status: 'ready' as const });
    },
  );
};

export default fp(healthPlugin, {
  fastify: '5.x',
  name: 'health',
});
