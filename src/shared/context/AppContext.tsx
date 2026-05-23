import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, type Item, deleteImage, uploadImage } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getCache, setCache, invalidateCache } from '../lib/cache';
import { generateOrderId } from '../lib/util';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BASKET_KEY = 'pos-shop-basket';

const CACHE_KEY = 'items';

const fetchItems = async (setItems: React.Dispatch<React.SetStateAction<Item[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, useCache = true) => {
  if (useCache) {
    const cached = getCache<Item[]>(CACHE_KEY);
    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }
  }

  const { data, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching items:', error);
  } else {
    setItems(data || []);
    setCache(CACHE_KEY, data || []);
  }
  setLoading(false);
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [basket, setBasket] = useState<Map<string, number>>(() => {
    const stored = localStorage.getItem(BASKET_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      } catch {
        return new Map();
      }
    }
    return new Map();
  });

  useEffect(() => {
    fetchItems(setItems, setLoading, true);
  }, []);

  useEffect(() => {
    const basketObj = Object.fromEntries(basket);
    localStorage.setItem(BASKET_KEY, JSON.stringify(basketObj));
  }, [basket]);

  const total = Array.from(basket.entries()).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const addItem = async (item: Omit<Item, 'id'>) => {
    const { data, error } = await supabase.from('items').insert(item).select();
    if (error) {
      console.error('Error adding item:', error);
      throw error;
    }
    if (data && data.length > 0) {
      setItems((prev) => [...prev, data[0]]);
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const { error } = await supabase.from('items').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating item:', error);
      throw error;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = async (id: string) => {
    // Get the item to delete to get its image URL
    const itemToDelete = items.find(item => item.id === id);

    // Delete item from database
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      console.error('Error deleting item:', error);
      throw error;
    }

    // Delete associated image from storage if it exists
    if (itemToDelete?.image) {
      await deleteImage(itemToDelete.image);
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setBasket((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const addToBasket = (id: string) => {
    setBasket((prev) => {
      const next = new Map(prev);
      const current = next.get(id) || 0;
      next.set(id, current + 1);
      return next;
    });
  };

  const removeFromBasket = (id: string) => {
    setBasket((prev) => {
      const next = new Map(prev);
      const current = next.get(id) || 0;
      if (current <= 1) {
        next.delete(id);
      } else {
        next.set(id, current - 1);
      }
      return next;
    });
  };

  const getBasketQuantity = (id: string) => basket.get(id) || 0;

  const clearBasket = () => {
    setBasket(new Map());
    localStorage.removeItem(BASKET_KEY);
  };

  const completeOrder = async (receiptFile?: File | null, status: string = 'completed', customerName?: string | null, customerPhone?: string | null, additionalDetail?: string | null) => {
    if (basket.size === 0) return;

    let receiptUrl = null;
    if (receiptFile) {
      receiptUrl = await uploadImage(receiptFile);
    }

    const transactionItems = Array.from(basket.entries()).map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return {
        transaction_id: '',
        item_id: id,
        item_name: item?.name || '',
        quantity: qty,
        unit_price: item?.price || 0,
        subtotal: (item?.price || 0) * qty,
      };
    });

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status,
        created_by: user?.id,
        receipt_url: receiptUrl,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        additional_detail: additionalDetail || null,
        order_id: generateOrderId()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }

    if (data) {
      const lineItems = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        console.error('Error creating transaction items:', itemsError);
        throw itemsError;
      }
    }

    clearBasket();
    return data;
  };

  const createPendingOrder = async (customerName?: string, customerPhone?: string, additionalDetail?: string) => {
    if (basket.size === 0) return;

    const transactionItems = Array.from(basket.entries()).map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return {
        transaction_id: '',
        item_id: id,
        item_name: item?.name || '',
        quantity: qty,
        unit_price: item?.price || 0,
        subtotal: (item?.price || 0) * qty,
      };
    });

    const total = Array.from(basket.entries()).reduce((sum, [id, qty]) => {
      const item = items.find((i) => i.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status: 'pending',
        created_by: user?.id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        additional_detail: additionalDetail || null,
        order_id: generateOrderId()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pending transaction:', error);
      throw error;
    }

    if (data) {
      const lineItems = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        console.error('Error creating pending transaction items:', itemsError);
        throw itemsError;
      }
    }

    clearBasket();
    return data;
  };

  const approveOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'approved' })
      .eq('id', orderId);

    if (error) {
      console.error('Error approving order:', error);
      throw error;
    }
  };

  const confirmPayment = async (orderId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', orderId);

    if (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  };

  const refreshItems = async () => {
    setLoading(true);
    invalidateCache(CACHE_KEY);
    await fetchItems(setItems, setLoading, false);
  };

  return (
    <AppContext.Provider
      value={{
        items,
        basket,
        total,
        loading,
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