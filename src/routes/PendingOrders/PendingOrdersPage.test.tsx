import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingOrdersPage from './PendingOrdersPage';

const { mockOrder, mockFrom } = vi.hoisted(() => {
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockOrder, mockFrom };
});

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('PendingOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  const renderPage = () => {
    return render(<MemoryRouter><PendingOrdersPage /></MemoryRouter>);
  };

  it('should render loading skeleton initially', () => {
    mockOrder.mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('should render no pending orders message', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No pending orders')).toBeInTheDocument();
    });
  });

  it('should render order list when data is available', async () => {
    const orders = [
      {
        id: 'order-1',
        total_amount: 250,
        status: 'pending',
        created_at: '2026-05-23T10:00:00Z',
        order_id: 'ORD-001',
        customer_name: 'John',
        customer_phone: '0812345678',
        additional_detail: 'No onions',
        item_count: 3,
        user_email: 'staff@shop.com',
        user_full_name: 'Staff One',
      },
    ];

    mockOrder.mockResolvedValue({ data: orders, error: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Pending Orders (1)')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/250\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText(/No onions/)).toBeInTheDocument();
    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
  });

  it('should render order with customer info when no user info', async () => {
    const orders = [
      {
        id: 'order-1',
        total_amount: 100,
        status: 'pending',
        created_at: '2026-05-23T10:00:00Z',
        item_count: 1,
        customer_name: 'Walk-in Customer',
      },
    ];

    mockOrder.mockResolvedValue({ data: orders, error: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Walk-in Customer/)).toBeInTheDocument();
    });
  });
});
