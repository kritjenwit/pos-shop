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

const { mockSingle, mockItemsOrder, mockFrom } = vi.hoisted(() => {
  const mockItemsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockItemsEq = vi.fn(() => ({ order: mockItemsOrder }));
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockTxEq = vi.fn(() => ({ single: mockSingle }));
  const mockTxSelect = vi.fn(() => ({ eq: mockTxEq }));
  const mockFrom = vi.fn((table: string) => {
    if (table === 'transaction_items') {
      return { select: vi.fn(() => ({ eq: mockItemsEq })) };
    }
    return { select: mockTxSelect };
  });
  return { mockSingle, mockItemsOrder, mockFrom };
});

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('PendingOrderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSingle.mockResolvedValue({ data: null, error: null });
    mockItemsOrder.mockResolvedValue({ data: [], error: null });
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
    mockSingle.mockResolvedValue(new Promise(() => {}));
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should navigate back when transaction fetch fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/pending-orders');
    });
  });

  it('should navigate back when order is not pending', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'order-1', status: 'completed', total_amount: 100 },
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
      total_amount: 500,
      status: 'pending',
      created_at: '2026-05-23T10:00:00Z',
      order_id: 'ORD-001',
      customer_name: 'John',
      customer_phone: '0812345678',
      additional_detail: 'Extra cheese',
      user_email: 'staff@shop.com',
      user_full_name: 'Staff One',
    };

    const items = [
      { id: 'item-1', transaction_id: 'order-1', item_id: 'prod-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 },
      { id: 'item-2', transaction_id: 'order-1', item_id: 'prod-2', item_name: 'Cola', quantity: 1, unit_price: 100, subtotal: 100 },
    ];

    mockSingle.mockResolvedValue({ data: order, error: null });
    mockItemsOrder.mockResolvedValue({ data: items, error: null });

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
      total_amount: 300,
      status: 'pending',
      created_at: '2026-05-23T10:00:00Z',
    };

    mockSingle.mockResolvedValue({ data: order, error: null });
    mockItemsOrder.mockResolvedValue({ data: [], error: null });

    renderWithRouter('order-1');

    await waitFor(() => {
      expect(screen.getByText('Order Details')).toBeInTheDocument();
    });

    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument();
  });
});
