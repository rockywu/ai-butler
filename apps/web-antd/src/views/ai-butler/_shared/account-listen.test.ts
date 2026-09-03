import { describe, expect, it } from 'vitest';

import { listenToggleLabel } from './account-listen';

describe('listenToggleLabel', () => {
  it('shows close when listening is on', () => {
    expect(listenToggleLabel(true)).toBe('关闭监听');
  });

  it('shows open when listening is off', () => {
    expect(listenToggleLabel(false)).toBe('开启监听');
  });
});
