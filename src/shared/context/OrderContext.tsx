import { createContext, useContext, type ReactNode } from 'react';
import * as orders from '../lib/orders';

interface OrderContextType {
  completeOrder: (
    basket: Map<string, number>,
    userId: string,
    options?: {
      receiptFile?: File;
      status?: string;
      customerName?: string | null;
      customerPhone?: string | null;
      additionalDetail?: string | null;
    },
  ) => Promise<{ id: string; total_amount: number } | void>;
  createPendingOrder: (
    basket: Map<string, number>,
    options?: { name?: string; phone?: string; detail?: string },
  ) => Promise<{ id: string; order_id: string; total_amount: number } | void>;
  approveOrder: (orderId: string) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const completeOrder = async (
    basket: Map<string, number>,
    userId: string,
    options?: {
      receiptFile?: File;
      status?: string;
      customerName?: string | null;
      customerPhone?: string | null;
      additionalDetail?: string | null;
    },
  ) => {
    if (basket.size === 0) return;

    const { data, error } = await orders.createOrder(basket, userId, {
      receiptFile: options?.receiptFile || undefined,
      status: options?.status || 'completed',
      customerName: options?.customerName,
      customerPhone: options?.customerPhone,
      additionalDetail: options?.additionalDetail,
    });

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(error);
    }

    if (data) {
      return { id: data.id, total_amount: data.totalAmount };
    }
  };

  const createPendingOrder = async (
    basket: Map<string, number>,
    options?: { name?: string; phone?: string; detail?: string },
  ) => {
    if (basket.size === 0) return;

    const { data, error } = await orders.createPendingOrder(basket, {
      name: options?.name,
      phone: options?.phone,
      detail: options?.detail,
    });

    if (error) {
      console.error('Error creating pending transaction:', error);
      throw new Error(error);
    }

    if (data) {
      return { id: data.id, order_id: data.orderId, total_amount: data.totalAmount };
    }
  };

  const approveOrder = async (orderId: string) => {
    const { error } = await orders.approveOrder(orderId);

    if (error) {
      console.error('Error approving order:', error);
      throw new Error(error);
    }
  };

  const confirmPayment = async (orderId: string) => {
    const { error } = await orders.confirmPayment(orderId);

    if (error) {
      console.error('Error confirming payment:', error);
      throw new Error(error);
    }
  };

  return (
    <OrderContext.Provider value={{ completeOrder, createPendingOrder, approveOrder, confirmPayment }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}
