export const PLUGIN_PROTOCOL_VERSION = 1;

export type PluginErrorCode =
  | 'conflict'
  | 'internal'
  | 'invalid_argument'
  | 'permission_denied'
  | 'timeout'
  | 'unavailable'
  | 'unsupported'
  | 'user_cancelled';

export interface PluginError {
  code: PluginErrorCode;
  message: string;
}

export type PluginMethod =
  | 'ping'
  | 'session.getState'
  | 'session.start'
  | 'session.stop';

export interface PluginRequest {
  id: string;
  kind: 'request';
  method: PluginMethod;
  params: unknown;
  v: typeof PLUGIN_PROTOCOL_VERSION;
}

export type PluginResponse =
  | {
      data: unknown;
      id: string;
      kind: 'response';
      ok: true;
      v: typeof PLUGIN_PROTOCOL_VERSION;
    }
  | {
      error: PluginError;
      id: string;
      kind: 'response';
      ok: false;
      v: typeof PLUGIN_PROTOCOL_VERSION;
    };

export interface PluginEvent {
  event: string;
  kind: 'event';
  payload: unknown;
  v: typeof PLUGIN_PROTOCOL_VERSION;
}

export type PluginEnvelope = PluginEvent | PluginRequest | PluginResponse;

const PLUGIN_METHODS = new Set<PluginMethod>([
  'ping',
  'session.getState',
  'session.start',
  'session.stop',
]);

const PLUGIN_ERROR_CODES = new Set<PluginErrorCode>([
  'conflict',
  'internal',
  'invalid_argument',
  'permission_denied',
  'timeout',
  'unavailable',
  'unsupported',
  'user_cancelled',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPluginMethod(value: unknown): value is PluginMethod {
  return typeof value === 'string' && PLUGIN_METHODS.has(value as PluginMethod);
}

function isPluginError(value: unknown): value is PluginError {
  return (
    isRecord(value) &&
    typeof value.message === 'string' &&
    typeof value.code === 'string' &&
    PLUGIN_ERROR_CODES.has(value.code as PluginErrorCode)
  );
}

export function parseEnvelope(input: unknown): null | PluginEnvelope {
  if (!isRecord(input) || input.v !== PLUGIN_PROTOCOL_VERSION) {
    return null;
  }

  if (input.kind === 'request') {
    if (typeof input.id !== 'string' || !isPluginMethod(input.method)) {
      return null;
    }
    return {
      id: input.id,
      kind: 'request',
      method: input.method,
      params: input.params,
      v: PLUGIN_PROTOCOL_VERSION,
    };
  }

  if (input.kind === 'response') {
    if (typeof input.id !== 'string' || typeof input.ok !== 'boolean') {
      return null;
    }
    if (input.ok) {
      return {
        data: input.data,
        id: input.id,
        kind: 'response',
        ok: true,
        v: PLUGIN_PROTOCOL_VERSION,
      };
    }
    if (!isPluginError(input.error)) {
      return null;
    }
    return {
      error: input.error,
      id: input.id,
      kind: 'response',
      ok: false,
      v: PLUGIN_PROTOCOL_VERSION,
    };
  }

  if (input.kind === 'event') {
    if (typeof input.event !== 'string') {
      return null;
    }
    return {
      event: input.event,
      kind: 'event',
      payload: input.payload,
      v: PLUGIN_PROTOCOL_VERSION,
    };
  }

  return null;
}

export function encodeEnvelope(envelope: PluginEnvelope): string {
  return JSON.stringify(envelope);
}
