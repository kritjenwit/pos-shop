import { describe, it, expect } from 'vitest';

import { getEnv, generateOrderId } from './util';

describe('getEnv', () => {
  it('should return default value when key not found', () => {
    const result = getEnv('VITE_NON_EXISTENT', 'default');
    expect(result).toBe('default');
  });

  it('should return empty string as default when not specified', () => {
    const result = getEnv('VITE_NON_EXISTENT');
    expect(result).toBe('');
  });
});

describe('generateOrderId', () => {
  it('should return a string starting with ORD-', () => {
    const id = generateOrderId();
    expect(id).toMatch(/^ORD-/);
  });

  it('should include date in YYYYMMDD format', () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const id = generateOrderId();
    expect(id).toContain(today);
  });

  it('should have format ORD-YYYYMMDD-XXXX', () => {
    const id = generateOrderId();
    expect(id).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
  });

  it('should generate unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()));
    expect(ids.size).toBe(100);
  });
});
