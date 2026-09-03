import { describe, expect, it } from 'vitest';

import { toAuthLoginPayload } from './login-payload';

describe('toAuthLoginPayload', () => {
  it('maps sms tab to username/password', () => {
    expect(
      toAuthLoginPayload({
        tab: 'code',
        phone: '13800006688',
        code: '123456',
        password: '',
      }),
    ).toEqual({ username: '13800006688', password: '123456' });
  });

  it('maps password tab to username/password', () => {
    expect(
      toAuthLoginPayload({
        tab: 'pwd',
        phone: 'vben',
        code: '',
        password: '123456',
      }),
    ).toEqual({ username: 'vben', password: '123456' });
  });
});
