export type LoginTab = 'code' | 'pwd';

export function toAuthLoginPayload(input: {
  code: string;
  password: string;
  phone: string;
  tab: LoginTab;
}): { password: string; username: string } {
  return {
    username: input.phone,
    password: input.tab === 'code' ? input.code : input.password,
  };
}
