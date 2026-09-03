import { describe, expect, it } from 'vitest';

import { filterContacts } from './contact-filter';

const rows = [
  {
    id: 'c1',
    name: '家居控小林',
    platform: 'douyin',
    source: '关键词拓客 · 家居好物',
    phone: '138****6688',
    status: '待跟进',
  },
  {
    id: 'c4',
    name: '某手-阿强',
    platform: 'kuaishou',
    source: '直播拓客 · 家居专场',
    phone: '—',
    status: '未回复',
  },
];

describe('filterContacts', () => {
  it('filters by platform status source and search', () => {
    expect(
      filterContacts(rows, {
        platform: 'douyin',
        status: 'all',
        source: 'all',
        search: '',
      }),
    ).toHaveLength(1);
    expect(
      filterContacts(rows, {
        platform: 'all',
        status: '未回复',
        source: 'all',
        search: '',
      })[0]?.name,
    ).toBe('某手-阿强');
    expect(
      filterContacts(rows, {
        platform: 'all',
        status: 'all',
        source: 'all',
        search: '小林',
      }),
    ).toHaveLength(1);
  });
});
