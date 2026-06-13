import { useContext, createContext, useMemo, useCallback, type ReactNode } from 'react';
import type { Item } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { BasketProvider, useBasket } from './BasketContext';
import { ItemProvider, useItems } from './ItemContext';
import { OrderProvider, useOrders } from './OrderContext';

interface AppContextType {
  items: Item[];
  basket: Map<string, number>;
  total: number;
  loading: boolean;
  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addToBasket: (id: string) => void;
  removeFromBasket: (id: string) => void;
  getBasketQuantity: (id: string) => number;
  clearBasket: () => void;
  completeOrder: (receiptFile?: File | null, status?: string, customerName?: string | null, customerPhone?: string | null, additionalDetail?: string | null) => Promise<{ id: string, total_amount: number } | void>;
  createPendingOrder: (customerName?: string, customerPhone?: string, additionalDetail?: string) => Promise<{ id: string, order_id: string, total_amount: number } | void>;
  approveOrder: (orderId: string) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
  refreshItems: () => Promise<void>;
  itemsError: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children, basketKey = 'pos-shop-basket' }: { children: ReactNode; basketKey?: string }) {
  return (
    <ItemProvider>
      <BasketProvider basketKey={basketKey}>
        <OrderProvider>
          <AppCombinedProvider>
            {children}
          </AppCombinedProvider>
        </OrderProvider>
      </BasketProvider>
    </ItemProvider>
  );
}

function AppCombinedProvider({ children }: { children: ReactNode }) {
  const { items, loading, itemsError, addItem, updateItem, deleteItem: itemsDeleteItem, refreshItems } = useItems();
  const { basket, addToBasket, removeFromBasket, getBasketQuantity, clearBasket, removeItemCompletely } = useBasket();
  const { completeOrder: ordersCompleteOrder, createPendingOrder: ordersCreatePendingOrder, approveOrder, confirmPayment } = useOrders();
  const { user } = useAuth();

  const total = useMemo(() =>
    Array.from(basket.entries()).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0),
    [items, basket],
  );

  const deleteItem = useCallback(async (id: string) => {
    await itemsDeleteItem(id);
    removeItemCompletely(id);
  }, [itemsDeleteItem, removeItemCompletely]);

  const completeOrder = useCallback(async (
    receiptFile?: File | null,
    status: string = 'completed',
    customerName?: string | null,
    customerPhone?: string | null,
    additionalDetail?: string | null,
  ) => {
    const result = await ordersCompleteOrder(basket, user?.id || '', {
      receiptFile: receiptFile || undefined,
      status,
      customerName,
      customerPhone,
      additionalDetail,
    });
    if (result) clearBasket();
    return result;
  }, [basket, user, ordersCompleteOrder, clearBasket]);

  const createPendingOrder = useCallback(async (
    customerName?: string,
    customerPhone?: string,
    additionalDetail?: string,
  ) => {
    const result = await ordersCreatePendingOrder(basket, {
      name: customerName,
      phone: customerPhone,
      detail: additionalDetail,
    });
    if (result) clearBasket();
    return result;
  }, [basket, ordersCreatePendingOrder, clearBasket]);

  return (
    <AppContext.Provider
      value={{
        items,
        basket,
        total,
        loading,
        itemsError,
        addItem,
        updateItem,
        deleteItem,
        addToBasket,
        removeFromBasket,
        getBasketQuantity,
        clearBasket,
        completeOrder,
        createPendingOrder,
        approveOrder,
        confirmPayment,
        refreshItems,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
