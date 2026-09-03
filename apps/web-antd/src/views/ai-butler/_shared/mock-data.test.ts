import { describe, expect, it } from 'vitest';

import {
  acqLeadCards,
  acqTaskCards,
  acqZoneCards,
  mockAccounts,
  mockComments,
  mockLiveComments,
  mockTasks,
  workbenchStats,
} from './mock-data';

describe('workbenchStats', () => {
  it('matches demo overview cards', () => {
    expect(workbenchStats.map((stat) => stat.label)).toEqual([
      '运行中任务',
      '今日新增线索',
      '累计私信触达',
      '今日自动化执行',
    ]);
    expect(workbenchStats[3]?.value).toBe('42');
  });
});

describe('acquisition cards', () => {
  it('has 4 + 5 + 5 entries matching demo', () => {
    expect(acqZoneCards.map((c) => c.key)).toEqual([
      'account',
      'reply',
      'keyword',
      'process',
    ]);
    expect(acqLeadCards.map((c) => c.key)).toEqual([
      'competitor',
      'video',
      'keyword',
      'live',
      'fan',
    ]);
    expect(acqTaskCards.map((c) => c.key)).toEqual([
      'tasks',
      'interact',
      'comment',
      'live',
      'fan',
    ]);
  });
});

describe('acquisition mock tables', () => {
  it('loads demo accounts and tasks', () => {
    expect(mockAccounts).toHaveLength(5);
    expect(mockAccounts[0]?.nickname).toBe('小雅来啦');
    expect(mockTasks[0]?.id).toBe('T20260812001');
    expect(mockTasks[0]?.settings?.关键词).toBe('家居好物');
  });
});

describe('lead detail mocks', () => {
  it('includes demo comment and live rows', () => {
    expect(mockComments[0]?.name).toBe('Dy丁大帅');
    expect(mockLiveComments[0]?.room).toBe('品牌大促专场');
  });
});
