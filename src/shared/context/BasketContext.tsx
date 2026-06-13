import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface BasketContextType {
  basket: Map<string, number>;
  addToBasket: (id: string) => void;
  removeFromBasket: (id: string) => void;
  getBasketQuantity: (id: string) => number;
  clearBasket: () => void;
  removeItemCompletely: (id: string) => void;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children, basketKey = 'pos-shop-basket' }: { children: ReactNode; basketKey?: string }) {
  const [basket, setBasket] = useState<Map<string, number>>(() => {
    const stored = localStorage.getItem(basketKey);
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
    const basketObj = Object.fromEntries(basket);
    localStorage.setItem(basketKey, JSON.stringify(basketObj));
  }, [basket]);

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

  const removeItemCompletely = (id: string) => {
    setBasket((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const getBasketQuantity = (id: string) => basket.get(id) || 0;

  const clearBasket = () => {
    setBasket(new Map());
    localStorage.removeItem(basketKey);
  };

  return (
    <BasketContext.Provider value={{ basket, addToBasket, removeFromBasket, getBasketQuantity, clearBasket, removeItemCompletely }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (!context) {
    throw new Error('useBasket must be used within BasketProvider');
  }
  return context;
}
