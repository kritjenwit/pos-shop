import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

const { mockFrom, mockSelect, mockUpdate, mockDelete, mockEq, mockSingle, mockOrder } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();

  const mockEqImpl = vi.fn(() => ({
    single: mockSingle,
    order: mockOrder,
  }));

  mockEq.mockImplementation(mockEqImpl);
  mockSelect.mockImplementation(() => ({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  }));
  mockInsert.mockImplementation(() => ({
    select: mockSelect,
  }));
  mockUpdate.mockImplementation(() => ({
    eq: mockEq,
  }));
  mockDelete.mockImplementation(() => ({
    eq: mockEq,
  }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }));

  return { mockFrom, mockSelect, mockUpdate, mockDelete, mockEq, mockSingle, mockOrder };
});

const mockOrdersCreateOrder = vi.hoisted(() => vi.fn());
const mockOrdersCreatePendingOrder = vi.hoisted(() => vi.fn());
const mockOrdersApproveOrder = vi.hoisted(() => vi.fn());
const mockOrdersConfirmPayment = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('../lib/images', () => ({
  deleteImage: vi.fn(() => Promise.resolve()),
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

vi.mock('../lib/cache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('../lib/orders', () => ({
  createOrder: mockOrdersCreateOrder,
  createPendingOrder: mockOrdersCreatePendingOrder,
  approveOrder: mockOrdersApproveOrder,
  confirmPayment: mockOrdersConfirmPayment,
}));

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockResolvedValue({ error: null });
    mockOrdersCreateOrder.mockResolvedValue({ data: { id: 'tx-1', orderId: 'ORD-001', totalAmount: 400 }, error: null });
    mockOrdersCreatePendingOrder.mockResolvedValue({ data: { id: 'pending-1', orderId: 'ORD-PENDING', totalAmount: 200 }, error: null });
    mockOrdersApproveOrder.mockResolvedValue({ data: null, error: null });
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: null });
  });

  const renderAppHook = () => {
    return renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
  };

  it('should provide initial items', () => {
    const { result } = renderAppHook();
    expect(result.current.items).toEqual([]);
  });

  it('should provide empty basket', () => {
    const { result } = renderAppHook();
    expect(result.current.basket.size).toBe(0);
  });

  it('should provide zero total', () => {
    const { result } = renderAppHook();
    expect(result.current.total).toBe(0);
  });

  it('should add item to basket', () => {
    const { result } = renderAppHook();
    act(() => result.current.addToBasket('item-1'));
    expect(result.current.basket.get('item-1')).toBe(1);
  });

  it('should increment existing item in basket', () => {
    const { result } = renderAppHook();
    act(() => { result.current.addToBasket('item-1'); });
    act(() => { result.current.addToBasket('item-1'); });
    expect(result.current.basket.get('item-1')).toBe(2);
  });

  it('should remove item when qty 1', () => {
    const { result } = renderAppHook();
    act(() => { result.current.addToBasket('item-1'); });
    act(() => { result.current.removeFromBasket('item-1'); });
    expect(result.current.basket.has('item-1')).toBe(false);
  });

  it('should decrement when qty > 1', () => {
    const { result } = renderAppHook();
    act(() => {
      result.current.addToBasket('item-1');
      result.current.addToBasket('item-1');
    });
    act(() => { result.current.removeFromBasket('item-1'); });
    expect(result.current.basket.get('item-1')).toBe(1);
  });

  it('should get basket quantity', () => {
    const { result } = renderAppHook();
    act(() => {
      result.current.addToBasket('item-1');
      result.current.addToBasket('item-1');
    });
    expect(result.current.getBasketQuantity('item-1')).toBe(2);
  });

  it('should return 0 for unknown item quantity', () => {
    const { result } = renderAppHook();
    expect(result.current.getBasketQuantity('non-existent')).toBe(0);
  });

  it('should clear basket', () => {
    const { result } = renderAppHook();
    act(() => { result.current.addToBasket('item-1'); });
    act(() => { result.current.clearBasket(); });
    expect(result.current.basket.size).toBe(0);
  });

  it('should persist basket to localStorage', () => {
    const { result } = renderAppHook();
    act(() => { result.current.addToBasket('item-1'); });
    const stored = JSON.parse(localStorage.getItem('pos-shop-basket') || '{}');
    expect(stored['item-1']).toBe(1);
  });

  it('should restore basket from localStorage', () => {
    localStorage.setItem('pos-shop-basket', JSON.stringify({ 'item-1': 3 }));
    const { result } = renderAppHook();
    expect(result.current.basket.get('item-1')).toBe(3);
  });

  it('should handle corrupted basket in localStorage', () => {
    localStorage.setItem('pos-shop-basket', 'not-json');
    const { result } = renderAppHook();
    expect(result.current.basket.size).toBe(0);
  });

  it('should add item via API', async () => {
    mockSelect.mockResolvedValue({ data: [{ id: 'new-item-1', name: 'NewItem', price: 100, image: '', quantity: 5 }], error: null });

    const { result } = renderAppHook();
    await act(async () => {
      await result.current.addItem({ name: 'NewItem', price: 100, image: '', quantity: 5 });
    });
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.items[0].name).toBe('NewItem');
  });

  it('should throw on add item API error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { result } = renderAppHook();
    await expect(
      act(async () => {
        await result.current.addItem({ name: 'FailItem', price: 100, image: '', quantity: 1 });
      })
    ).rejects.toThrow();
  });

  it('should update item', async () => {
    const { result } = renderAppHook();
    await act(async () => {
      await result.current.updateItem('item-1', { name: 'Updated' });
    });
    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Updated' });
  });

  it('should throw on update item API error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Update error' } });

    const { result } = renderAppHook();
    await expect(
      act(async () => {
        await result.current.updateItem('item-1', { name: 'Fail' });
      })
    ).rejects.toThrow();
  });

  it('should delete item', async () => {
    const { result } = renderAppHook();
    await act(async () => {
      await result.current.deleteItem('item-1');
    });
    expect(mockDelete).toHaveBeenCalled();
  });

  it('should approve order via orders module', async () => {
    const { result } = renderAppHook();
    await act(async () => {
      await result.current.approveOrder('order-1');
    });
    expect(mockOrdersApproveOrder).toHaveBeenCalledWith('order-1');
  });

  it('should throw on approve order error', async () => {
    mockOrdersApproveOrder.mockResolvedValue({ data: null, error: 'Approve error' });

    const { result } = renderAppHook();
    await expect(
      act(async () => {
        await result.current.approveOrder('order-1');
      })
    ).rejects.toThrow();
  });

  it('should confirm payment via orders module', async () => {
    const { result } = renderAppHook();
    await act(async () => {
      await result.current.confirmPayment('order-1');
    });
    expect(mockOrdersConfirmPayment).toHaveBeenCalledWith('order-1');
  });

  it('should throw on confirm payment error', async () => {
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: 'Confirm error' });

    const { result } = renderAppHook();
    await expect(
      act(async () => {
        await result.current.confirmPayment('order-1');
      })
    ).rejects.toThrow();
  });

  it('should refresh items', async () => {
    const { result } = renderAppHook();
    await act(async () => {
      await result.current.refreshItems();
    });
    expect(mockSelect).toHaveBeenCalled();
  });

  it('should throw error when useApp is used outside provider', () => {
    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within AppProvider');
  });

  it('should return undefined when completing order with empty basket', async () => {
    const { result } = renderAppHook();
    const data = await act(async () => {
      return await result.current.completeOrder();
    });
    expect(data).toBeUndefined();
  });

  it('should complete order via orders module', async () => {
    const { result } = renderAppHook();

    act(() => result.current.addToBasket('item-1'));
    act(() => result.current.addToBasket('item-1'));

    await act(async () => {
      const data = await result.current.completeOrder(null);
      expect(data).toBeDefined();
    });

    expect(mockOrdersCreateOrder).toHaveBeenCalled();
    expect(result.current.basket.size).toBe(0);
  });

  it('should clear basket after completing order', async () => {
    const { result } = renderAppHook();

    act(() => result.current.addToBasket('item-1'));

    await act(async () => {
      await result.current.completeOrder(null);
    });

    expect(result.current.basket.size).toBe(0);
  });

  it('should complete order with receipt file', async () => {
    const receiptFile = new File([''], 'receipt.jpg', { type: 'image/jpeg' });

    const { result } = renderAppHook();

    act(() => result.current.addToBasket('item-1'));

    await act(async () => {
      const data = await result.current.completeOrder(receiptFile);
      expect(data).toBeDefined();
    });

    expect(mockOrdersCreateOrder).toHaveBeenCalled();
    expect(mockOrdersCreateOrder.mock.calls[0][3].receiptFile).toBe(receiptFile);
  });

  it('should create pending order via orders module', async () => {
    const { result } = renderAppHook();

    act(() => result.current.addToBasket('item-2'));

    await act(async () => {
      const data = await result.current.createPendingOrder('Test User', '0811111111', 'Notes');
      expect(data).toBeDefined();
    });

    expect(mockOrdersCreatePendingOrder).toHaveBeenCalled();
    expect(result.current.basket.size).toBe(0);
  });

  it('should return undefined for createPendingOrder with empty basket', async () => {
    const { result } = renderAppHook();
    const data = await act(async () => {
      return await result.current.createPendingOrder();
    });
    expect(data).toBeUndefined();
  });

  it('should throw on createPendingOrder error', async () => {
    mockOrdersCreatePendingOrder.mockResolvedValue({ data: null, error: 'Create error' });

    const { result } = renderAppHook();
    act(() => result.current.addToBasket('item-1'));

    await expect(
      act(async () => {
        await result.current.createPendingOrder('Test', '0811111111');
      })
    ).rejects.toThrow();
  });
});
