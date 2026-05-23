import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('import.meta', {
  env: {
    VITE_TEST_KEY: 'test-value',
  },
});

import { getEnv } from './util';

describe('getEnv', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return default value when key not found', () => {
    const result = getEnv('VITE_NON_EXISTENT', 'default');
    expect(result).toBe('default');
  });

  it('should return empty string as default when not specified', () => {
    const result = getEnv('VITE_NON_EXISTENT');
    expect(result).toBe('');
  });
});