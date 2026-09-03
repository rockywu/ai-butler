import type { PluginError, PluginMethod } from './envelope.ts';

import { parseEnvelope, PLUGIN_PROTOCOL_VERSION } from './envelope.ts';

export interface PluginTransport {
  kill: () => void;
  onExit: (handler: (code: null | number) => void) => () => void;
  onMessage: (handler: (message: unknown) => void) => () => void;
  send: (message: unknown) => void;
}

export class PluginClientError extends Error {
  readonly code: PluginError['code'];

  constructor(error: PluginError) {
    super(error.message);
    this.name = 'PluginClientError';
    this.code = error.code;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

interface PendingRequest {
  reject: (error: PluginClientError) => void;
  resolve: (data: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class PluginClient {
  private readonly eventHandlers = new Map<
    string,
    Set<(payload: unknown) => void>
  >();
  private nextId = 1;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly transport: PluginTransport;

  constructor(transport: PluginTransport) {
    this.transport = transport;
    transport.onMessage((message) => {
      this.handleMessage(message);
    });
    transport.onExit(() => {
      this.rejectAll({
        code: 'unavailable',
        message: 'plugin process exited',
      });
    });
  }

  invoke(method: PluginMethod, params: unknown): Promise<unknown> {
    const id = String(this.nextId);
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new PluginClientError({
            code: 'timeout',
            message: 'plugin request timed out',
          }),
        );
      }, DEFAULT_TIMEOUT_MS);

      this.pending.set(id, { reject, resolve, timer });
      this.transport.send({
        id,
        kind: 'request',
        method,
        params,
        v: PLUGIN_PROTOCOL_VERSION,
      });
    });
  }

  onEvent(event: string, handler: (payload: unknown) => void): () => void {
    const handlers = this.eventHandlers.get(event) ?? new Set();
    handlers.add(handler);
    this.eventHandlers.set(event, handlers);
    return () => {
      handlers.delete(handler);
    };
  }

  private handleMessage(message: unknown): void {
    const envelope = parseEnvelope(message);
    if (!envelope) return;

    if (envelope.kind === 'response') {
      const pending = this.pending.get(envelope.id);
      if (!pending) return;
      this.pending.delete(envelope.id);
      clearTimeout(pending.timer);
      if (envelope.ok) {
        pending.resolve(envelope.data);
        return;
      }
      pending.reject(new PluginClientError(envelope.error));
      return;
    }

    if (envelope.kind === 'event') {
      const handlers = this.eventHandlers.get(envelope.event);
      if (!handlers) return;
      for (const handler of handlers) {
        handler(envelope.payload);
      }
    }
  }

  private rejectAll(error: PluginError): void {
    const clientError = new PluginClientError(error);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(clientError);
    }
    this.pending.clear();
  }
}
