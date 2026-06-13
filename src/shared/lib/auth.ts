import { supabase, type User } from './supabase';
import bcrypt from 'bcryptjs';
import { logEvent } from './audit';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getBackoff(email: string): number | null {
  const entry = rateLimitStore.get(email);
  if (!entry || Date.now() > entry.resetAt) {
    rateLimitStore.set(email, { count: 0, resetAt: Date.now() + 60000 });
    return null;
  }
  if (entry.count >= 5) {
    return Math.min(Math.pow(2, entry.count - 5) * 1000, 30000);
  }
  return null;
}

function recordAttempt(email: string) {
  const entry = rateLimitStore.get(email);
  if (entry && Date.now() <= entry.resetAt) {
    entry.count++;
  }
}

export async function signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const backoff = getBackoff(email);
  if (backoff !== null) {
    return { user: null, error: new Error(`Too many attempts. Try again in ${Math.ceil(backoff / 1000)} seconds.`) };
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, password, full_name, phone, created_at')
    .eq('email', email)
    .single();

  if (error || !data) {
    recordAttempt(email);
    return { user: null, error: new Error('Invalid email or password') };
  }

  const validPassword = await bcrypt.compare(password, data.password);
  if (!validPassword) {
    recordAttempt(email);
    return { user: null, error: new Error('Invalid email or password') };
  }

  rateLimitStore.delete(email);
  logEvent('sign_in', data.id).catch(() => {});
  return { user: data as User, error: null };
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return null;
}

export async function signUp(email: string, password: string, fullName?: string): Promise<{ user: User | null; error: Error | null }> {
  const validationError = validatePassword(password);
  if (validationError) {
    return { user: null, error: new Error(validationError) };
  }

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

  logEvent('sign_up', data.id, { email }).catch(() => {});
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