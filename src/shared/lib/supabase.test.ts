import { describe, it, expect } from 'vitest';

describe('supabase client', () => {
  it('should be defined', async () => {
    const { supabase } = await import('./supabase');
    expect(supabase).toBeDefined();
  });
});
