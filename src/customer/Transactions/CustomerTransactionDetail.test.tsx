import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
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

  it('should navigate to public transactions when order not found', async () => {
    mockGetOrderDetail.mockResolvedValue({ data: null, error: 'Order not found' });

    renderWithRouter();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/public/transactions');
    });
  });
});
