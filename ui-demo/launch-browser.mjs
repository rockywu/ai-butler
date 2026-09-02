// repl/launch-browser.mjs
// 独立启动 headed Chrome,开放 CDP 端口供 REPL 连接
// 这是一个**独立进程**:不依赖 REPL server,REPL 死掉它也活着
//
// 用法:
//   node repl/launch-browser.mjs                          # 临时 profile (默认,无登录态)
//   USE_SYSTEM_PROFILE=1 node repl/launch-browser.mjs    # 用系统 Chrome profile(固定副本,保留登录态)
//   RECOPY_PROFILE=1 USE_SYSTEM_PROFILE=1 node ...        # 强制重新复制系统 profile 到固定副本
//   CDP_PORT=19222 node repl/launch-browser.mjs           # 自定义 CDP 端口
//
// ⚠ USE_SYSTEM_PROFILE=1 时:
//   - 副本目录: ~/.cache/chrome-profile-recorder/ (固定,登录态永久保留)
//   - 第一次启动: 从系统 profile 复制过来(可能要 10-30 秒)
//   - 之后启动: 直接复用,几秒就起来
//   - 系统 Chrome 跑着也能用(不会冲突)
//   - RECOPY_PROFILE=1 时: 删掉旧副本重新复制(用于同步系统 Chrome 的新登录/退出)
//
// REPL 启动时会自动检测端口,如果没有运行就 spawn 这个脚本

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { basename, join } from 'node:path';

import { chromium } from 'playwright';

const CDP_PORT = Number(process.env.CDP_PORT) || 9222;
const USE_SYSTEM_PROFILE = process.env.USE_SYSTEM_PROFILE === '1';
const RECOPY_PROFILE = process.env.RECOPY_PROFILE === '1';

function getSystemChromeProfile() {
  if (platform() === 'darwin') {
    return join(
      homedir(),
      'Library',
      'Application Support',
      'Google',
      'Chrome',
    );
  }
  if (platform() === 'linux') {
    return join(homedir(), '.config', 'google-chrome');
  }
  // win32
  return join(
    process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'),
    'Google',
    'Chrome',
    'User Data',
  );
}

function getRecorderProfileDir() {
  // 固定副本目录(登录态永久保留)
  return join(homedir(), '.cache', 'chrome-profile-recorder');
}

const commonArgs = [
  `--remote-debugging-port=${CDP_PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
];

// 反检测 stealth 脚本
// 通过 addInitScript 注入到每个 page 加载时(在主 world 之前)
// 目标: 让目标网站看不出这是 Playwright 控制的浏览器
// ⚠ 关键原则: 尽量不碰 fingerprint(navigator.plugins / canvas / 等),只清"自动化工具"特征
//   因为改了 fingerprint 会让风控系统(如 douyin 的 SLARDAR)认为"可疑设备",
//   反而触发强制登出。
const STEALTH_SCRIPT = `(() => {
  try {
    // 1) webdriver 标志 — Playwright 唯一会主动设置的明显痕迹
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => undefined,
      configurable: true,
    })
    // 2) 清理 cdc_*/$cdc_* 全局(Selenium 特征)
    for (const k of Object.keys(window)) {
      if (/^(cdc_|\\$cdc_|__pwInit|__playwright|__puppeteer)/.test(k)) {
        try { delete window[k] } catch (e) {}
      }
    }
    // 3) 清理 document 上的 webdriver 痕迹(Selenium 注入的函数)
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
    // 4) permissions 查询 — 不修改,避免破坏风控期望的 fingerprint
  } catch (e) {}
})()`;

let browser;
let ctx;
let userDataDir;

if (USE_SYSTEM_PROFILE) {
  const systemProfile = getSystemChromeProfile();
  if (!existsSync(systemProfile)) {
    console.error(`\n❌ 系统 Chrome profile 不存在: ${systemProfile}`);
    console.error(
      '   请确认你系统 Chrome 至少启动过一次,或者取消 USE_SYSTEM_PROFILE=1\n',
    );
    process.exit(1);
  }

  const recorderProfile = getRecorderProfileDir();
  const needCopy = !existsSync(recorderProfile) || RECOPY_PROFILE;

  if (needCopy) {
    if (RECOPY_PROFILE && existsSync(recorderProfile)) {
      console.log(`\n🔄 RECOPY_PROFILE=1,删掉旧副本: ${recorderProfile}`);
      rmSync(recorderProfile, { recursive: true, force: true });
    }
    console.log('');
    console.log('📦 第一次启动 / 强制重新复制:');
    console.log(`   从: ${systemProfile}`);
    console.log(`   到: ${recorderProfile}`);
    console.log('   (profile 几百 MB,可能要 10-30 秒)...');
    console.log('');
    try {
      mkdirSync(join(homedir(), '.cache'), { recursive: true });
      // 排除锁文件 + 大缓存
      cpSync(systemProfile, recorderProfile, {
        recursive: true,
        filter: (src) => {
          const base = basename(src);
          if (
            base === 'SingletonLock' ||
            base === 'SingletonCookie' ||
            base === 'SingletonSocket'
          )
            return false;
          if (
            base === 'GrShaderCache' ||
            base === 'ShaderCache' ||
            base === 'GraphiteDawnCache'
          )
            return false;
          return true;
        },
      });
      console.log('✓ 复制完成');
    } catch (error) {
      console.error(`❌ 复制失败: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('');
    console.log('♻️  复用固定副本(登录态保留):', recorderProfile);
  }

  userDataDir = recorderProfile;

  console.log('');
  console.log('🪟  独立 Chrome 已启动 (USE_SYSTEM_PROFILE=1)');
  console.log(`   CDP 端口: ${CDP_PORT}`);
  console.log(`   Profile:  ${userDataDir}`);
  console.log(
    '   💡 系统 Chrome 新登录/退出后,跑一次: RECOPY_PROFILE=1 USE_SYSTEM_PROFILE=1 node ...',
  );
  console.log('   手动关闭这个窗口 = 关闭浏览器');
  console.log('   按 Ctrl+C 退出本进程(同时关闭浏览器)');
  console.log('');

  ctx = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: false,
    args: commonArgs,
    // 去掉 --no-sandbox,避免 Chrome 顶部"不安全 / 由不受信任开发者运行"警告
    ignoreDefaultArgs: ['--no-sandbox'],
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  });
  // 反检测 stealth 脚本(每个 page 加载时跑一次)
  await ctx.addInitScript({ content: STEALTH_SCRIPT });
} else {
  console.log('');
  console.log('🪟  独立 Chrome 已启动 (临时 profile)');
  console.log(`   CDP 端口: ${CDP_PORT}`);
  console.log('   💡 想保留系统 Chrome 的登录态? 用 USE_SYSTEM_PROFILE=1 启动');
  console.log('   手动关闭这个窗口 = 关闭浏览器');
  console.log('   按 Ctrl+C 退出本进程(同时关闭浏览器)');
  console.log('');

  browser = await chromium.launch({
    channel: 'chrome',
    headless: false, // 必须有头,要看到窗口
    args: commonArgs,
    ignoreDefaultArgs: ['--no-sandbox'],
  });
  // 默认 context 也加 stealth(临时 profile 模式)
  const defaultCtx = browser.contexts()[0];
  if (defaultCtx) await defaultCtx.addInitScript({ content: STEALTH_SCRIPT });
}

const shutdown = async () => {
  console.log('\n关闭浏览器...');
  try {
    if (browser) await browser.close();
  } catch {}
  try {
    if (ctx) await ctx.close();
  } catch {}
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 阻塞主进程,保持浏览器活着
await new Promise(() => {});
