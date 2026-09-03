import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export type ConsentBrowserType = 'chrome' | 'edge';

export interface ConsentStore {
  grant: (browserType: ConsentBrowserType) => void;
  hasConsent: (browserType: ConsentBrowserType) => boolean;
}

export class MemoryConsentStore implements ConsentStore {
  private readonly granted = new Set<ConsentBrowserType>();

  grant(browserType: ConsentBrowserType): void {
    this.granted.add(browserType);
  }

  hasConsent(browserType: ConsentBrowserType): boolean {
    return this.granted.has(browserType);
  }
}

type ConsentFile = Partial<Record<ConsentBrowserType, boolean>>;

export class FileConsentStore implements ConsentStore {
  constructor(private readonly filePath: string) {}

  grant(browserType: ConsentBrowserType): void {
    const data = this.read();
    data[browserType] = true;
    writeFileSync(this.filePath, `${JSON.stringify(data)}\n`);
  }

  hasConsent(browserType: ConsentBrowserType): boolean {
    return this.read()[browserType] === true;
  }

  private read(): ConsentFile {
    if (!existsSync(this.filePath)) {
      return {};
    }
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf8')) as ConsentFile;
    } catch {
      return {};
    }
  }
}
