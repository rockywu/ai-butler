import type { FastifyPluginAsync } from 'fastify';

import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export interface OpenApiUiPluginOptions {
  enabled: boolean;
}

const openApiUiPlugin: FastifyPluginAsync<OpenApiUiPluginOptions> = async (
  app,
  options,
) => {
  if (options.enabled) {
    await app.register(swaggerUi, {
      routePrefix: '/documentation',
    });
    return;
  }

  app.get('/documentation/json', { schema: { hide: true } }, async () =>
    app.swagger(),
  );
};

export default fp(openApiUiPlugin, {
  dependencies: ['openapi'],
  fastify: '5.x',
  name: 'openapi-ui',
});
