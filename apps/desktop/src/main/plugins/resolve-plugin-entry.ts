import { join } from 'node:path';

export function resolvePluginEntry(options: {
  currentDirectory: string;
}): string {
  return join(options.currentDirectory, '../plugins/browser/index.js');
}
