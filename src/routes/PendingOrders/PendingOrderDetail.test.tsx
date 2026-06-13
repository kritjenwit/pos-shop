import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PendingOrderDetailPage from './PendingOrderDetail';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGetOrderDetail = vi.hoisted(() => vi.fn());
const mockApproveOrder = vi.hoisted(() => vi.fn());
const mockCancelOrder = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/orders', () => ({
  getOrderDetail: mockGetOrderDetail,
  approveOrder: mockApproveOrder,
  cancelOrder: mockCancelOrder,
}));

describe('PendingOrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockGetOrderDetail.mockResolvedValue({ data: null, error: null });
    mockApproveOrder.mockResolvedValue({ data: null, error: null });
    mockCancelOrder.mockResolvedValue({ data: null, error: null });
  });

  const renderWithRouter = (orderId = 'test-order-id') => {
    return render(
      <MemoryRouter initialEntries={[`/pending-orders/${orderId}`]}>
        <Routes>
          <Route path="/pending-orders/:id" element={<PendingOrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render loading skeleton initially', () => {
    mockGetOrderDetail.mockResolvedValue(new Promise(() => {}));
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should navigate back when transaction fetch fails', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Not found' });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pending-orders');
    });
  });

  it('should navigate back when order is not pending', async () => {
    mockGetOrderDetail.mockResolvedValue({
      data: { id: 'order-1', status: 'completed', totalAmount: 100, items: [], createdAt: '2026-05-23T10:00:00Z', orderId: null, customerName: null, customerPhone: null, additionalDetail: null, receiptUrl: null, sellerName: null, sellerEmail: null, sellerPhone: null },
      error: null,
    });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pending-orders');
    });
  });

  it('should render order details for pending order', async () => {
    const order = {
      id: 'order-1',
      totalAmount: 500,
      status: 'pending',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: 'ORD-001',
      customerName: 'John',
      customerPhone: '0812345678',
      additionalDetail: 'Extra cheese',
      receiptUrl: null,
      items: [
        { id: 'item-1', transaction_id: 'order-1', item_id: 'prod-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 },
        { id: 'item-2', transaction_id: 'order-1', item_id: 'prod-2', item_name: 'Cola', quantity: 1, unit_price: 100, subtotal: 100 },
      ],
      sellerName: 'Staff One',
      sellerEmail: 'staff@shop.com',
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: order, error: null });

    renderWithRouter('order-1');

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument();
    });

    expect(screen.getByText(/Staff One/)).toBeInTheDocument();
    expect(screen.getByText('Customer: John')).toBeInTheDocument();
    expect(screen.getByText('Phone: 0812345678')).toBeInTheDocument();
    expect(screen.getByText(/Note: Extra cheese/)).toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('Approve & View QR')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render without order_id when not present', async () => {
    const order = {
      id: 'order-1',
      totalAmount: 300,
      status: 'pending',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: null,
      customerName: null,
      customerPhone: null,
      additionalDetail: null,
      receiptUrl: null,
      items: [],
      sellerName: null,
      sellerEmail: null,
      sellerPhone: null,
    };

    mockGetOrderDetail.mockResolvedValue({ data: order, error: null });

    renderWithRouter('order-1');

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument();
    });

    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument();
  });
});
