export const STEALTH_SCRIPT = `(() => {
  try {
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => undefined,
      configurable: true,
    })
    for (const k of Object.keys(window)) {
      if (/^(cdc_|\\$cdc_|__pwInit|__playwright|__puppeteer)/.test(k)) {
        try { delete window[k] } catch (e) {}
      }
    }
    try {
      delete document.__webdriver_evaluate
      delete document.__webdriver_script_function
      delete document.__webdriver_attr_function
      delete document.__selenium_unwrapped
      delete document.__driver_evaluate
      delete document.__driver_unwrap
      delete document.__fxdriver_evaluate
      delete document.__fxdriver_unwrap
    } catch (e) {}
  } catch (e) {}
})()`;
