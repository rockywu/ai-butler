import { describe, expect, it } from 'vitest';

import { findInstalledBrowser } from './detect-browser';

describe('findInstalledBrowser', () => {
  it('finds macOS Chrome when the app bundle exists', () => {
    const found = findInstalledBrowser('chrome', {
      env: {},
      exists: (filePath) =>
        filePath ===
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      homedir: '/Users/demo',
      platform: 'darwin',
    });
    expect(found).toEqual({
      channel: 'chrome',
      executablePath:
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      type: 'chrome',
      userDataDir: '/Users/demo/Library/Application Support/Google/Chrome',
    });
  });

  it('returns null when Edge is missing on Windows', () => {
    const found = findInstalledBrowser('edge', {
      env: { LOCALAPPDATA: 'C:\\Users\\demo\\AppData\\Local' },
      exists: () => false,
      homedir: 'C:\\Users\\demo',
      platform: 'win32',
    });
    expect(found).toBeNull();
  });
});
