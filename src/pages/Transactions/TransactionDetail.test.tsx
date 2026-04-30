import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TransactionDetailPage from './TransactionDetail';

// Use vi.hoisted to create mock functions accessible in both factory and tests
const { mockSingle, mockFrom, mockGetSignedImageUrl } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockEq = vi.fn(() => ({ single: mockSingle, order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  const mockGetSignedImageUrl = vi.fn(() => Promise.resolve(null));
  return { mockSingle, mockOrder, mockEq, mockSelect, mockFrom, mockGetSignedImageUrl };
});

vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      from: mockFrom,
    },
    getSignedImageUrl: mockGetSignedImageUrl,
  };
});

describe('TransactionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    renderWithRouter();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should render transaction not found when no data', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    renderWithRouter();
    
    await waitFor(() => {
      expect(screen.getByText('Transaction not found')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
