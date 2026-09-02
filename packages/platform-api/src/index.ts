export const PLATFORM_PROTOCOL_VERSION = 1;

export type RuntimeTarget = 'desktop' | 'web';
export type DesktopPlatform = 'darwin' | 'win32';
export type PlatformErrorCode =
  | 'conflict'
  | 'internal'
  | 'invalid_argument'
  | 'permission_denied'
  | 'timeout'
  | 'unavailable'
  | 'unsupported'
  | 'user_cancelled';

export interface PlatformError {
  code: PlatformErrorCode;
  message: string;
}

export type PlatformResult<T> =
  | { data: T; ok: true }
  | { error: PlatformError; ok: false };

export interface RuntimeInfo {
  appVersion: string;
  arch: string;
  capabilities: string[];
  platform: 'web' | DesktopPlatform;
  protocolVersion: number;
  target: RuntimeTarget;
}

export interface RuntimeApi {
  getInfo: () => Promise<PlatformResult<RuntimeInfo>>;
}

export interface PlatformApi {
  protocolVersion: number;
  runtime: RuntimeApi;
}

export interface DesktopBridge {
  protocolVersion: number;
  runtime: RuntimeApi;
}
