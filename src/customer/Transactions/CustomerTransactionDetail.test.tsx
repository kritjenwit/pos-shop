import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CustomerTransactionDetailPage from './CustomerTransactionDetail';

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

describe('CustomerTransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockGetOrderDetail.mockResolvedValue({ data: null, error: null });
  });

  const renderWithRouter = (transactionId = 'test-tx-id') => {
    return render(
      <MemoryRouter initialEntries={[`/public/transactions/${transactionId}`]}>
        <Routes>
          <Route path="/public/transactions/:id" element={<CustomerTransactionDetailPage />} />
          <Route path="/public/transactions" element={<div>Public Transactions</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading skeleton initially', () => {
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should show error when order not found', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Order not found' });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Order not found')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should render transaction details when data is loaded', async () => {
    const tx = {
      id: 'public-tx-1',
      totalAmount: 250,
      status: 'completed',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: null,
      additionalDetail: null,
      receiptUrl: null,
      items: [{ id: 'ti-1', transaction_id: 'public-tx-1', item_id: 'prod-1', item_name: 'Coffee', quantity: 2, unit_price: 125, subtotal: 250 }],
      customerName: null,
      customerPhone: null,
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: tx, error: null });

    renderWithRouter('public-tx-1');

    expect(await screen.findByText('completed')).toBeInTheDocument();

    expect(screen.getByText('Coffee x 2')).toBeInTheDocument();
    expect(screen.getByText('Share Transaction')).toBeInTheDocument();
    expect(screen.getByText('Receipt not found')).toBeInTheDocument();
  });

  it('should toggle QR code visibility', async () => {
    const tx = {
      id: 'public-tx-2',
      totalAmount: 100,
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

    renderWithRouter('public-tx-2');

    expect(await screen.findByText('completed')).toBeInTheDocument();

    const shareButton = screen.getByLabelText('Show QR Code');
    fireEvent.click(shareButton);

    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText(/Scan to view/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Hide QR Code'));
    expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
  });

  it('should render receipt when receipt_url is present', async () => {
    const tx = {
      id: 'public-tx-3',
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

    renderWithRouter('public-tx-3');

    expect(await screen.findByAltText('Receipt')).toBeInTheDocument();

    expect(screen.queryByText('Receipt not found')).not.toBeInTheDocument();
  });
});
