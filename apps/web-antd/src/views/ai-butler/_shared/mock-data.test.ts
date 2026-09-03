import { describe, expect, it } from 'vitest';

import { workbenchStats } from './mock-data';

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
