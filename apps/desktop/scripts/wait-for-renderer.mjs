import { request as httpRequest } from 'node:http';
import { resolve } from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const DEFAULT_URL = 'http://127.0.0.1:5666';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_INTERVAL_MS = 500;
const DEFAULT_REQUEST_TIMEOUT_MS = 2000;

function probeHttp(url, requestTimeoutMs) {
  return new Promise((resolveProbe, rejectProbe) => {
    const target = new URL(url);
    const req = httpRequest(
      {
        hostname: target.hostname,
        method: 'GET',
        path: `${target.pathname}${target.search}`,
        port: target.port,
        timeout: requestTimeoutMs,
      },
      (response) => {
        response.resume();
        const status = response.statusCode ?? 0;
        if (status >= 200 && status < 400) {
          resolveProbe();
          return;
        }
        rejectProbe(new Error(`unexpected status ${status}`));
      },
    );
    req.on('timeout', () => {
      req.destroy();
      rejectProbe(new Error('request timeout'));
    });
    req.on('error', rejectProbe);
    req.end();
  });
}

export async function waitForRenderer(options = {}) {
  const url = options.url ?? DEFAULT_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const requestTimeoutMs =
    options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await probeHttp(url, requestTimeoutMs);
      return;
    } catch {
      // TCP-only or hung listeners must not count as ready.
    }

    const remaining = timeoutMs - (Date.now() - startedAt);
    if (remaining <= 0) {
      break;
    }
    await delay(Math.min(intervalMs, remaining));
  }

  throw new Error(
    `Timed out waiting for renderer HTTP at ${url}. Port 5666 may be occupied by a stopped Vite process that still listens but never responds. Check with: lsof -nP -iTCP:5666 -sTCP:LISTEN`,
  );
}

const invokedAsCli =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedAsCli) {
  await waitForRenderer();
}
