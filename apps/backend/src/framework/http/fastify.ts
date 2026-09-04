import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyServerOptions } from 'fastify';

import Fastify from 'fastify';

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify(options).withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
