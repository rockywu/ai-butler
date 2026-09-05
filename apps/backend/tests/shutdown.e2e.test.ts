import type { ChildProcessWithoutNullStreams } from 'node:child_process';

import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const backendRoot = fileURLToPath(new URL('../', import.meta.url));

describe('backend process shutdown', () => {
  let child: ChildProcessWithoutNullStreams | undefined;

  afterEach(() => {
    if (child?.exitCode === null) {
      child.kill('SIGKILL');
    }
  });

  it('exits cleanly after SIGTERM', async () => {
    child = spawn(process.execPath, ['dist/main.js'], {
      cwd: backendRoot,
      env: {
        ...process.env,
        APP_ENV: 'test',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        PORT: '0',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`backend did not start:\n${output}`));
      }, 5000);
      const onData = (chunk: Buffer) => {
        output += chunk.toString();
        if (output.includes('Server listening at')) {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        child?.stdout.off('data', onData);
        child?.stderr.off('data', onData);
      };
      child?.stdout.on('data', onData);
      child?.stderr.on('data', onData);
    });

    const exited = new Promise<
      [code: null | number, signal: NodeJS.Signals | null]
    >((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`backend did not stop:\n${output}`)),
        5000,
      );
      child?.once('exit', (code, signal) => {
        clearTimeout(timeout);
        resolve([code, signal]);
      });
    });
    child.kill('SIGTERM');
    const [code, signal] = await exited;

    expect(signal).toBeNull();
    expect(code).toBe(0);
  });
});
