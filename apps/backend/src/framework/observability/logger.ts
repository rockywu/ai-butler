import type { DestinationStream, Logger } from 'pino';

import type { AppConfig } from '../config/schema';

import pino from 'pino';

import { getRequestContext } from '../core/request-context';
import { REDACT_PATHS } from './redact';

export function createLogger(
  config: AppConfig,
  destination?: DestinationStream,
): Logger {
  return pino(
    {
      base: {
        env: config.appEnv,
        service: 'ai-butler-backend',
      },
      level: config.logLevel,
      mixin() {
        try {
          const context = getRequestContext();
          return {
            requestId: context.requestId,
            ...(context.traceId === undefined
              ? {}
              : { traceId: context.traceId }),
          };
        } catch {
          return {};
        }
      },
      redact: {
        censor: '[Redacted]',
        paths: [...REDACT_PATHS],
      },
    },
    destination,
  );
}
