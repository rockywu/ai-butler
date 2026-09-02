import type { OxlintConfig } from 'oxlint';

const ignores: OxlintConfig = {
  ignorePatterns: [
    '**/dist/**',
    '**/node_modules/**',
    // Electron 构建产物（即使误暂存也不应被 lint）
    '**/out/**',
    '**/release/**',
    'docs/**',
    'playground/public/**',
    '**/*.json',
    '**/*.md',
    '**/*.svg',
    '**/*.yaml',
    '**/*.yml',
    // 产品原型与示例脚本，不纳入业务 lint
    'ui-demo/**',
  ],
};

export { ignores };
