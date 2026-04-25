import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../lib/supabase';
import { signIn as authSignIn, signUp as authSignUp } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pos-shop-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, error } = await authSignIn(email, password);
    if (error) {
      return { error };
    }
    if (user) {
      setUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { user, error } = await authSignUp(email, password, fullName);
    if (error) {
      return { error };
    }
    if (user) {
      setUser(user);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    return { error: null };
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}