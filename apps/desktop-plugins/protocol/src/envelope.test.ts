import { describe, expect, it } from 'vitest';

import {
  encodeEnvelope,
  parseEnvelope,
  PLUGIN_PROTOCOL_VERSION,
} from './envelope';

describe('plugin envelope', () => {
  it('round-trips a request', () => {
    const encoded = encodeEnvelope({
      id: '1',
      kind: 'request',
      method: 'ping',
      params: {},
      v: PLUGIN_PROTOCOL_VERSION,
    });
    expect(parseEnvelope(JSON.parse(encoded))).toEqual({
      id: '1',
      kind: 'request',
      method: 'ping',
      params: {},
      v: PLUGIN_PROTOCOL_VERSION,
    });
  });

  it('rejects a missing version', () => {
    expect(
      parseEnvelope({ id: '1', kind: 'request', method: 'ping' }),
    ).toBeNull();
  });

  it('rejects a mismatched version', () => {
    expect(
      parseEnvelope({
        id: '1',
        kind: 'request',
        method: 'ping',
        params: {},
        v: PLUGIN_PROTOCOL_VERSION + 1,
      }),
    ).toBeNull();
  });

  it('parses an error response', () => {
    const encoded = encodeEnvelope({
      error: { code: 'unavailable', message: 'plugin crashed' },
      id: '1',
      kind: 'response',
      ok: false,
      v: PLUGIN_PROTOCOL_VERSION,
    });
    expect(parseEnvelope(JSON.parse(encoded))).toMatchObject({
      kind: 'response',
      ok: false,
    });
  });
});
