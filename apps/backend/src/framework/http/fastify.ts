import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyServerOptions } from 'fastify';

import type { AppConfig } from '../config/schema';
import type { ReadinessGate } from '../core/readiness';
import type { ResourceRegistry } from '../core/resource-registry';

import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    readinessGate: ReadinessGate;
    resources: ResourceRegistry;
  }
}

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify({
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    ...options,
  })
    .setValidatorCompiler(TypeBoxValidatorCompiler)
    .withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
