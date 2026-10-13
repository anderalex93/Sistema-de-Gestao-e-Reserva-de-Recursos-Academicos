import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageTokenStore } from '@/lib/api/token-store';

describe('LocalStorageTokenStore', () => {
  afterEach(() => window.localStorage.clear());

  it('stores, reads and clears the token', () => {
    const store = new LocalStorageTokenStore('teste.token');

    store.set('abc');
    expect(store.get()).toBe('abc');

    store.clear();
    expect(store.get()).toBeNull();
  });

  it('degrades silently when storage is blocked', () => {
    const blocked = () => {
      throw new DOMException('bloqueado', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked);
    const store = new LocalStorageTokenStore();

    expect(() => store.set('abc')).not.toThrow();
    expect(store.get()).toBeNull();
    expect(() => store.clear()).not.toThrow();
  });
});
