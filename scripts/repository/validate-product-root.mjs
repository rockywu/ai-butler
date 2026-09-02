import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const failures = [];

async function exists(path) {
  try {
    await access(join(root, path));
    return true;
  } catch {
    return false;
  }
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(
  await readFile(join(root, 'package.json'), 'utf8'),
);
const appPackageJson = JSON.parse(
  await readFile(join(root, 'apps/web-antd/package.json'), 'utf8'),
);
const changesetConfig = JSON.parse(
  await readFile(join(root, '.changeset/config.json'), 'utf8'),
);
const workspace = await readFile(join(root, 'pnpm-workspace.yaml'), 'utf8');
const gitignore = await readFile(join(root, '.gitignore'), 'utf8');
const claude = await readFile(join(root, 'CLAUDE.md'), 'utf8');
const appEnv = await readFile(join(root, 'apps/web-antd/.env'), 'utf8');
const productionEnv = await readFile(
  join(root, 'apps/web-antd/.env.production'),
  'utf8',
);
const mockEnv = await readFile(join(root, 'apps/backend-mock/.env'), 'utf8');

expect(packageJson.name === 'ai-butler', '根 package 名必须是 ai-butler');
expect(packageJson.version === '0.1.0', '初始产品版本必须是 0.1.0');
expect(packageJson.private === true, '根 package 必须保持 private');
expect(packageJson.license === 'UNLICENSED', '根 package 必须标记 UNLICENSED');
expect(!packageJson.repository, '根 package 不得保留 Vben repository');
expect(!packageJson.homepage, '根 package 不得保留 Vben homepage');
expect(!packageJson.bugs, '根 package 不得保留 Vben bugs');
expect(appPackageJson.private === true, '主应用 package 必须保持 private');
expect(
  appPackageJson.license === 'UNLICENSED',
  '主应用 package 必须标记 UNLICENSED',
);
expect(!appPackageJson.repository, '主应用 package 不得保留 Vben repository');
expect(!appPackageJson.homepage, '主应用 package 不得保留 Vben homepage');
expect(!appPackageJson.bugs, '主应用 package 不得保留 Vben bugs');
expect(changesetConfig.access === 'restricted', 'changeset 发布范围必须受限');
expect(changesetConfig.changelog === false, 'changeset 不得指向上游 changelog');

for (const script of [
  'build:docs',
  'build:ele',
  'build:naive',
  'build:tdesign',
  'dev:antdv-next',
  'dev:docs',
  'dev:ele',
  'dev:naive',
  'dev:tdesign',
]) {
  expect(!packageJson.scripts?.[script], `必须删除失效脚本 ${script}`);
}

expect(!/^\s*-\s+docs\s*$/m.test(workspace), 'docs 不得作为 pnpm workspace 包');
expect(
  /^\.superpowers\/?$/m.test(gitignore),
  '.gitignore 必须忽略 .superpowers',
);
expect(
  /^\*-worktrees\/$/m.test(gitignore),
  '.gitignore 必须忽略 worktree 目录',
);
expect(/^\.cursor\/?$/m.test(gitignore), '.gitignore 必须忽略 .cursor');
expect(!claude.includes('client-web/'), 'CLAUDE.md 不得保留 client-web 路径');
expect(
  appEnv.includes('VITE_APP_TITLE=AI Butler（阿斯系统）'),
  '应用标题必须是 AI Butler（阿斯系统）',
);
expect(
  appEnv.includes('VITE_APP_NAMESPACE=ai-butler'),
  '应用命名空间必须是 ai-butler',
);
expect(
  appEnv.includes(
    'VITE_APP_STORE_SECURE_KEY=please-replace-me-with-your-own-key',
  ),
  '受跟踪的 Web 环境文件只能保留占位密钥',
);
expect(
  mockEnv.includes('ACCESS_TOKEN_SECRET=access_token_secret') &&
    mockEnv.includes('REFRESH_TOKEN_SECRET=refresh_token_secret'),
  '受跟踪的 Mock 环境文件只能保留占位密钥',
);
expect(
  productionEnv.includes('VITE_GLOB_API_URL=/api') &&
    !productionEnv.includes('vben.pro'),
  '生产 API 必须使用产品地址，不能指向 Vben Mock',
);

for (const path of [
  'apps/web-antd/package.json',
  'docs/superpowers/migrations/2026-09-02-single-repository.md',
  'docs/superpowers/plans/2026-09-02-single-repository-migration.md',
  'docs/superpowers/specs/骨架设计.md',
  'docs/superpowers/specs/2026-09-02-ai-butler-desktop-design.md',
  'ui-demo/阿斯系统-桌面端原型-1.0.html',
  'NOTICE.md',
  'LICENSES/VBEN-MIT.txt',
  'ai-butler.code-workspace',
]) {
  expect(await exists(path), `缺少必需路径 ${path}`);
}

for (const path of [
  '.gitmodules',
  'client-web',
  'LICENSE',
  'README.zh-CN.md',
  'README.ja-JP.md',
  'vben-admin.code-workspace',
]) {
  expect(!(await exists(path)), `不得存在旧结构 ${path}`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('AI Butler product root is valid');
