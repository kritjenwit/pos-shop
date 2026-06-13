import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
}));

const { getProfile, searchSellers } = await import('./profiles');

describe('getProfile', () => {
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const userData = {
    id: 'user-1',
    email: 'test@shop.com',
    full_name: 'Test Staff',
    phone: '0812345678',
    password: 'hashed',
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockEq.mockReturnValue({ single: mockSingle });
  });

  it('should fetch a user profile by ID', async () => {
    mockSingle.mockResolvedValue({ data: userData, error: null });

    const { data, error } = await getProfile('user-1');

    expect(error).toBeNull();
    expect(data).toEqual(userData);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, email, full_name, phone, created_at');
    expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
  });

  it('should return error on failure', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { data, error } = await getProfile('missing-id');

    expect(data).toBeNull();
    expect(error).toBe('Not found');
  });
});

describe('searchSellers', () => {
  const mockOr = vi.fn();
  const mockLimit = vi.fn();
  const mockSelect = vi.fn(() => ({ or: mockOr }));
  const sellers = [
    { id: 'u1', email: 'alice@shop.com', full_name: 'Alice' },
    { id: 'u2', email: 'bob@shop.com', full_name: 'Bob' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockOr.mockReturnValue({ limit: mockLimit });
  });

  it('should search sellers by query', async () => {
    mockLimit.mockResolvedValue({ data: sellers, error: null });

    const { data, error } = await searchSellers('ali');

    expect(error).toBeNull();
    expect(data).toEqual(sellers);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, email, full_name');
    expect(mockOr).toHaveBeenCalledWith('email.ilike.%ali%,full_name.ilike.%ali%');
    expect(mockLimit).toHaveBeenCalledWith(10);
  });

  it('should return empty array when no matches', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { data, error } = await searchSellers('zzz');

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('should return error on failure', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { data, error } = await searchSellers('fail');

    expect(data).toBeNull();
    expect(error).toBe('DB error');
  });
});
