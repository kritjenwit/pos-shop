import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { OrderProvider, useOrders } from './OrderContext';

const mockOrdersCreateOrder = vi.hoisted(() => vi.fn());
const mockOrdersCreatePendingOrder = vi.hoisted(() => vi.fn());
const mockOrdersApproveOrder = vi.hoisted(() => vi.fn());
const mockOrdersConfirmPayment = vi.hoisted(() => vi.fn());

vi.mock('../lib/orders', () => ({
  createOrder: mockOrdersCreateOrder,
  createPendingOrder: mockOrdersCreatePendingOrder,
  approveOrder: mockOrdersApproveOrder,
  confirmPayment: mockOrdersConfirmPayment,
}));

describe('OrderContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrdersCreateOrder.mockResolvedValue({ data: { id: 'tx-1', orderId: 'ORD-001', totalAmount: 400 }, error: null });
    mockOrdersCreatePendingOrder.mockResolvedValue({ data: { id: 'pending-1', orderId: 'ORD-PND', totalAmount: 200 }, error: null });
    mockOrdersApproveOrder.mockResolvedValue({ data: null, error: null });
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: null });
  });

  it('completeOrder returns order data on success', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    const basket = new Map([['item-1', 2]]);
    const order = await act(async () => result.current.completeOrder(basket, 'user-1'));

    expect(order).toEqual({ id: 'tx-1', total_amount: 400 });
  });

  it('completeOrder throws on error', async () => {
    mockOrdersCreateOrder.mockResolvedValue({ data: null, error: 'Create failed' });

    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    const basket = new Map([['item-1', 2]]);
    await expect(act(async () => result.current.completeOrder(basket, 'user-1'))).rejects.toThrow('Create failed');
  });

  it('completeOrder returns void when basket is empty', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    const resultVal = await act(async () => result.current.completeOrder(new Map(), 'user-1'));

    expect(resultVal).toBeUndefined();
    expect(mockOrdersCreateOrder).not.toHaveBeenCalled();
  });

  it('createPendingOrder returns order data on success', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    const basket = new Map([['item-1', 2]]);
    const order = await act(async () => result.current.createPendingOrder(basket, { name: 'John' }));

    expect(order).toEqual({ id: 'pending-1', order_id: 'ORD-PND', total_amount: 200 });
  });

  it('approveOrder calls approveOrder', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    await act(async () => result.current.approveOrder('order-1'));

    expect(mockOrdersApproveOrder).toHaveBeenCalledWith('order-1');
  });

  it('confirmPayment calls confirmPayment', async () => {
    const { result } = renderHook(() => useOrders(), { wrapper: OrderProvider });

    await act(async () => result.current.confirmPayment('order-1'));

    expect(mockOrdersConfirmPayment).toHaveBeenCalledWith('order-1');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useOrders())).toThrow('useOrders must be used within OrderProvider');
  });
});
