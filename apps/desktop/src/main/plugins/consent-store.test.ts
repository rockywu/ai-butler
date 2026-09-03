import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FileConsentStore, MemoryConsentStore } from './consent-store';

describe('memoryConsentStore', () => {
  it('records consent after grant', () => {
    const store = new MemoryConsentStore();
    expect(store.hasConsent('chrome')).toBe(false);
    store.grant('chrome');
    expect(store.hasConsent('chrome')).toBe(true);
  });
});

describe('fileConsentStore', () => {
  it('persists chrome consent to json', () => {
    const directory = mkdtempSync(join(tmpdir(), 'browser-consent-'));
    const filePath = join(directory, 'browser-plugin-consent.json');
    writeFileSync(filePath, JSON.stringify({ chrome: true }));

    const store = new FileConsentStore(filePath);
    expect(store.hasConsent('chrome')).toBe(true);
    expect(store.hasConsent('edge')).toBe(false);

    store.grant('edge');
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({
      chrome: true,
      edge: true,
    });
  });
});
