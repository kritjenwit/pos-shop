import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const mockSignIn = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() => vi.fn());

vi.mock('../lib/auth', () => ({
  signIn: mockSignIn,
  signUp: mockSignUp,
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderAuthHook = () => {
    return renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
  };

  it('should provide initial null user', () => {
    const { result } = renderAuthHook();
    expect(result.current.user).toBeNull();
  });

  it('should set loading to false after mount', async () => {
    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should load stored user from localStorage', () => {
    const storedUser = { id: 'user-1', email: 'test@example.com' };
    localStorage.setItem('pos-shop-user', JSON.stringify(storedUser));

    const { result } = renderAuthHook();
    expect(result.current.user).toEqual(storedUser);
  });

  it('should handle corrupted stored user', () => {
    localStorage.setItem('pos-shop-user', 'not-json');
    const { result } = renderAuthHook();
    expect(result.current.user).toBeNull();
  });

  it('should provide signIn function', () => {
    const { result } = renderAuthHook();
    expect(typeof result.current.signIn).toBe('function');
  });

  it('should provide signUp function', () => {
    const { result } = renderAuthHook();
    expect(typeof result.current.signUp).toBe('function');
  });

  it('should provide signOut function', () => {
    const { result } = renderAuthHook();
    expect(typeof result.current.signOut).toBe('function');
  });

  it('should sign out and clear user', async () => {
    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    act(() => result.current.signOut());
    expect(result.current.user).toBeNull();
  });

  it('should sign out and clear localStorage', async () => {
    localStorage.setItem('pos-shop-user', JSON.stringify({ id: 'user-1' }));
    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    act(() => result.current.signOut());
    expect(localStorage.getItem('pos-shop-user')).toBeNull();
  });

  it('should set user on successful sign in', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', full_name: 'Test' };
    mockSignIn.mockResolvedValue({ user: mockUser, error: null });

    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signInResult: { error: unknown } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'password');
    });

    expect(signInResult!.error).toBeNull();
    expect(result.current.user).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('pos-shop-user')!)).toEqual(mockUser);
  });

  it('should not set user on failed sign in', async () => {
    mockSignIn.mockResolvedValue({ user: null, error: new Error('Invalid credentials') });

    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signInResult: { error: unknown } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@example.com', 'wrong');
    });

    expect(signInResult!.error).toBeDefined();
    expect(result.current.user).toBeNull();
  });

  it('should set user on successful sign up', async () => {
    const mockUser = { id: 'user-2', email: 'new@example.com', full_name: 'New User' };
    mockSignUp.mockResolvedValue({ user: mockUser, error: null });

    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signUpResult: { error: unknown } | undefined;
    await act(async () => {
      signUpResult = await result.current.signUp('new@example.com', 'password', 'New User');
    });

    expect(signUpResult!.error).toBeNull();
    expect(result.current.user).toEqual(mockUser);
    expect(JSON.parse(localStorage.getItem('pos-shop-user')!)).toEqual(mockUser);
  });

  it('should not set user on failed sign up', async () => {
    mockSignUp.mockResolvedValue({ user: null, error: new Error('Email exists') });

    const { result } = renderAuthHook();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let signUpResult: { error: unknown } | undefined;
    await act(async () => {
      signUpResult = await result.current.signUp('existing@example.com', 'password');
    });

    expect(signUpResult!.error).toBeDefined();
    expect(result.current.user).toBeNull();
  });

  it('should throw error when useAuth is used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });
});
