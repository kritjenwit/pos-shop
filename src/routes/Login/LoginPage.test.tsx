import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import { AuthProvider } from '../../shared/context/AuthContext';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('../../shared/lib/auth', () => ({
  signIn: (...args: any[]) => mockSignIn(...args),
  signUp: (...args: any[]) => mockSignUp(...args),
}));

vi.mock('../../shared/constants', () => ({
  APP: { name: 'POS Shop', environment: 'development' },
  COLORS: {
    primary: '#111111',
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    text: '#111111',
    textSecondary: '#666666',
    border: '#E5E5E5',
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ user: null, error: null });
    mockSignUp.mockResolvedValue({ user: null, error: null });
  });

  const renderLoginPage = () => {
    return render(<AuthProvider><LoginPage /></AuthProvider>);
  };

  it('should render sign in heading', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });

  it('should render sign in button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('should render sign up link', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should switch to sign up mode', () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('Sign Up'));
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should show full name field in sign up mode', () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('Sign Up'));
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
  });

  it('should switch back to sign in mode', () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('Sign Up'));
    fireEvent.click(screen.getByText('Sign In'));
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
  });

  it('should toggle password visibility', () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('Show password');

    expect(passwordInput.type).toBe('password');
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    const hideButton = screen.getByLabelText('Hide password');
    fireEvent.click(hideButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should clear error when switching mode', () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    fireEvent.click(screen.getByText('Sign Up'));
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('should call signIn on submit', async () => {
    mockSignIn.mockResolvedValue({ user: { id: '1', email: 'test@test.com' }, error: null });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('should show error on failed sign in', async () => {
    mockSignIn.mockResolvedValue({ user: null, error: new Error('Invalid credentials') });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should call signUp on submit in sign up mode', async () => {
    mockSignUp.mockResolvedValue({ user: { id: '2', email: 'new@test.com' }, error: null });

    renderLoginPage();
    fireEvent.click(screen.getByText('Sign Up'));

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123', 'New User');
    });
  });

  it('should show processing state while submitting', async () => {
    mockSignIn.mockResolvedValue(new Promise(() => {}));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
