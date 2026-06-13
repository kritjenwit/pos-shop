import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

const mockUseAuth = vi.fn();
const mockToggleTheme = vi.fn();

vi.mock('../shared/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../shared/context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, toggle: mockToggleTheme }),
}));

vi.mock('../shared/context/AppContext', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../routes/ItemList/ItemList', () => ({
  default: () => <div>ItemListPage</div>,
}));

vi.mock('../customer/Menu/MenuPage', () => ({
  default: () => <div>MenuPage</div>,
}));

vi.mock('../routes/Checkout/Checkout', () => ({
  default: () => <div>CheckoutPage</div>,
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

vi.mock('../routes/Profile/ProfilePage', () => ({
  default: () => <div>ProfilePage</div>,
}));

vi.mock('../routes/PendingOrders/PendingOrdersPage', () => ({
  default: () => <div>PendingOrdersPage</div>,
}));

vi.mock('../routes/PendingOrders/PendingOrderDetail', () => ({
  default: () => <div>PendingOrderDetailPage</div>,
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

import StaffLayout from './StaffLayout';

describe('StaffLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app name in the header', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('POS Shop')).toBeInTheDocument();
  });

  it("renders the user's name from useAuth", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders navigation links (POS, Transactions, Pending Orders)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('POS')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Pending Orders')).toBeInTheDocument();
  });

  it('renders theme toggle button (shows Moon icon when not dark)', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('renders sign-out button', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls signOut when logout clicked', () => {
    const signOut = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Logout'));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('calls toggleTheme when theme button clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText('Switch to dark mode'));
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders skip-to-content link', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });

  it('main content area has tabIndex={-1} and id="main-content"', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    const main = container.querySelector('#main-content');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('returns null when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      signOut: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(container.innerHTML).toBe('');
  });

  it('activates POS nav link when clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <StaffLayout />
      </MemoryRouter>
    );

    const posLink = screen.getByText('POS');
    expect(posLink).toHaveStyle({ color: '#666666' });

    fireEvent.click(posLink);
    expect(posLink).toHaveStyle({ color: '#111111' });
  });

  it('activates Transactions nav link when clicked', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    const transactionsLink = screen.getByText('Transactions');
    expect(transactionsLink).toHaveStyle({ color: '#666666' });

    fireEvent.click(transactionsLink);
    expect(transactionsLink).toHaveStyle({ color: '#111111' });
  });

  it('activates Pending Orders nav link when clicked', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    const pendingOrdersLink = screen.getByText('Pending Orders');
    expect(pendingOrdersLink).toHaveStyle({ color: '#666666' });

    fireEvent.click(pendingOrdersLink);
    await waitFor(() => {
      expect(screen.getByText('Pending Orders')).toHaveStyle({ color: '#111111' });
    });
  });

  it('renders route content for the current path', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <StaffLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('ItemListPage')).toBeInTheDocument();
  });
});
