import { describe, expect, it } from 'vitest';

import { mockTasks } from './mock-data';
import { commentModalKeyForTask } from './task-comment-modal';

describe('commentModalKeyForTask', () => {
  it('opens comment list for keyword competitor and video tasks', () => {
    expect(commentModalKeyForTask('关键词拓客')).toBe('m-comment');
    expect(commentModalKeyForTask('对标拓客')).toBe('m-comment');
    expect(commentModalKeyForTask('视频拓客')).toBe('m-comment');
  });

  it('opens live comment list for live tasks', () => {
    expect(commentModalKeyForTask('直播拓客')).toBe('m-live');
  });

  it('opens fan list for fan tasks', () => {
    expect(commentModalKeyForTask('粉丝拓客')).toBe('m-fan');
  });

  it('maps every mock task type to the planned modal', () => {
    const expected: Record<string, string> = {
      关键词拓客: 'm-comment',
      对标拓客: 'm-comment',
      视频拓客: 'm-comment',
      直播拓客: 'm-live',
      粉丝拓客: 'm-fan',
    };

    for (const task of mockTasks) {
      expect(commentModalKeyForTask(task.typeLabel)).toBe(
        expected[task.typeLabel],
      );
    }
  });
});
