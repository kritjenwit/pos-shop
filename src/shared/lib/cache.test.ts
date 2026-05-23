import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setCache, getCache, invalidateCache, invalidateAllCache, isCacheValid } from './cache';

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('setCache', () => {
    it('should store data in localStorage', () => {
      setCache('test-key', { foo: 'bar' });
      const raw = localStorage.getItem('pos-shop-cache-test-key');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.data).toEqual({ foo: 'bar' });
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.expiry).toBeDefined();
    });

    it('should set expiry > timestamp', () => {
      setCache('test-key', 'value');
      const raw = localStorage.getItem('pos-shop-cache-test-key')!;
      const parsed = JSON.parse(raw);
      expect(parsed.expiry).toBeGreaterThan(parsed.timestamp);
    });
  });

  describe('getCache', () => {
    it('should return stored data', () => {
      setCache('test-key', { foo: 'bar' });
      const result = getCache<{ foo: string }>('test-key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return null for missing key', () => {
      const result = getCache('non-existent');
      expect(result).toBeNull();
    });

    it('should return null when cache is expired', () => {
      const entry = {
        data: 'stale',
        timestamp: Date.now() - 10000,
        expiry: Date.now() - 1000,
      };
      localStorage.setItem('pos-shop-cache-test-key', JSON.stringify(entry));
      const result = getCache('test-key');
      expect(result).toBeNull();
      expect(localStorage.getItem('pos-shop-cache-test-key')).toBeNull();
    });

    it('should handle invalid JSON', () => {
      localStorage.setItem('pos-shop-cache-test-key', 'not-json');
      const result = getCache('test-key');
      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should remove specific cache entry', () => {
      setCache('test-key', 'value');
      invalidateCache('test-key');
      expect(localStorage.getItem('pos-shop-cache-test-key')).toBeNull();
    });
  });

  describe('invalidateAllCache', () => {
    it('should remove all cache entries', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      localStorage.setItem('other-storage', 'keep-me');
      invalidateAllCache();
      expect(localStorage.getItem('pos-shop-cache-key1')).toBeNull();
      expect(localStorage.getItem('pos-shop-cache-key2')).toBeNull();
      expect(localStorage.getItem('other-storage')).toBe('keep-me');
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache', () => {
      setCache('test-key', 'value');
      expect(isCacheValid('test-key')).toBe(true);
    });

    it('should return false for missing cache', () => {
      expect(isCacheValid('non-existent')).toBe(false);
    });

    it('should return false for expired cache', () => {
      const entry = {
        data: 'stale',
        timestamp: Date.now() - 10000,
        expiry: Date.now() - 1000,
      };
      localStorage.setItem('pos-shop-cache-test-key', JSON.stringify(entry));
      expect(isCacheValid('test-key')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      localStorage.setItem('pos-shop-cache-test-key', 'not-json');
      expect(isCacheValid('test-key')).toBe(false);
    });
  });
});
