import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockUseAuth = vi.fn();

vi.mock('../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../shared/context/AppContext', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => children,
  useApp: vi.fn(() => ({ items: [], basket: new Map(), total: 0, loading: false })),
}));

vi.mock('../routes/ItemList/ItemList', () => ({
  default: () => <div>ItemListPage</div>,
}));

vi.mock('../routes/Transactions/TransactionList', () => ({
  default: () => <div>TransactionListPage</div>,
}));

vi.mock('../routes/Transactions/TransactionDetail', () => ({
  default: () => <div>TransactionDetailPage</div>,
}));

vi.mock('../customer/Transactions/CustomerTransactionDetail', () => ({
  default: () => <div>CustomerTransactionDetailPage</div>,
}));

vi.mock('../routes/Login/LoginPage', () => ({
  default: () => <div>LoginPage</div>,
}));

vi.mock('../routes/Profile/ProfilePage', () => ({
  default: () => <div>ProfilePage</div>,
}));

vi.mock('../customer/Menu/MenuPage', () => ({
  default: () => <div>MenuPage</div>,
}));

vi.mock('../customer/Checkout/CustomerCheckoutPage', () => ({
  default: () => <div>CustomerCheckoutPage</div>,
}));

vi.mock('../routes/PendingOrders/PendingOrdersPage', () => ({
  default: () => <div>PendingOrdersPage</div>,
}));

vi.mock('../routes/PendingOrders/PendingOrderDetail', () => ({
  default: () => <div>PendingOrderDetailPage</div>,
}));

vi.mock('../routes/Checkout/Checkout', () => ({
  default: () => <div>CheckoutPage</div>,
}));

vi.mock('../shared/constants', () => ({
  APP: { name: 'POS Shop' },
  COLORS: {
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    primary: '#111111',
    text: '#111111',
    textSecondary: '#666666',
    border: '#E5E5E5',
  },
}));

import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument();
    });
  });

  it('should render loading skeleton when loading', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    render(<App />);
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should render authenticated app with header', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('POS Shop')).toBeInTheDocument();
    });

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render navigation links when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });

    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
  });

  it('should allow public access to /menu without auth', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    window.history.pushState({}, '', '/menu');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('MenuPage')).toBeInTheDocument();
    });
  });

  it('should allow public access to /checkout without auth', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    window.history.pushState({}, '', '/checkout');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('CustomerCheckoutPage')).toBeInTheDocument();
    });
  });

  it('should show email when full_name is missing', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: null },
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});
