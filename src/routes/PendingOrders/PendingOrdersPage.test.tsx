import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PendingOrdersPage from './PendingOrdersPage';

const mockGetOrders = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/orders', () => ({
  getOrders: mockGetOrders,
}));

describe('PendingOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrders.mockResolvedValue({ data: [], error: null });
  });

  const renderPage = () => {
    return render(<MemoryRouter><PendingOrdersPage /></MemoryRouter>);
  };

  it('should render loading skeleton initially', () => {
    mockGetOrders.mockResolvedValue(new Promise(() => {}));
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
        totalAmount: 250,
        status: 'pending',
        createdAt: '2026-05-23T10:00:00Z',
        orderId: 'ORD-001',
        customerName: 'John',
        customerPhone: '0812345678',
        additionalDetail: 'No onions',
        itemsCount: 3,
        sellerEmail: 'staff@shop.com',
        sellerName: 'Staff One',
        sellerId: 'user-1',
        receiptUrl: null,
      },
    ];

    mockGetOrders.mockResolvedValue({ data: orders, error: null });

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
        totalAmount: 100,
        status: 'pending',
        createdAt: '2026-05-23T10:00:00Z',
        orderId: null,
        itemsCount: 1,
        customerName: 'Walk-in Customer',
        customerPhone: null,
        additionalDetail: null,
        sellerName: null,
        sellerEmail: null,
        sellerId: 'user-1',
        receiptUrl: null,
      },
    ];

    mockGetOrders.mockResolvedValue({ data: orders, error: null });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Walk-in Customer/)).toBeInTheDocument();
    });
  });
});
