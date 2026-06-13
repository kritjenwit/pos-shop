import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
}));

const { getSalesSummary, getDailySales, getTopItems } = await import('./analytics');

describe('getSalesSummary', () => {
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockEq.mockReturnValue({ gte: mockGte });
  });

  it('returns data from completed transactions', async () => {
    mockGte.mockResolvedValue({
      data: [
        { total_amount: 100 },
        { total_amount: 200 },
        { total_amount: 300 },
      ],
      error: null,
    });

    const { data, error } = await getSalesSummary(30);

    expect(error).toBeNull();
    expect(data).toEqual({ totalRevenue: 600, totalOrders: 3, avgOrderValue: 200 });
    expect(mockFrom).toHaveBeenCalledWith('transactions');
    expect(mockSelect).toHaveBeenCalledWith('total_amount');
    expect(mockEq).toHaveBeenCalledWith('status', 'completed');
  });

  it('returns error on failure', async () => {
    mockGte.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { data, error } = await getSalesSummary(30);

    expect(data).toBeNull();
    expect(error).toBe('DB error');
  });

  it('catches thrown errors', async () => {
    mockGte.mockRejectedValue(new Error('Network error'));

    const { data, error } = await getSalesSummary(30);

    expect(data).toBeNull();
    expect(error).toBe('Network error');
  });
});

describe('getDailySales', () => {
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ select: mockSelect });
    mockEq.mockReturnValue({ gte: mockGte });
  });

  it('aggregates by date', async () => {
    mockGte.mockResolvedValue({
      data: [
        { total_amount: 100, created_at: '2026-06-10T10:00:00Z' },
        { total_amount: 200, created_at: '2026-06-10T11:00:00Z' },
        { total_amount: 300, created_at: '2026-06-11T10:00:00Z' },
      ],
      error: null,
    });

    const { data, error } = await getDailySales(30);

    expect(error).toBeNull();
    expect(data).toEqual([
      { date: '2026-06-10', revenue: 300, orders: 2 },
      { date: '2026-06-11', revenue: 300, orders: 1 },
    ]);
  });

  it('returns empty array when no transactions', async () => {
    mockGte.mockResolvedValue({ data: [], error: null });

    const { data, error } = await getDailySales(30);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('catches thrown errors', async () => {
    mockGte.mockRejectedValue(new Error('Network error'));

    const { data, error } = await getDailySales(30);

    expect(data).toBeNull();
    expect(error).toBe('Network error');
  });
});

describe('getTopItems', () => {
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockIn = vi.fn();
  const mockTxSelect = vi.fn(() => ({ eq: mockEq }));
  const mockItemSelect = vi.fn(() => ({ in: mockIn }));

  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ gte: mockGte });
  });

  it('returns items sorted by revenue descending', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });
    mockFrom.mockReturnValueOnce({ select: mockItemSelect });

    mockGte.mockResolvedValue({
      data: [{ id: 'tx-1' }, { id: 'tx-2' }],
      error: null,
    });

    mockIn.mockResolvedValue({
      data: [
        { item_name: 'Coffee', quantity: 2, subtotal: 100 },
        { item_name: 'Tea', quantity: 1, subtotal: 50 },
        { item_name: 'Coffee', quantity: 1, subtotal: 50 },
      ],
      error: null,
    });

    const { data, error } = await getTopItems(30, 10);

    expect(error).toBeNull();
    expect(data).toEqual([
      { rank: 1, name: 'Coffee', qtySold: 3, revenue: 150 },
      { rank: 2, name: 'Tea', qtySold: 1, revenue: 50 },
    ]);
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'transactions');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'transaction_items');
  });

  it('returns error on failure', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });

    mockGte.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { data, error } = await getTopItems(30, 10);

    expect(data).toBeNull();
    expect(error).toBe('DB error');
  });

  it('catches thrown errors', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });

    mockGte.mockRejectedValue(new Error('Network error'));

    const { data, error } = await getTopItems(30, 10);

    expect(data).toBeNull();
    expect(error).toBe('Network error');
  });

  it('returns empty array when no completed transactions', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });

    mockGte.mockResolvedValue({ data: [], error: null });

    const { data, error } = await getTopItems(30, 10);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('returns error when transaction_items query fails', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });
    mockFrom.mockReturnValueOnce({ select: mockItemSelect });

    mockGte.mockResolvedValue({
      data: [{ id: 'tx-1' }],
      error: null,
    });

    mockIn.mockResolvedValue({ data: null, error: { message: 'Items fetch failed' } });

    const { data, error } = await getTopItems(30, 10);

    expect(data).toBeNull();
    expect(error).toBe('Items fetch failed');
  });

  it('returns all items when limit not specified', async () => {
    mockFrom.mockReturnValueOnce({ select: mockTxSelect });
    mockFrom.mockReturnValueOnce({ select: mockItemSelect });

    mockGte.mockResolvedValue({
      data: [{ id: 'tx-1' }, { id: 'tx-2' }],
      error: null,
    });

    mockIn.mockResolvedValue({
      data: [
        { item_name: 'Coffee', quantity: 1, subtotal: 50 },
        { item_name: 'Tea', quantity: 1, subtotal: 30 },
      ],
      error: null,
    });

    const { data, error } = await getTopItems(30);

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });
});
