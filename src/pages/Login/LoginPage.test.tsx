import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../lib/auth', () => ({
  signIn: vi.fn(() => Promise.resolve({ user: null, error: null })),
  signUp: vi.fn(() => Promise.resolve({ user: null, error: null })),
}));

describe('LoginPage', () => {
  it('should render sign in heading', () => {
    render(<AuthProvider><LoginPage /></AuthProvider>);
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should render sign in button', () => {
    render(<AuthProvider><LoginPage /></AuthProvider>);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should render sign up link', () => {
    render(<AuthProvider><LoginPage /></AuthProvider>);
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });
});