export const RUNTIME_GET_INFO_CHANNEL = 'runtime:get-info';

/** 同步通道：preload 在页面脚本前读取启动期配置（如 --api-url） */
export const BOOTSTRAP_GET_CONFIG_CHANNEL = 'bootstrap:get-config';

export const BROWSER_START_CHANNEL = 'browser:start';
export const BROWSER_STOP_CHANNEL = 'browser:stop';
export const BROWSER_GET_STATE_CHANNEL = 'browser:get-state';
export const BROWSER_PROGRESS_CHANNEL = 'browser:progress';

export interface DesktopBootstrapConfig {
  apiURL: null | string;
}
