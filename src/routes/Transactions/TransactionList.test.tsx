import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TransactionListPage from './TransactionList';

const mockOrder = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockOr = vi.hoisted(() => vi.fn());
const mockLimit = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

mockOrder.mockResolvedValue({ data: [], error: null });
mockSelect.mockReturnValue({ order: mockOrder });
mockEq.mockReturnValue({ count: 0 });
mockLimit.mockResolvedValue({ data: [], error: null });
mockOr.mockReturnValue({ limit: mockLimit });

mockFrom.mockImplementation((table: string) => {
  if (table === 'transaction_items') {
    return { select: vi.fn(() => ({ eq: mockEq })) };
  }
  if (table === 'users') {
    return { select: vi.fn(() => ({ or: mockOr })) };
  }
  return { select: mockSelect };
});

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('../../shared/lib/cache', () => ({
  getCache: vi.fn(() => null),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

describe('TransactionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
    mockEq.mockReturnValue({ count: 0 });
  });

  it('should render heading', () => {
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
  });

  it('should render loading skeleton initially', () => {
    mockOrder.mockResolvedValue(new Promise(() => {}));
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
        total_amount: 350,
        status: 'completed',
        created_by: 'user-1',
        created_at: '2026-05-23T10:00:00Z',
        order_id: 'ORD-001',
        users: { email: 'user@example.com', full_name: 'User One' },
        receipt_url: null,
      },
    ];

    mockOrder.mockResolvedValue({ data: transactions, error: null });
    mockEq.mockReturnValue({ count: 2 });

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
    mockOrder.mockResolvedValue({ data: null, error: { message: 'Fetch error' } });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should render with various status styles', async () => {
    const transactions = [
      { id: 'tx-1', total_amount: 100, status: 'completed', created_by: 'u1', created_at: '2026-05-23T10:00:00Z', item_count: 1 },
      { id: 'tx-2', total_amount: 200, status: 'approved', created_by: 'u2', created_at: '2026-05-23T11:00:00Z', item_count: 2 },
      { id: 'tx-3', total_amount: 300, status: 'pending', created_by: 'u3', created_at: '2026-05-23T12:00:00Z', item_count: 1 },
      { id: 'tx-4', total_amount: 400, status: 'cancelled', created_by: 'u4', created_at: '2026-05-23T13:00:00Z', item_count: 1 },
    ];

    mockOrder.mockResolvedValue({ data: transactions, error: null });

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
        total_amount: 150,
        status: 'completed',
        created_by: 'u1',
        created_at: '2026-05-23T10:00:00Z',
        item_count: 1,
        additional_detail: 'Gift wrap please',
      },
    ];

    mockOrder.mockResolvedValue({ data: transactions, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Gift wrap please')).toBeInTheDocument();
    });
  });
});
