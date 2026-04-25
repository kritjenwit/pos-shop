import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Item } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  items: Item[];
  basket: Map<string, number>;
  total: number;
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string, item: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addToBasket: (id: string) => void;
  removeFromBasket: (id: string) => void;
  getBasketQuantity: (id: string) => number;
}

const defaultItems: Item[] = [
  { id: uuidv4(), name: 'Coffee', price: 50, image: '', quantity: 100 },
  { id: uuidv4(), name: 'Tea', price: 40, image: '', quantity: 100 },
  { id: uuidv4(), name: 'Milk', price: 60, image: '', quantity: 100 },
  { id: uuidv4(), name: 'Bread', price: 30, image: '', quantity: 100 },
  { id: uuidv4(), name: 'Cake', price: 80, image: '', quantity: 50 },
  { id: uuidv4(), name: 'Cookie', price: 25, image: '', quantity: 100 },
  { id: uuidv4(), name: 'Juice', price: 45, image: '', quantity: 80 },
  { id: uuidv4(), name: 'Water', price: 20, image: '', quantity: 100 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'pos-shop-items';
const BASKET_KEY = 'pos-shop-basket';

export function AppProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultItems;
      }
    }
    return defaultItems;
  });

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const basketObj = Object.fromEntries(basket);
    localStorage.setItem(BASKET_KEY, JSON.stringify(basketObj));
  }, [basket]);

  const total = Array.from(basket.entries()).reduce((sum, [id, qty]) => {
    const item = items.find((i) => i.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = { ...item, id: uuidv4() };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = (id: string) => {
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

  return (
    <AppContext.Provider
      value={{
        items,
        basket,
        total,
        addItem,
        updateItem,
        deleteItem,
        addToBasket,
        removeFromBasket,
        getBasketQuantity,
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