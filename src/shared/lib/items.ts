import { supabase, type Item, deleteImage } from './supabase';

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
