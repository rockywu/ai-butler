import { describe, expect, it, vi } from 'vitest';

import { ResourceRegistry } from './resource-registry';

describe('resourceRegistry', () => {
  it('closes resources once in reverse registration order', async () => {
    const order: string[] = [];
    const registry = new ResourceRegistry();
    registry.register('database', async () => void order.push('database'));
    registry.register('http', async () => void order.push('http'));

    await registry.closeAll();
    await registry.closeAll();

    expect(order).toEqual(['http', 'database']);
  });

  it('continues closing after one resource fails', async () => {
    const closeDatabase = vi.fn();
    const registry = new ResourceRegistry();
    registry.register('database', closeDatabase);
    registry.register('http', async () => {
      throw new Error('http close failed');
    });

    await expect(registry.closeAll()).rejects.toBeInstanceOf(AggregateError);
    expect(closeDatabase).toHaveBeenCalledOnce();
  });
});
