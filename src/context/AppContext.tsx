import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, type Item } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  completeOrder: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BASKET_KEY = 'pos-shop-basket';

const fetchItems = async (setItems: React.Dispatch<React.SetStateAction<Item[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  const { data, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching items:', error);
  } else {
    setItems(data || []);
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
    fetchItems(setItems, setLoading);
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
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      console.error('Error deleting item:', error);
      throw error;
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

  const completeOrder = async () => {
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

    const { data, error } = await supabase
      .from('transactions')
      .insert({ total_amount: total, status: 'completed', created_by: user?.id })
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