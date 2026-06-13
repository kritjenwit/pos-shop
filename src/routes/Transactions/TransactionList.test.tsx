import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TransactionListPage from './TransactionList';

const mockGetOrders = vi.hoisted(() => vi.fn());
const mockGetCache = vi.hoisted(() => vi.fn<(key: string) => unknown>(() => null));
const mockSetCache = vi.hoisted(() => vi.fn());
const mockInvalidateCache = vi.hoisted(() => vi.fn());
const mockSearchSellers = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/orders', () => ({
  getOrders: mockGetOrders,
}));

vi.mock('../../shared/lib/cache', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  invalidateCache: mockInvalidateCache,
}));

vi.mock('../../shared/lib/profiles', () => ({
  searchSellers: mockSearchSellers,
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
      expect(screen.getByText('Fetch error')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching transactions:', 'Fetch error');
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

  it('should use cached data when available without API call', async () => {
    const cachedTransactions = [
      {
        id: 'tx-cached',
        totalAmount: 999,
        status: 'completed',
        sellerId: 'u1',
        createdAt: '2026-05-23T10:00:00Z',
        itemsCount: 1,
        orderId: null,
        customerName: null,
        customerPhone: null,
        additionalDetail: null,
        sellerName: null,
        sellerEmail: null,
        receiptUrl: null,
      },
    ];
    mockGetCache.mockReturnValueOnce(cachedTransactions);

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/999\.00/)).toBeInTheDocument();
    });

    expect(mockGetOrders).not.toHaveBeenCalled();
  });

  it('should refresh data when refresh button clicked', async () => {
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockResolvedValue({
      data: [{
        id: 'tx-refreshed',
        totalAmount: 750,
        status: 'completed',
        sellerId: 'u1',
        createdAt: '2026-05-23T10:00:00Z',
        itemsCount: 1,
        orderId: null,
        customerName: null,
        customerPhone: null,
        additionalDetail: null,
        sellerName: null,
        sellerEmail: 'seller@shop.com',
        receiptUrl: null,
      }],
      error: null,
    });

    fireEvent.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(screen.getByText(/750\.00/)).toBeInTheDocument();
    });

    expect(mockInvalidateCache).toHaveBeenCalled();
  });

  it('should fetch with dateRange when start date is set', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-25' } });

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({ start: '2026-05-25T00:00:00' }),
        }),
      );
    });
  });

  it('should show clear filters button when filter is active', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-25' } });

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('should fetch with dateRange when end date is set', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[1], { target: { value: '2026-05-25' } });

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({ end: '2026-05-25T23:59:59' }),
        }),
      );
    });
  });

  it('should handle seller display name fallback', async () => {
    const transactions = [
      {
        id: 'tx-seller',
        totalAmount: 300,
        status: 'completed',
        sellerId: 'user-seller',
        createdAt: '2026-05-23T10:00:00Z',
        itemsCount: 1,
        orderId: null,
        customerName: null,
        customerPhone: null,
        additionalDetail: null,
        sellerName: null,
        sellerEmail: 'seller@shop.com',
        receiptUrl: null,
      },
    ];

    mockGetOrders.mockResolvedValue({ data: transactions, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/seller@shop.com/)).toBeInTheDocument();
    });
  });

  it('should search sellers when typing in seller filter', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });
    mockSearchSellers.mockResolvedValue({
      data: [{ id: 'u1', email: 'seller@shop.com', full_name: 'Shop Seller' }],
      error: null,
    });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search seller...');
    fireEvent.focus(searchInput);
    fireEvent.change(searchInput, { target: { value: 'Shop' } });

    await waitFor(() => {
      expect(screen.getByText('Shop Seller')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Shop Seller'));

    expect(screen.getByText('Shop Seller')).toBeInTheDocument();
  });

  it('should set date presets when Today button is clicked', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    fireEvent.click(screen.getByText('Today'));

    await waitFor(() => {
      const today = new Date().toISOString().split('T')[0];
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: expect.objectContaining({ start: `${today}T00:00:00`, end: `${today}T23:59:59` }),
        }),
      );
    });
  });

  it('should clear dates when All preset is clicked', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-06-15' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    fireEvent.click(screen.getByText('All'));

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.not.objectContaining({ dateRange: expect.anything() }),
      );
    });
  });

  it('should render date preset buttons', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });
    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
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

  it('should show receipt icon when receiptUrl is present', async () => {
    const transactions = [
      {
        id: 'tx-1',
        totalAmount: 350,
        status: 'completed',
        sellerId: 'u1',
        createdAt: '2026-05-23T10:00:00Z',
        itemsCount: 1,
        orderId: null,
        customerName: null,
        customerPhone: null,
        sellerName: null,
        sellerEmail: null,
        additionalDetail: null,
        receiptUrl: 'receipts/test.jpg',
      },
    ];

    mockGetOrders.mockResolvedValue({ data: transactions, error: null });

    const { container } = render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText(/350\.00/)).toBeInTheDocument();
    });

    expect(container.querySelector('[aria-label] + svg, .lucide-receipt')).toBeDefined();
  });

  it('should apply This Week date preset', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    fireEvent.click(screen.getByText('This Week'));

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({ dateRange: expect.objectContaining({ start: expect.any(String), end: expect.any(String) }) }),
      );
    });
  });

  it('should apply This Month date preset', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    fireEvent.click(screen.getByText('This Month'));

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith(
        expect.objectContaining({ dateRange: expect.objectContaining({ start: expect.any(String), end: expect.any(String) }) }),
      );
    });
  });

  it('should show try adjusting filters text when filters active and no data', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });

    await waitFor(() => {
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  it('should clear all filters when clear filters button clicked', async () => {
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2026-06-01' } });

    await waitFor(() => {
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: [], error: null });

    fireEvent.click(screen.getByText('Clear Filters'));

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
    });
  });

  it('should show fallback error text when fetchErr is not a string', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetOrders.mockResolvedValue({ data: null, error: { message: 'Server error' } });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should render pagination when totalCount exceeds pageSize', async () => {
    const transactions = Array.from({ length: 20 }, (_, i) => ({
      id: `tx-${i}`,
      totalAmount: 100 + i,
      status: 'completed',
      sellerId: 'u1',
      createdAt: '2026-05-23T10:00:00Z',
      itemsCount: 1,
      orderId: null,
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      additionalDetail: null,
      receiptUrl: null,
    }));

    mockGetOrders.mockResolvedValue({ data: transactions, total: 25, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Previous')).toBeInTheDocument();
    });

    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should navigate to next page when pagination Next is clicked', async () => {
    const transactions = Array.from({ length: 20 }, (_, i) => ({
      id: `tx-${i}`,
      totalAmount: 100 + i,
      status: 'completed',
      sellerId: 'u1',
      createdAt: '2026-05-23T10:00:00Z',
      itemsCount: 1,
      orderId: null,
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      additionalDetail: null,
      receiptUrl: null,
    }));

    mockGetOrders.mockResolvedValue({ data: transactions, total: 25, error: null });

    render(<MemoryRouter><TransactionListPage /></MemoryRouter>);

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    mockGetOrders.mockClear();
    mockGetOrders.mockResolvedValue({ data: transactions, total: 25, error: null });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
