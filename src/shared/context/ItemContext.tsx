import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Item } from '../lib/supabase';
import { getCache, setCache, invalidateCache } from '../lib/cache';
import * as itemsService from '../lib/items';

interface ItemContextType {
  items: Item[];
  loading: boolean;
  itemsError: string;
  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

const CACHE_KEY = 'items';

const ItemContext = createContext<ItemContextType | undefined>(undefined);

export function ItemProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsError, setItemsError] = useState('');

  const fetchItems = async (useCache = true) => {
    if (useCache) {
      const cached = getCache<Item[]>(CACHE_KEY);
      if (cached) {
        setItems(cached);
        setLoading(false);
        setItemsError('');
        return;
      }
    }

    const { data, error } = await itemsService.getItems();
    if (error) {
      setItemsError(error);
    } else {
      setItems(data || []);
      setCache(CACHE_KEY, data || []);
      setItemsError('');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems(true);
  }, []);

  const addItem = async (item: Omit<Item, 'id'>) => {
    const { data, error } = await itemsService.addItem(item);
    if (error) {
      console.error('Error adding item:', error);
      throw new Error(error);
    }
    if (data) {
      setItems((prev) => [...prev, data]);
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    const { error } = await itemsService.updateItem(id, updates);
    if (error) {
      console.error('Error updating item:', error);
      throw new Error(error);
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem = async (id: string) => {
    const itemToDelete = items.find(item => item.id === id);

    const { error } = await itemsService.deleteItem(id, itemToDelete?.image);
    if (error) {
      console.error('Error deleting item:', error);
      throw new Error(error);
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const refreshItems = async () => {
    setLoading(true);
    invalidateCache(CACHE_KEY);
    await fetchItems(false);
  };

  return (
    <ItemContext.Provider value={{ items, loading, itemsError, addItem, updateItem, deleteItem, refreshItems }}>
      {children}
    </ItemContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error('useItems must be used within ItemProvider');
  }
  return context;
}
