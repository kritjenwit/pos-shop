import { supabase, type User } from './supabase';

export interface SellerOption {
  id: string;
  email: string;
  full_name: string | null;
}

export async function getProfile(userId: string): Promise<{ data: User | null; error: string | null }> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password, full_name, phone, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as User, error: null };
}

export async function searchSellers(query: string): Promise<{ data: SellerOption[] | null; error: string | null }> {
  const escaped = query.replace(/[%_]/g, '\\$&');
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name')
    .or(`email.ilike.%${escaped}%,full_name.ilike.%${escaped}%`)
    .limit(10);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as SellerOption[], error: null };
}
