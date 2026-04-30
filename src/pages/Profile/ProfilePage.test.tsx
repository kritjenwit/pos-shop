import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '1', email: 'test@example.com', full_name: 'Test User', phone: '0812345678' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

vi.mock('../../lib/auth', () => ({
  updateUserPhone: vi.fn(() => Promise.resolve({ error: null })),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pos-shop-user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '0812345678',
    }));
  });

  it('should render Profile heading', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );
    expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('should render email field as disabled', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );
    const emailInput = await screen.findByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('should render full name field as disabled', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProfilePage />
        </AuthProvider>
      </BrowserRouter>
    );
    const nameInput = await screen.findByDisplayValue('Test User');
    expect(nameInput).toBeDisabled();
  });
});
