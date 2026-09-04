import assert from 'node:assert/strict';

import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app/create-app';
import { runWithRequestContext } from '../core/request-context';
import { testConfig } from '../testing/test-config';
import { createLogger } from './logger';

function createCapture() {
  const lines: string[] = [];
  return {
    destination: {
      write(message: string) {
        lines.push(message);
      },
    },
    lines,
  };
}

function parseLines(lines: string[]): Array<Record<string, unknown>> {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('createLogger', () => {
  let app: Awaited<ReturnType<typeof createApp>> | undefined;

  afterEach(async () => {
    await app?.close();
  });

  it('redacts secrets and never writes raw credential material', () => {
    const capture = createCapture();
    const logger = createLogger(
      testConfig({ logLevel: 'info' }),
      capture.destination,
    );

    logger.info({
      Authorization: 'Bearer abc',
      Cookie: 'sid=1',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
      accessToken: 'access-secret',
      password: 'hunter2',
      refreshToken: 'refresh-secret',
    });

    const payload = parseLines(capture.lines)[0];
    assert.ok(payload !== undefined);
    expect(payload.password).toBe('[Redacted]');
    expect(payload.Authorization).toBe('[Redacted]');
    expect(payload.Cookie).toBe('[Redacted]');
    expect(payload.accessToken).toBe('[Redacted]');
    expect(payload.refreshToken).toBe('[Redacted]');
    expect(payload.DATABASE_URL).toBe('[Redacted]');
    expect(JSON.stringify(payload)).not.toContain('hunter2');
    expect(JSON.stringify(payload)).not.toContain('postgresql://');
  });

  it('mixes requestId and traceId when a request context exists', () => {
    const capture = createCapture();
    const logger = createLogger(
      testConfig({ logLevel: 'info' }),
      capture.destination,
    );

    runWithRequestContext({ requestId: 'req-1', traceId: 'tr-1' }, () => {
      logger.info('inside request');
    });
    logger.info('outside request');

    const parsed = parseLines(capture.lines);
    const inside = parsed[0];
    const outside = parsed[1];
    assert.ok(inside !== undefined);
    assert.ok(outside !== undefined);
    expect(inside.requestId).toBe('req-1');
    expect(inside.traceId).toBe('tr-1');
    expect(outside.requestId).toBeUndefined();
    expect(outside.traceId).toBeUndefined();
  });

  it('attaches requestId and traceId to Fastify request logs', async () => {
    const capture = createCapture();
    const logger = createLogger(
      testConfig({ logLevel: 'info' }),
      capture.destination,
    );
    app = await createApp({
      config: testConfig({ logLevel: 'info' }),
      logger,
    });

    await app.inject({
      headers: {
        'x-request-id': 'req-99',
        'x-trace-id': 'tr-99',
      },
      method: 'GET',
      url: '/poc/ping',
    });

    const payloads = parseLines(capture.lines);
    expect(payloads.some((line) => line.requestId === 'req-99')).toBe(true);
    expect(payloads.some((line) => line.traceId === 'tr-99')).toBe(true);
  });
});
