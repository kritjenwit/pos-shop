import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemListPage from './ItemList';
import { AppProvider } from '../../shared/context/AppContext';
import { AuthProvider } from '../../shared/context/AuthContext';

const mockGetSignedImageUrl = vi.fn(() => Promise.resolve(null));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [
        { id: '1', name: 'Pizza', price: 200, image: '', quantity: 10 },
        { id: '2', name: 'Cola', price: 50, image: '', quantity: 20 },
      ], error: null })),
    })),
  },
  getSignedImageUrl: mockGetSignedImageUrl,
}));

vi.mock('../../shared/context/AuthContext', async () => {
  const actual = await vi.importActual('../../shared/context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(() => ({
      user: { id: 'user-1', email: 'test@shop.com', full_name: 'Test User' },
      loading: false,
    })),
  };
});

vi.mock('../../shared/lib/cache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

function renderPage() {
  return render(<BrowserRouter><AuthProvider><AppProvider><ItemListPage /></AppProvider></AuthProvider></BrowserRouter>);
}

describe('ItemListPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockGetSignedImageUrl.mockResolvedValue(null);
  });

  it('should render Items tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Items' })).toBeInTheDocument();
    });
  });

  it('should render Management tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Management' })).toBeInTheDocument();
    });
  });

  it('should render Checkout tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Checkout' })).toBeInTheDocument();
    });
  });

  it('should render item name', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });
  });

  it('should render item price', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('฿200')).toBeInTheDocument();
    });
  });

  it('should render basket total in sticky bar', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('0 items')).toBeInTheDocument();
    });
  });

  it('should switch to management tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Management' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Management' }));
    await waitFor(() => {
      expect(screen.getByText('Item Management')).toBeInTheDocument();
    });
  });

  it('should switch to checkout tab', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Checkout' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Checkout' }));
    await waitFor(() => {
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });
  });

  it('should render add to basket buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/Add one Pizza to basket/)).toBeInTheDocument();
    });
  });
});