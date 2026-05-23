import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '../shared/context/AuthContext';
import type { AuthContextType } from '../shared/context/AuthContext';

// Mock all the dependencies
vi.mock('../shared/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    signOut: vi.fn(),
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
  } as AuthContextType)),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../shared/context/AppContext', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => children,
  useApp: vi.fn(() => ({ items: [] })),
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

// Import App AFTER all mocks
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page when not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      signOut: vi.fn(),
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
    } as AuthContextType);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument();
    });
  });
});
