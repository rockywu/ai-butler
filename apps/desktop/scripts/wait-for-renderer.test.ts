import type { AddressInfo } from 'node:net';

import { createServer } from 'node:http';
import { createServer as createNetServer } from 'node:net';

import { describe, expect, it } from 'vitest';

import { waitForRenderer } from './wait-for-renderer.mjs';

function listen(server: {
  listen: (port: number, host: string, cb: () => void) => void;
}): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve((server as { address: () => AddressInfo }).address().port);
    });
  });
}

describe('waitForRenderer', () => {
  it('resolves when the renderer answers HTTP', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200);
      response.end('ok');
    });
    const port = await listen(server);
    try {
      await expect(
        waitForRenderer({
          timeoutMs: 2000,
          url: `http://127.0.0.1:${port}`,
        }),
      ).resolves.toBeUndefined();
    } finally {
      server.close();
    }
  });

  it(
    'does not treat a TCP listener without HTTP as ready',
    { timeout: 10_000 },
    async () => {
      const server = createNetServer();
      const port = await listen(server);
      try {
        await expect(
          waitForRenderer({
            intervalMs: 150,
            timeoutMs: 800,
            url: `http://127.0.0.1:${port}`,
          }),
        ).rejects.toThrow(/http:\/\/127\.0\.0\.1:/);
      } finally {
        server.close();
      }
    },
  );
});
