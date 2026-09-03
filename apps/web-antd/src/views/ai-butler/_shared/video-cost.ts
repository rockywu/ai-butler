export type VideoEngine = 'Grok' | 'Seedance' | 'VEO';

export function calcVideoCost(input: {
  duration: '5s' | '10s';
  engine: VideoEngine;
  quality: '720P' | '1080P';
}): number {
  let cost = 10;
  if (input.engine === 'Grok') cost += 5;
  if (input.engine === 'VEO') cost += 8;
  if (input.duration === '10s') cost += 5;
  if (input.quality === '1080P') cost += 5;
  return cost;
}
