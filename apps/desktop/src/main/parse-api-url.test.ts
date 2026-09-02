import { describe, expect, it } from 'vitest';

import { parseApiUrlFromArgv } from './parse-api-url';

describe('parseApiUrlFromArgv', () => {
  it('parses --api-url=value', () => {
    expect(
      parseApiUrlFromArgv(['electron', '--api-url=http://localhost:5320/api']),
    ).toBe('http://localhost:5320/api');
  });

  it('parses --api-url value', () => {
    expect(
      parseApiUrlFromArgv(['electron', '--api-url', 'https://api.example.com']),
    ).toBe('https://api.example.com');
  });

  it('rejects non-http(s) protocols', () => {
    expect(parseApiUrlFromArgv(['--api-url=file:///tmp'])).toBeNull();
    expect(parseApiUrlFromArgv(['--api-url=ftp://example.com'])).toBeNull();
  });

  it('returns null when missing or invalid', () => {
    expect(parseApiUrlFromArgv([])).toBeNull();
    expect(parseApiUrlFromArgv(['--api-url'])).toBeNull();
    expect(parseApiUrlFromArgv(['--api-url='])).toBeNull();
    expect(parseApiUrlFromArgv(['--api-url=not-a-url'])).toBeNull();
  });
});
