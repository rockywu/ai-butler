import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

import { runWithRequestContext } from './request-context';

const requestContextPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.addHook('onRequest', (request, reply, next) => {
    const header = request.headers['x-request-id'];
    const requestId = typeof header === 'string' ? header : request.id;
    reply.header('x-request-id', requestId);
    runWithRequestContext({ requestId, traceId: undefined }, next);
  });
  done();
};

export default fp(requestContextPlugin, {
  fastify: '5.x',
  name: 'request-context',
});
