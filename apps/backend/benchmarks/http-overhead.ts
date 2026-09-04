import type { FastifyInstance } from 'fastify';
import type { AddressInfo } from 'node:net';

import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { platform } from 'node:os';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import Fastify from 'fastify';

import { createApp } from '../src/app/create-app';

const execFileAsync = promisify(execFile);
const backendRoot = fileURLToPath(new URL('../', import.meta.url));

export interface BenchmarkInput {
  bareP95Ms: number;
  bareRequestsPerSecond: number;
  frameworkP95Ms: number;
  frameworkRequestsPerSecond: number;
}

export function percentile(values: number[], ratio: number): number {
  const sorted = values.toSorted((left, right) => left - right);
  const index = Math.ceil(sorted.length * ratio) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export function evaluateBudget(input: BenchmarkInput) {
  const throughputLossRatio =
    (input.bareRequestsPerSecond - input.frameworkRequestsPerSecond) /
    input.bareRequestsPerSecond;
  const latencyDeltaMs = input.frameworkP95Ms - input.bareP95Ms;
  return {
    latencyDeltaMs,
    passed: throughputLossRatio <= 0.1 && latencyDeltaMs <= 1,
    throughputLossRatio,
  };
}

function urlFor(app: FastifyInstance): string {
  const address = app.server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}/poc/ping`;
}

async function requestsPerSecond(url: string): Promise<number> {
  const { stdout } = await execFileAsync(
    'pnpm',
    ['exec', 'autocannon', '-j', '-c', '50', '-d', '10', url],
    { cwd: backendRoot, maxBuffer: 10 * 1024 * 1024 },
  );
  const result = JSON.parse(stdout) as { requests: { average: number } };
  return result.requests.average;
}

async function p95Latency(
  url: string,
  requestCount = 1000,
  concurrency = 50,
): Promise<number> {
  const durations: number[] = [];
  for (let offset = 0; offset < requestCount; offset += concurrency) {
    const batchSize = Math.min(concurrency, requestCount - offset);
    await Promise.all(
      Array.from({ length: batchSize }, async () => {
        const startedAt = performance.now();
        const response = await fetch(url);
        await response.arrayBuffer();
        durations.push(performance.now() - startedAt);
      }),
    );
  }
  return percentile(durations, 0.95);
}

async function createBareApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  app.get('/poc/ping', async () => ({
    code: 0,
    data: { pong: true, source: 'real' },
    message: 'success',
  }));
  await app.listen({ host: '127.0.0.1', port: 0 });
  return app;
}

async function run(): Promise<void> {
  const bare = await createBareApp();
  const framework = await createApp({ logger: false });
  await framework.listen({ host: '127.0.0.1', port: 0 });

  try {
    const bareUrl = urlFor(bare);
    const frameworkUrl = urlFor(framework);

    await Promise.all([
      p95Latency(bareUrl, 200, 50),
      p95Latency(frameworkUrl, 200, 50),
    ]);

    const bareRequestsPerSecond = await requestsPerSecond(bareUrl);
    const frameworkRequestsPerSecond = await requestsPerSecond(frameworkUrl);
    const bareP95Ms = await p95Latency(bareUrl);
    const frameworkP95Ms = await p95Latency(frameworkUrl);
    const budget = evaluateBudget({
      bareP95Ms,
      bareRequestsPerSecond,
      frameworkP95Ms,
      frameworkRequestsPerSecond,
    });
    const result = {
      budget,
      environment: {
        concurrency: 50,
        durationSeconds: 10,
        node: process.version,
        platform: platform(),
      },
      measurements: {
        bare: { p95Ms: bareP95Ms, requestsPerSecond: bareRequestsPerSecond },
        framework: {
          p95Ms: frameworkP95Ms,
          requestsPerSecond: frameworkRequestsPerSecond,
        },
      },
    };

    const resultsDirectory = new URL('results/', import.meta.url);
    await mkdir(resultsDirectory, { recursive: true });
    await writeFile(
      new URL('latest.json', resultsDirectory),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

    if (process.env.BENCHMARK_ENFORCE === 'true' && !budget.passed) {
      process.exitCode = 1;
    }
  } finally {
    await Promise.all([bare.close(), framework.close()]);
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  await run();
}
