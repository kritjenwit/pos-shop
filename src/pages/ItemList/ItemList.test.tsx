import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemListPage from './ItemList';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [
        { id: '1', name: 'Test Item', price: 100, image: '', quantity: 10 }
      ], error: null })),
    })),
  },
  getSignedImageUrl: vi.fn(() => Promise.resolve(null)),
}));

describe('ItemListPage', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { vi.clearAllMocks(); });

  it('should render Items tab', async () => {
    render(<BrowserRouter><AuthProvider><AppProvider><ItemListPage /></AppProvider></AuthProvider></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Items/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render Management tab', async () => {
    render(<BrowserRouter><AuthProvider><AppProvider><ItemListPage /></AppProvider></AuthProvider></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Management/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render Checkout tab', async () => {
    render(<BrowserRouter><AuthProvider><AppProvider><ItemListPage /></AppProvider></AuthProvider></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Checkout/i })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});