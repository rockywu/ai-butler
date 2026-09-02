/**
 * 生成在页面主世界、且须先于 `_app-config-*.js` 执行的覆盖脚本。
 *
 * Vben 的 app-config 顺序是：
 * 1. `window._VBEN_ADMIN_PRO_APP_CONF_ = {...}`
 * 2. `Object.freeze(...)`
 * 3. `Object.defineProperty(..., { configurable:false, writable:false })`（无 value）
 *
 * 第 3 步会清掉普通 accessor，因此这里同时劫持赋值与 defineProperty。
 */
export function createApiUrlInterceptorScript(apiURL: string): string {
  return `(() => {
  const apiURL = ${JSON.stringify(apiURL)};
  const originalDefineProperty = Object.defineProperty;
  let current;

  function withApiUrl(value) {
    return Object.assign({}, value || {}, { VITE_GLOB_API_URL: apiURL });
  }

  originalDefineProperty.call(Object, window, '_VBEN_ADMIN_PRO_APP_CONF_', {
    configurable: true,
    enumerable: true,
    get() {
      return current;
    },
    set(value) {
      current = withApiUrl(value);
    },
  });

  Object.defineProperty = function (target, property, descriptor) {
    if (
      target === window &&
      property === '_VBEN_ADMIN_PRO_APP_CONF_' &&
      descriptor &&
      !descriptor.get &&
      !descriptor.set
    ) {
      const value = withApiUrl(descriptor.value ?? current);
      Object.freeze(value);
      return originalDefineProperty.call(Object, target, property, {
        configurable: false,
        enumerable: true,
        value,
        writable: false,
      });
    }
    return originalDefineProperty.call(Object, target, property, descriptor);
  };
})();`;
}

export function injectApiUrlInterceptorIntoHtml(
  html: string,
  apiURL: string,
): string {
  const script = `<script>${createApiUrlInterceptorScript(apiURL)}</script>`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${script}`);
  }
  if (html.includes('<head ')) {
    return html.replace(/<head\s[^>]*>/, (match) => `${match}${script}`);
  }
  return `${script}${html}`;
}
