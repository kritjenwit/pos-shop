import { supabase, type User } from './supabase';
import bcrypt from 'bcryptjs';

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return { user: null, error: new Error('User not found') };
  }

  const validPassword = await bcrypt.compare(password, data.password);
  if (!validPassword) {
    return { user: null, error: new Error('Invalid password') };
  }

  return { user: data as User, error: null };
}

export async function signUp(email: string, password: string, fullName?: string): Promise<{ user: User | null; error: Error | null }> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      full_name: fullName || null,
    })
    .select()
    .single();

  if (error) {
    return { user: null, error: new Error(error.message) };
  }

  return { user: data as User, error: null };
}

export async function updateUserPhone(userId: string, phone: string | null): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('users')
    .update({ phone })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}