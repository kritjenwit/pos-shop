import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TransactionDetailView from './TransactionDetailView';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGetOrderDetail = vi.hoisted(() => vi.fn());

vi.mock('../lib/orders', () => ({
  getOrderDetail: mockGetOrderDetail,
}));

const baseTx = {
  id: 'tx-1',
  totalAmount: 500,
  status: 'completed',
  createdAt: '2026-05-23T10:00:00Z',
  orderId: 'ORD-001',
  additionalDetail: null,
  receiptUrl: null,
  items: [{ id: 'ti-1', transaction_id: 'tx-1', item_id: 'prod-1', item_name: 'Coffee', quantity: 2, unit_price: 125, subtotal: 250 }],
  customerName: null,
  customerPhone: null,
  sellerName: null,
  sellerEmail: null,
  sellerPhone: null,
};

describe('TransactionDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockGetOrderDetail.mockResolvedValue({ data: null, error: null });
  });

  it('should render loading skeleton', () => {
    mockGetOrderDetail.mockResolvedValue(new Promise(() => {}));
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" />);
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should navigate to errorRedirectUrl on fetch error', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Not found' });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/error" />);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/error');
    });
  });

  it('should render transaction data', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: baseTx, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" />);

    expect(await screen.findByText(/500\.00/)).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Coffee x 2')).toBeInTheDocument();
  });

  it('should show back button when backUrl is provided', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: baseTx, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" backUrl="/custom-back" backLabel="Go Back" />);

    expect(await screen.findByText('Go Back')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Go Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/custom-back');
  });

  it('should show status colors from getStatusStyle when showStatusColors is true', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: { ...baseTx, status: 'pending' }, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" showStatusColors />);

    expect(await screen.findByText('pending')).toBeInTheDocument();
  });

  it('should show approved status color', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: { ...baseTx, status: 'approved' }, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" showStatusColors />);

    expect(await screen.findByText('approved')).toBeInTheDocument();
  });

  it('should show cancelled status color', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: { ...baseTx, status: 'cancelled' }, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" showStatusColors />);

    expect(await screen.findByText('cancelled')).toBeInTheDocument();
  });

  it('should show QR code and handle copy link', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });

    mockGetOrderDetail.mockResolvedValue({ data: baseTx, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/share" errorRedirectUrl="/" />);

    expect(await screen.findByText(/500\.00/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Show QR Code'));

    expect(await screen.findByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText(/Scan to view/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Copy Link'));
    expect(writeText).toHaveBeenCalledWith('https://example.com/share');
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
  });

  it('should render receipt when receiptUrl is present', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: { ...baseTx, receiptUrl: 'https://example.com/receipt.jpg' }, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" />);

    expect(await screen.findByAltText('Receipt')).toBeInTheDocument();
    expect(screen.queryByText('Receipt not found')).not.toBeInTheDocument();
  });

  it('should show receipt not found when no receiptUrl', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: baseTx, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" />);

    expect(await screen.findByText('Receipt not found')).toBeInTheDocument();
  });

  it('should show additional detail section when present', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: { ...baseTx, additionalDetail: 'Extra spicy please' }, error: null });
    render(<TransactionDetailView transactionId="tx-1" shareUrl="https://example.com/tx/1" errorRedirectUrl="/" />);

    expect(await screen.findByText('Additional Detail')).toBeInTheDocument();
    expect(screen.getByText('Extra spicy please')).toBeInTheDocument();
  });
});
