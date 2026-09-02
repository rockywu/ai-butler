import { basename } from 'node:path';

export const PROFILE_COPY_SKIP_NAMES = new Set([
  'GraphiteDawnCache',
  'GrShaderCache',
  'ShaderCache',
  'SingletonCookie',
  'SingletonLock',
  'SingletonSocket',
]);

export interface CopyProfileDeps {
  cp: (
    source: string,
    destination: string,
    options: {
      filter: (src: string) => boolean;
      recursive: boolean;
    },
  ) => void;
  mkdir: (path: string, options: { recursive: boolean }) => void;
  rm: (path: string, options: { force: boolean; recursive: boolean }) => void;
}

export function shouldCopyProfileEntry(sourcePath: string): boolean {
  return !PROFILE_COPY_SKIP_NAMES.has(basename(sourcePath));
}

export function copyProfile(
  source: string,
  destination: string,
  deps: CopyProfileDeps,
): void {
  deps.rm(destination, { force: true, recursive: true });
  deps.mkdir(destination, { recursive: true });
  deps.cp(source, destination, {
    filter: (src) => shouldCopyProfileEntry(src),
    recursive: true,
  });
}
