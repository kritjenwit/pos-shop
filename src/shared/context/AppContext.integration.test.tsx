import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './AppContext';

const mockGetCache = vi.hoisted(() => vi.fn(() => null));
const mockSetCache = vi.hoisted(() => vi.fn());
const mockInvalidateCache = vi.hoisted(() => vi.fn());

const mockOrdersCreateOrder = vi.hoisted(() => vi.fn());
const mockOrdersCreatePendingOrder = vi.hoisted(() => vi.fn());
const mockOrdersApproveOrder = vi.hoisted(() => vi.fn());
const mockOrdersConfirmPayment = vi.hoisted(() => vi.fn());
const mockOrdersGetOrders = vi.hoisted(() => vi.fn());

const mockItemsGetItems = vi.hoisted(() => vi.fn());

vi.mock('../lib/cache', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  invalidateCache: mockInvalidateCache,
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' } })),
}));

vi.mock('../lib/orders', () => ({
  createOrder: mockOrdersCreateOrder,
  createPendingOrder: mockOrdersCreatePendingOrder,
  approveOrder: mockOrdersApproveOrder,
  confirmPayment: mockOrdersConfirmPayment,
  getOrders: mockOrdersGetOrders,
}));

vi.mock('../lib/items', () => ({
  getItems: mockItemsGetItems,
}));

describe('AppContext integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockItemsGetItems.mockResolvedValue({ data: [], error: null });
    mockOrdersCreateOrder.mockResolvedValue({ data: { id: 'tx-1', orderId: 'ORD-001', totalAmount: 400 }, error: null });
    mockOrdersCreatePendingOrder.mockResolvedValue({ data: { id: 'pending-1', orderId: 'ORD-PND', totalAmount: 200 }, error: null });
    mockOrdersApproveOrder.mockResolvedValue({ data: null, error: null });
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: null });
    mockOrdersGetOrders.mockResolvedValue({ data: [], error: null });
  });

  const renderAppHook = () => {
    return renderHook(() => useApp(), {
      wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
    });
  };

  it('should complete full order lifecycle through context: pending → approve → confirm', async () => {
    mockItemsGetItems.mockResolvedValue({
      data: [
        { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
        { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
      ],
      error: null,
    });

    const { result } = renderAppHook();

    await act(async () => {
      await result.current.refreshItems();
    });

    expect(result.current.items).toHaveLength(2);

    act(() => result.current.addToBasket('item-1'));
    act(() => result.current.addToBasket('item-2'));
    act(() => result.current.addToBasket('item-1'));

    expect(result.current.basket.size).toBe(2);
    expect(result.current.getBasketQuantity('item-1')).toBe(2);
    expect(result.current.getBasketQuantity('item-2')).toBe(1);

    const computedTotal = result.current.total;
    expect(computedTotal).toBe(450);

    let pendingResult: { id: string; order_id: string; total_amount: number } | void = undefined;
    await act(async () => {
      pendingResult = await result.current.createPendingOrder('John', '0811111111', 'Extra cheese');
    });

    expect(pendingResult).toBeDefined();
    expect(pendingResult!.id).toBe('pending-1');
    expect(pendingResult!.total_amount).toBe(200);
    expect(mockOrdersCreatePendingOrder).toHaveBeenCalledTimes(1);
    expect(result.current.basket.size).toBe(0);

    await act(async () => {
      await result.current.approveOrder('pending-1');
    });

    expect(mockOrdersApproveOrder).toHaveBeenCalledWith('pending-1');
    expect(mockOrdersApproveOrder).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.confirmPayment('pending-1');
    });

    expect(mockOrdersConfirmPayment).toHaveBeenCalledWith('pending-1');
    expect(mockOrdersConfirmPayment).toHaveBeenCalledTimes(1);
  });

  it('should persist basket across context operations', async () => {
    const { result } = renderAppHook();

    act(() => result.current.addToBasket('item-1'));
    act(() => result.current.addToBasket('item-1'));
    act(() => result.current.addToBasket('item-2'));

    expect(result.current.basket.size).toBe(2);

    const storedAfterAdd = JSON.parse(localStorage.getItem('pos-shop-basket') || '{}');
    expect(storedAfterAdd['item-1']).toBe(2);
    expect(storedAfterAdd['item-2']).toBe(1);

    await act(async () => {
      await result.current.createPendingOrder('Jane', '0822222222');
    });

    const storedAfterOrder = JSON.parse(localStorage.getItem('pos-shop-basket') || '{}');
    expect(Object.keys(storedAfterOrder)).toHaveLength(0);
  });

  it('should reject approve when orders module returns error', async () => {
    mockOrdersApproveOrder.mockResolvedValue({ data: null, error: 'DB error' });

    const { result } = renderAppHook();

    await expect(
      act(async () => {
        await result.current.approveOrder('bad-order');
      })
    ).rejects.toThrow('DB error');
  });

  it('should reject confirm when orders module returns error', async () => {
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: 'Payment failed' });

    const { result } = renderAppHook();

    await expect(
      act(async () => {
        await result.current.confirmPayment('bad-order');
      })
    ).rejects.toThrow('Payment failed');
  });
});
