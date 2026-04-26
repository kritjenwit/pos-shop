import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CheckoutPage from './Checkout';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe('CheckoutPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render empty basket message', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <CheckoutPage />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    );
    expect(screen.getByText('Your basket is empty')).toBeInTheDocument();
  });
});