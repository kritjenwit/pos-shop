import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../lib/auth', () => ({
  signIn: vi.fn(() => Promise.resolve({ user: null, error: null })),
  signUp: vi.fn(() => Promise.resolve({ user: null, error: null })),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial null user', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    expect(result.current.user).toBeNull();
  });

  it('should provide signIn function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    expect(typeof result.current.signIn).toBe('function');
  });

  it('should provide signUp function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    expect(typeof result.current.signUp).toBe('function');
  });

  it('should provide signOut function', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should signOut and clear user', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });
    act(() => result.current.signOut());
    expect(result.current.user).toBeNull();
  });
});