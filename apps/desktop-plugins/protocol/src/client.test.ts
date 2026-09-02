import type { PluginTransport } from './client';

import { describe, expect, it } from 'vitest';

import { PluginClient } from './client';
import { encodeEnvelope, parseEnvelope } from './envelope';

function createLoopback(): {
  clientTransport: PluginTransport;
  handle: (
    handler: (request: {
      id: string;
      method: string;
      params: unknown;
    }) => unknown,
  ) => void;
} {
  let onMessage: ((message: unknown) => void) | undefined;
  let currentHandler:
    | ((request: { id: string; method: string; params: unknown }) => unknown)
    | undefined;

  const clientTransport: PluginTransport = {
    kill() {},
    onExit() {
      return () => {};
    },
    onMessage(handler) {
      onMessage = handler;
      return () => {
        onMessage = undefined;
      };
    },
    send(message) {
      const envelope = parseEnvelope(message);
      if (!envelope || envelope.kind !== 'request') return;
      const result = currentHandler?.(envelope);
      onMessage?.(
        JSON.parse(
          encodeEnvelope({
            data: result,
            id: envelope.id,
            kind: 'response',
            ok: true,
            v: envelope.v,
          }),
        ),
      );
    },
  };

  return {
    clientTransport,
    handle(handler) {
      currentHandler = handler;
    },
  };
}

describe('pluginClient', () => {
  it('invokes ping and returns data', async () => {
    const loopback = createLoopback();
    loopback.handle(() => ({ pong: true }));
    const client = new PluginClient(loopback.clientTransport);
    await expect(client.invoke('ping', {})).resolves.toEqual({ pong: true });
  });

  it('rejects when the child exits before responding', async () => {
    const listeners: Array<(code: null | number) => void> = [];
    const transport: PluginTransport = {
      kill() {},
      onExit(handler) {
        listeners.push(handler);
        return () => {};
      },
      onMessage() {
        return () => {};
      },
      send() {},
    };
    const client = new PluginClient(transport);
    const pending = client.invoke('ping', {});
    listeners[0]?.(1);
    await expect(pending).rejects.toMatchObject({ code: 'unavailable' });
  });
});
