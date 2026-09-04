export interface ProbeService {
  read(): { pong: boolean; source: string };
}

export function createProbeService(): ProbeService {
  return {
    read: () => ({ pong: true, source: 'real' }),
  };
}
