import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ItemProvider, useItems } from './ItemContext';

const mockGetCache = vi.hoisted(() => vi.fn());
const mockSetCache = vi.hoisted(() => vi.fn());
const mockInvalidateCache = vi.hoisted(() => vi.fn());
const mockItemsGetItems = vi.hoisted(() => vi.fn());
const mockItemsDeleteItem = vi.hoisted(() => vi.fn());

vi.mock('../lib/cache', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  invalidateCache: mockInvalidateCache,
}));

vi.mock('../lib/items', () => ({
  getItems: mockItemsGetItems,
  addItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: mockItemsDeleteItem,
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

describe('ItemContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCache.mockReturnValue(null);
    mockItemsGetItems.mockResolvedValue({ data: [], error: null });
  });

  it('loads items on mount', async () => {
    mockItemsGetItems.mockResolvedValue({
      data: [{ id: '1', name: 'Coffee', price: 50, image: 'coffee.jpg', quantity: 10 }],
      error: null,
    });

    const { result } = renderHook(() => useItems(), { wrapper: ItemProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Coffee');
  });

  it('uses cached data when available', async () => {
    mockGetCache.mockReturnValue([{ id: '1', name: 'Coffee', price: 50, image: 'coffee.jpg', quantity: 10 } as never]);

    const { result } = renderHook(() => useItems(), { wrapper: ItemProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(mockItemsGetItems).not.toHaveBeenCalled();
  });

  it('sets error when fetch fails', async () => {
    mockItemsGetItems.mockResolvedValue({ data: null, error: 'Failed to load' });

    const { result } = renderHook(() => useItems(), { wrapper: ItemProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.itemsError).toBe('Failed to load');
  });

  it('deleteItem throws on error', async () => {
    mockItemsGetItems.mockResolvedValue({ data: [{ id: '1', name: 'Coffee', price: 50, image: 'coffee.jpg', quantity: 10 }], error: null });
    mockItemsDeleteItem.mockResolvedValue({ data: null, error: 'Delete failed' });

    const { result } = renderHook(() => useItems(), { wrapper: ItemProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.deleteItem('1')).rejects.toThrow('Delete failed');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useItems())).toThrow('useItems must be used within ItemProvider');
  });
});
