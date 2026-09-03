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

  it('keeps workbench digital video as top-level menu items', () => {
    const root = aiButler.find((r) => r.name === 'AiButler');
    const childTitles = (root?.children ?? []).map((c) => c.meta?.title);
    expect(childTitles).toContain('工作台');
    expect(childTitles).toContain('AI 智能获客');
    expect(childTitles).toContain('数字人');
    expect(childTitles).toContain('文生视频');
  });
});
