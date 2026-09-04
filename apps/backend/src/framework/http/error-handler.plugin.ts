import type { FastifyError, FastifyPluginAsync } from 'fastify';

import fp from 'fastify-plugin';

import { AppError } from '../core/app-error';

const errorHandlerPlugin: FastifyPluginAsync = async (app) => {
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        code: error.code,
        data: null,
        message: error.message,
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        code: 1000,
        data: null,
        message: 'Request validation failed',
      });
    }

    request.log.error({ err: error }, 'unhandled request error');
    return reply.status(500).send({
      code: 5000,
      data: null,
      message: 'Internal server error',
    });
  });
};

export default fp(errorHandlerPlugin, {
  fastify: '5.x',
  name: 'error-handler',
});
