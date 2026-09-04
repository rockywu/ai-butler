import type { FastifyPluginCallback } from 'fastify';

import fp from 'fastify-plugin';

import { runWithRequestContext } from './request-context';

const requestContextPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.addHook('onRequest', (request, reply, next) => {
    const requestHeader = request.headers['x-request-id'];
    const traceHeader = request.headers['x-trace-id'];
    const requestId =
      typeof requestHeader === 'string' ? requestHeader : request.id;
    const traceId = typeof traceHeader === 'string' ? traceHeader : undefined;

    reply.header('x-request-id', requestId);
    if (traceId) {
      reply.header('x-trace-id', traceId);
    }

    runWithRequestContext({ requestId, traceId }, next);
  });
  done();
};

export default fp(requestContextPlugin, {
  fastify: '5.x',
  name: 'request-context',
});
