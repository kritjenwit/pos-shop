import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TransactionListPage from './TransactionList';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));

describe('TransactionListPage', () => {
  it('should render heading', () => {
    render(<BrowserRouter><TransactionListPage /></BrowserRouter>);
    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
  });
});