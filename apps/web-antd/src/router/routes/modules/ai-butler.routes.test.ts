import { generateMenus } from '@vben/utils';

import { describe, expect, it } from 'vitest';

import aiButler from './ai-butler';

function flatten(
  routes: typeof aiButler,
  acc: { name?: string; path: string }[] = [],
) {
  for (const r of routes) {
    acc.push({ name: r.name as string | undefined, path: r.path });
    if (r.children) flatten(r.children as typeof aiButler, acc);
  }
  return acc;
}

describe('ai-butler routes', () => {
  it('groups acquisition pages under AI 智能获客', () => {
    const root = aiButler.find((r) => r.name === 'AiButler');
    expect(root?.meta?.hideInMenu).toBe(true);
    expect(root?.meta?.title).toBe('Root');
    const names = flatten(aiButler).map((r) => r.name);
    expect(names).toContain('AiButlerGrowth');
    expect(names).toContain('AiButlerAcquisition');
    expect(names).toContain('AiButlerChat');
    expect(names).toContain('AiButlerContacts');
    expect(names).not.toContain('AiButlerLogin');
    expect(names).toContain('Profile');
  });

  it('keeps workbench and growth as top-level menu items', () => {
    const mockRouter = {
      getRoutes: () =>
        flatten(aiButler).map((r) => ({ name: r.name, path: r.path })),
    };
    const menus = generateMenus(aiButler, mockRouter as never);
    const names = menus.map((m) => m.name);
    expect(names).toEqual(['工作台', 'AI 智能获客']);
    expect(names).not.toContain('数字人');
    expect(names).not.toContain('文生视频');
    expect(names).not.toContain('Root');
    expect(names).not.toContain('阿斯系统');
    const growth = menus.find((m) => m.name === 'AI 智能获客');
    expect(growth?.children?.map((c) => c.name)).toEqual([
      '智能获客',
      '聊天接管',
      '联系列表',
    ]);
  });
});
