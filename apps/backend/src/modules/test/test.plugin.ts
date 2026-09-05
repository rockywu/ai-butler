import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';

import type { TestService } from './test.service';

import { success } from '../../framework/http/envelope';
import {
  CreateTestBodySchema,
  TestDeleteResponseSchema,
  TestIdParamsSchema,
  TestListResponseSchema,
  TestRecordResponseSchema,
  UpdateTestBodySchema,
} from './test.schema';

interface TestPluginOptions {
  service: TestService;
}

function parseId(id: string): number {
  return Number.parseInt(id, 10);
}

export const testPlugin: FastifyPluginAsyncTypebox<TestPluginOptions> = async (
  app,
  options,
) => {
  app.post(
    '/test',
    {
      schema: {
        body: CreateTestBodySchema,
        response: { 200: TestRecordResponseSchema },
      },
    },
    async (request) => success(await options.service.create(request.body)),
  );

  app.get(
    '/test',
    { schema: { response: { 200: TestListResponseSchema } } },
    async () => success(await options.service.list()),
  );

  app.get(
    '/test/:id',
    {
      schema: {
        params: TestIdParamsSchema,
        response: { 200: TestRecordResponseSchema },
      },
    },
    async (request) =>
      success(await options.service.get(parseId(request.params.id))),
  );

  app.put(
    '/test/:id',
    {
      schema: {
        body: UpdateTestBodySchema,
        params: TestIdParamsSchema,
        response: { 200: TestRecordResponseSchema },
      },
    },
    async (request) =>
      success(
        await options.service.update(parseId(request.params.id), request.body),
      ),
  );

  app.delete(
    '/test/:id',
    {
      schema: {
        params: TestIdParamsSchema,
        response: { 200: TestDeleteResponseSchema },
      },
    },
    async (request) =>
      success(await options.service.remove(parseId(request.params.id))),
  );
};
