import { join } from 'node:path';

export type InstalledBrowserType = 'chrome' | 'edge';

export interface InstalledBrowser {
  channel: 'chrome' | 'msedge';
  executablePath: string;
  type: InstalledBrowserType;
  userDataDir: string;
}

export interface DetectBrowserDeps {
  env: NodeJS.ProcessEnv;
  exists: (filePath: string) => boolean;
  homedir: string;
  platform: NodeJS.Platform;
}

function localAppData(deps: DetectBrowserDeps): string {
  return deps.env.LOCALAPPDATA ?? join(deps.homedir, 'AppData', 'Local');
}

function windowsChromeCandidates(deps: DetectBrowserDeps): string[] {
  const local = join(
    localAppData(deps),
    'Google',
    'Chrome',
    'Application',
    'chrome.exe',
  );
  const programFiles = join(
    deps.env.PROGRAMFILES ?? String.raw`C:\Program Files`,
    'Google',
    'Chrome',
    'Application',
    'chrome.exe',
  );
  return [local, programFiles];
}

function windowsEdgeCandidates(deps: DetectBrowserDeps): string[] {
  const x86 = join(
    deps.env.PROGRAMFILES_X86 ??
      deps.env['ProgramFiles(x86)'] ??
      String.raw`C:\Program Files (x86)`,
    'Microsoft',
    'Edge',
    'Application',
    'msedge.exe',
  );
  const programFiles = join(
    deps.env.PROGRAMFILES ?? String.raw`C:\Program Files`,
    'Microsoft',
    'Edge',
    'Application',
    'msedge.exe',
  );
  return [x86, programFiles];
}

function firstExisting(paths: string[], exists: (filePath: string) => boolean) {
  return paths.find((filePath) => exists(filePath));
}

export function findInstalledBrowser(
  type: InstalledBrowserType,
  deps: DetectBrowserDeps,
): InstalledBrowser | null {
  if (type === 'chrome' && deps.platform === 'darwin') {
    const executablePath =
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (!deps.exists(executablePath)) return null;
    return {
      channel: 'chrome',
      executablePath,
      type,
      userDataDir: join(
        deps.homedir,
        'Library',
        'Application Support',
        'Google',
        'Chrome',
      ),
    };
  }

  if (type === 'edge' && deps.platform === 'darwin') {
    const executablePath =
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
    if (!deps.exists(executablePath)) return null;
    return {
      channel: 'msedge',
      executablePath,
      type,
      userDataDir: join(
        deps.homedir,
        'Library',
        'Application Support',
        'Microsoft Edge',
      ),
    };
  }

  if (type === 'chrome' && deps.platform === 'win32') {
    const executablePath = firstExisting(
      windowsChromeCandidates(deps),
      deps.exists,
    );
    if (!executablePath) return null;
    return {
      channel: 'chrome',
      executablePath,
      type,
      userDataDir: join(localAppData(deps), 'Google', 'Chrome', 'User Data'),
    };
  }

  if (type === 'edge' && deps.platform === 'win32') {
    const executablePath = firstExisting(
      windowsEdgeCandidates(deps),
      deps.exists,
    );
    if (!executablePath) return null;
    return {
      channel: 'msedge',
      executablePath,
      type,
      userDataDir: join(localAppData(deps), 'Microsoft', 'Edge', 'User Data'),
    };
  }

  return null;
}
