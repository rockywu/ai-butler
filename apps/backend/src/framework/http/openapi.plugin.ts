import type { FastifyPluginAsync } from 'fastify';

import swagger from '@fastify/swagger';
import fp from 'fastify-plugin';

const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      info: { title: 'AI Butler Backend', version: '0.1.0' },
    },
  });
};

export default fp(openApiPlugin, {
  fastify: '5.x',
  name: 'openapi',
});
