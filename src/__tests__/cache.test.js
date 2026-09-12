const CacheService = require('../services/cacheService');

describe('CacheService', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheService(1000);
  });

  it('stores and retrieves a value', () => {
    cache.set('key', { data: 42 });
    expect(cache.get('key')).toEqual({ data: 42 });
  });

  it('returns null for a missing key', () => {
    expect(cache.get('nope')).toBeNull();
  });

  it('expires entries after TTL', () => {
    jest.useFakeTimers();
    cache.set('key', 'value');
    jest.advanceTimersByTime(1500);
    expect(cache.get('key')).toBeNull();
    jest.useRealTimers();
  });

  it('keeps entries within TTL', () => {
    jest.useFakeTimers();
    cache.set('key', 'value');
    jest.advanceTimersByTime(500);
    expect(cache.get('key')).toBe('value');
    jest.useRealTimers();
  });
});