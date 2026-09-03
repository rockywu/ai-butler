export type CommentModalKey = 'm-comment' | 'm-fan' | 'm-live';

export function commentModalKeyForTask(typeLabel: string): CommentModalKey {
  if (typeLabel === '直播拓客') return 'm-live';
  if (typeLabel === '粉丝拓客') return 'm-fan';
  return 'm-comment';
}
