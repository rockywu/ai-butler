/**
 * 从 Electron/Node argv 解析 `--api-url`。
 * 支持 `--api-url=https://example.com/api` 与 `--api-url https://example.com/api`。
 */
export function parseApiUrlFromArgv(argv: readonly string[]): null | string {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument) {
      continue;
    }

    let candidate: null | string = null;
    if (argument.startsWith('--api-url=')) {
      candidate = argument.slice('--api-url='.length);
    } else if (argument === '--api-url') {
      candidate = argv[index + 1] ?? null;
    }

    if (candidate === null) {
      continue;
    }

    const normalized = candidate.trim();
    if (!normalized) {
      return null;
    }

    try {
      const url = new URL(normalized);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return normalized;
    } catch {
      return null;
    }
  }

  return null;
}
