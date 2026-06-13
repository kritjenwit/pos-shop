import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TransactionListPage from './TransactionList';

const mockGetOrders = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/orders', () => ({
  getOrders: mockGetOrders,
}));

vi.mock('../../shared/lib/cache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

describe('TransactionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrders.mockResolvedValue({ data: [], error: null });
  });

  it('should render heading', () => {
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
  });

  it('should render loading skeleton initially', () => {
    mockGetOrders.mockResolvedValue(new Promise(() => {}));
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('should render no transactions message when empty', async () => {
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  it('should render transaction list when data is available', async () => {
    const transactions = [
      {
        id: 'tx-1',
        totalAmount: 350,
        status: 'completed',
        sellerId: 'user-1',
        createdAt: '2026-05-23T10:00:00Z',
        orderId: 'ORD-001',
        sellerEmail: 'user@example.com',
        sellerName: 'User One',
        receiptUrl: null,
        itemsCount: 2,
        customerName: null,
        customerPhone: null,
        additionalDetail: null,
      },
    ];

    mockGetOrders.mockResolvedValue({ data: transactions, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getAllByText(/350\.00/).length).toBeGreaterThan(0);
    });

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    expect(screen.getByText(/User One/)).toBeInTheDocument();
  });

  it('should handle error when fetching transactions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetOrders.mockResolvedValue({ data: null, error: 'Fetch error' });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should render with various status styles', async () => {
    const transactions = [
      { id: 'tx-1', totalAmount: 100, status: 'completed', sellerId: 'u1', createdAt: '2026-05-23T10:00:00Z', itemsCount: 1, orderId: null, customerName: null, customerPhone: null, additionalDetail: null, sellerName: null, sellerEmail: null, receiptUrl: null },
      { id: 'tx-2', totalAmount: 200, status: 'approved', sellerId: 'u2', createdAt: '2026-05-23T11:00:00Z', itemsCount: 2, orderId: null, customerName: null, customerPhone: null, additionalDetail: null, sellerName: null, sellerEmail: null, receiptUrl: null },
      { id: 'tx-3', totalAmount: 300, status: 'pending', sellerId: 'u3', createdAt: '2026-05-23T12:00:00Z', itemsCount: 1, orderId: null, customerName: null, customerPhone: null, additionalDetail: null, sellerName: null, sellerEmail: null, receiptUrl: null },
      { id: 'tx-4', totalAmount: 400, status: 'cancelled', sellerId: 'u4', createdAt: '2026-05-23T13:00:00Z', itemsCount: 1, orderId: null, customerName: null, customerPhone: null, additionalDetail: null, sellerName: null, sellerEmail: null, receiptUrl: null },
    ];

    mockGetOrders.mockResolvedValue({ data: transactions, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('cancelled')).toBeInTheDocument();
  });

  it('should render with additional_detail when present', async () => {
    const transactions = [
      {
        id: 'tx-1',
        totalAmount: 150,
        status: 'completed',
        sellerId: 'u1',
        createdAt: '2026-05-23T10:00:00Z',
        itemsCount: 1,
        additionalDetail: 'Gift wrap please',
        orderId: null,
        customerName: null,
        customerPhone: null,
        sellerName: null,
        sellerEmail: null,
        receiptUrl: null,
      },
    ];

    mockGetOrders.mockResolvedValue({ data: transactions, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Gift wrap please')).toBeInTheDocument();
    });
  });
});
