import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TransactionDetailPage from './TransactionDetail';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { mockSingle, mockItemsOrder, mockFrom, mockGetSignedImageUrl } = vi.hoisted(() => {
  const mockItemsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockItemsEq = vi.fn(() => ({ order: mockItemsOrder }));
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockTxEq = vi.fn(() => ({ single: mockSingle }));
  const mockTxSelect = vi.fn(() => ({ eq: mockTxEq }));
  const mockGetSignedImageUrl = vi.fn<(...args: unknown[]) => Promise<string | null>>();
  const mockFrom = vi.fn((table: string) => {
    if (table === 'transaction_items') {
      return { select: vi.fn(() => ({ eq: mockItemsEq })) };
    }
    return { select: mockTxSelect };
  });
  return { mockSingle, mockItemsOrder, mockFrom, mockGetSignedImageUrl };
});

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
  getSignedImageUrl: mockGetSignedImageUrl,
}));

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockItemsOrder.mockResolvedValue({ data: [], error: null });
  });

  const renderWithRouter = (transactionId = 'test-tx-id') => {
    return render(
      <MemoryRouter initialEntries={[`/transactions/${transactionId}`]}>
        <Routes>
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading skeleton initially', () => {
    mockSingle.mockResolvedValue(new Promise(() => {}));
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should render transaction not found when no data and no error', async () => {
    renderWithRouter();
    await waitFor(() => {
      expect(screen.getByText('Transaction not found')).toBeInTheDocument();
    });
  });

  it('should navigate back when fetch error occurs', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  it('should render transaction details when data is loaded', async () => {
    const tx = {
      id: 'tx-1',
      total_amount: 500,
      status: 'completed',
      created_by: 'user-1',
      created_at: '2026-05-23T10:00:00Z',
      order_id: 'ORD-001',
      additional_detail: 'Extra spicy',
    };

    const items = [
      { id: 'item-1', transaction_id: 'tx-1', item_id: 'prod-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 },
      { id: 'item-2', transaction_id: 'tx-1', item_id: 'prod-2', item_name: 'Cola', quantity: 1, unit_price: 100, subtotal: 100 },
    ];

    mockSingle.mockResolvedValue({ data: tx, error: null });
    mockItemsOrder.mockResolvedValue({ data: items, error: null });

    renderWithRouter('tx-1');

    await waitFor(() => {
      expect(screen.getByText(/500\.00/)).toBeInTheDocument();
    });

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText(/Pizza/)).toBeInTheDocument();
    expect(screen.getByText(/Cola/)).toBeInTheDocument();
    expect(screen.getByText('Extra spicy')).toBeInTheDocument();
    expect(screen.getByText('Back to Transactions')).toBeInTheDocument();
    expect(screen.getByText('Share Transaction')).toBeInTheDocument();
    expect(screen.getByText('Receipt not found')).toBeInTheDocument();
  });

  it('should render receipt when receipt_url is present', async () => {
    const tx = {
      id: 'tx-2',
      total_amount: 300,
      status: 'completed',
      created_by: 'user-1',
      created_at: '2026-05-23T10:00:00Z',
      receipt_url: 'receipts/abc.jpg',
    };

    mockSingle.mockResolvedValue({ data: tx, error: null });
    mockGetSignedImageUrl.mockResolvedValue('https://example.com/receipt.jpg');

    renderWithRouter('tx-2');

    await waitFor(() => {
      expect(screen.getByAltText('Receipt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Receipt not found')).not.toBeInTheDocument();
  });

  it('should not show additional_detail section when not present', async () => {
    const tx = {
      id: 'tx-3',
      total_amount: 200,
      status: 'completed',
      created_by: 'user-1',
      created_at: '2026-05-23T10:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('tx-3');

    await waitFor(() => {
      expect(screen.getByText(/200\.00/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Additional Detail')).not.toBeInTheDocument();
  });

  it('should render for different status colors', async () => {
    const tx = {
      id: 'tx-4',
      total_amount: 150,
      status: 'cancelled',
      created_by: 'user-1',
      created_at: '2026-05-23T10:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('tx-4');

    await waitFor(() => {
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });
});
