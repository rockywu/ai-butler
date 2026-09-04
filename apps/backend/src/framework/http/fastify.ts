import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyServerOptions } from 'fastify';

import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';

export function createHttpServer(options: FastifyServerOptions = {}) {
  return Fastify(options)
    .setValidatorCompiler(TypeBoxValidatorCompiler)
    .withTypeProvider<TypeBoxTypeProvider>();
}

export type AppInstance = ReturnType<typeof createHttpServer>;
