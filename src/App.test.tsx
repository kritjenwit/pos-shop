import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from './context/AuthContext';

// Mock all the dependencies  
vi.mock('./context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ 
    user: null, 
    signOut: vi.fn(), 
    loading: false 
  })),
  AuthProvider: ({ children }: any) => children,
}));

vi.mock('./context/AppContext', () => ({
  AppProvider: ({ children }: any) => children,
  useApp: vi.fn(() => ({ items: [] })),
}));

vi.mock('./pages/ItemList/ItemList', () => ({
  default: () => <div>ItemListPage</div>,
}));

vi.mock('./pages/Transactions/TransactionList', () => ({
  default: () => <div>TransactionListPage</div>,
}));

vi.mock('./pages/Transactions/TransactionDetail', () => ({
  default: () => <div>TransactionDetailPage</div>,
}));

vi.mock('./pages/Public/PublicTransactionDetail', () => ({
  default: () => <div>PublicTransactionDetailPage</div>,
}));

vi.mock('./pages/Login/LoginPage', () => ({
  default: () => <div>LoginPage</div>,
}));

vi.mock('./pages/Profile/ProfilePage', () => ({
  default: () => <div>ProfilePage</div>,
}));

vi.mock('./constants', () => ({
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
    } as any);

    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('LoginPage')).toBeInTheDocument();
    });
  });
});
