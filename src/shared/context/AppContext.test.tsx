import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide initial items', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    expect(result.current.items).toEqual([]);
  });

  it('should provide empty basket', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    expect(result.current.basket.size).toBe(0);
  });

  it('should provide zero total', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    expect(result.current.total).toBe(0);
  });

  it('should add item to basket', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    act(() => result.current.addToBasket('item-1'));
    expect(result.current.basket.get('item-1')).toBe(1);
  });

  it('should remove item when qty 1', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    act(() => { result.current.addToBasket('item-1'); });
    act(() => { result.current.removeFromBasket('item-1'); });
    expect(result.current.basket.has('item-1')).toBe(false);
  });

  it('should decrement when qty > 1', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    act(() => {
      result.current.addToBasket('item-1');
      result.current.addToBasket('item-1');
    });
    act(() => { result.current.removeFromBasket('item-1'); });
    expect(result.current.basket.get('item-1')).toBe(1);
  });

  it('should get basket quantity', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    act(() => {
      result.current.addToBasket('item-1');
      result.current.addToBasket('item-1');
    });
    expect(result.current.getBasketQuantity('item-1')).toBe(2);
  });

  it('should clear basket', () => {
    const { result } = renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
    act(() => { result.current.addToBasket('item-1'); });
    act(() => { result.current.clearBasket(); });
    expect(result.current.basket.size).toBe(0);
  });
});