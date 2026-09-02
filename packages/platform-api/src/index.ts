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

export type BrowserKind = 'chrome' | 'edge';
export type BrowserSessionState =
  | 'failed'
  | 'idle'
  | 'preparing'
  | 'running'
  | 'stopping'
  | 'verifying';

export interface BrowserStartRequest {
  browserType: BrowserKind;
  taskId: string;
}

export interface BrowserSessionSnapshot {
  browserType: BrowserKind | null;
  sessionId: null | string;
  state: BrowserSessionState;
  taskId: null | string;
}

export interface BrowserProgressEvent {
  message: string;
  sessionId: string;
  state: BrowserSessionState;
  stepId?: string;
  taskId: string;
}

export interface BrowserSessionApi {
  getState: () => Promise<PlatformResult<BrowserSessionSnapshot>>;
  onProgress: (handler: (event: BrowserProgressEvent) => void) => () => void;
  start: (
    request: BrowserStartRequest,
  ) => Promise<PlatformResult<BrowserSessionSnapshot>>;
  stop: () => Promise<PlatformResult<{ stopped: true }>>;
}

export interface PlatformApi {
  browser: BrowserSessionApi;
  protocolVersion: number;
  runtime: RuntimeApi;
}

export interface DesktopBridge {
  browser: BrowserSessionApi;
  protocolVersion: number;
  runtime: RuntimeApi;
}
