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

const mockGetOrderDetail = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/orders', () => ({
  getOrderDetail: mockGetOrderDetail,
}));

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockGetOrderDetail.mockResolvedValue({ data: null, error: null });
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
    mockGetOrderDetail.mockResolvedValue(new Promise(() => {}));
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should navigate to transactions list when order not found', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Order not found' });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  it('should navigate back when fetch error occurs', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Not found' });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/transactions');
    });
  });

  it('should render transaction details when data is loaded', async () => {
    const tx = {
      id: 'tx-1',
      totalAmount: 500,
      status: 'completed',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: 'ORD-001',
      additionalDetail: 'Extra spicy',
      receiptUrl: null,
      items: [
        { id: 'item-1', transaction_id: 'tx-1', item_id: 'prod-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 },
        { id: 'item-2', transaction_id: 'tx-1', item_id: 'prod-2', item_name: 'Cola', quantity: 1, unit_price: 100, subtotal: 100 },
      ],
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: tx, error: null });

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
      totalAmount: 300,
      status: 'completed',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: null,
      additionalDetail: null,
      receiptUrl: 'https://example.com/receipt.jpg',
      items: [],
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('tx-2');

    await waitFor(() => {
      expect(screen.getByAltText('Receipt')).toBeInTheDocument();
    });

    expect(screen.queryByText('Receipt not found')).not.toBeInTheDocument();
  });

  it('should not show additional_detail section when not present', async () => {
    const tx = {
      id: 'tx-3',
      totalAmount: 200,
      status: 'completed',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: null,
      additionalDetail: null,
      receiptUrl: null,
      items: [],
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('tx-3');

    await waitFor(() => {
      expect(screen.getByText(/200\.00/)).toBeInTheDocument();
    });

    expect(screen.queryByText('Additional Detail')).not.toBeInTheDocument();
  });

  it('should render for different status colors', async () => {
    const tx = {
      id: 'tx-4',
      totalAmount: 150,
      status: 'cancelled',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: null,
      additionalDetail: null,
      receiptUrl: null,
      items: [],
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('tx-4');

    await waitFor(() => {
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });
  });
});
