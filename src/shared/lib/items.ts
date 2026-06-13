import { supabase, type Item } from './supabase';
import { deleteImage } from './images';

export interface TransactionItemInput {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export async function validateBasketPrices(
  basket: Map<string, number>,
): Promise<{ data: { items: TransactionItemInput[]; total: number } | null; error: string | null }> {
  const itemIds = Array.from(basket.keys());
  if (itemIds.length === 0) {
    return { data: null, error: 'Basket is empty' };
  }

  const { data: freshItems, error } = await supabase
    .from('items')
    .select('id, name, price')
    .in('id', itemIds);

  if (error) {
    return { data: null, error: error.message };
  }

  const priceMap = new Map((freshItems || []).map((i: Record<string, unknown>) => [i.id, { name: i.name as string, price: i.price as number }]));
  let total = 0;
  const items = Array.from(basket.entries()).map(([id, qty]) => {
    const item = priceMap.get(id);
    const unitPrice = item?.price || 0;
    const subtotal = unitPrice * qty;
    total += subtotal;
    return {
      item_id: id,
      item_name: item?.name || '',
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    };
  });

  return { data: { items, total }, error: null };
}

export async function getItems(): Promise<{ data: Item[] | null; error: string | null }> {
  const { data, error } = await supabase.from('items').select('*');
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data || [], error: null };
}

export async function addItem(item: Omit<Item, 'id'>): Promise<{ data: Item | null; error: string | null }> {
  const { data, error } = await supabase.from('items').insert(item).select();
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: (data && data[0]) || null, error: null };
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.from('items').update(updates).eq('id', id);
  if (error) {
    return { data: null, error: error.message };
  }
  return { data: null, error: null };
}

export async function deleteItem(id: string, imagePath?: string): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) {
    return { data: null, error: error.message };
  }
  if (imagePath) {
    await deleteImage(imagePath);
  }
  return { data: null, error: null };
}
