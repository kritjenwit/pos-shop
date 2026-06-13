import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AnalyticsPage from './AnalyticsPage';

const mockGetSalesSummary = vi.hoisted(() => vi.fn());
const mockGetDailySales = vi.hoisted(() => vi.fn());
const mockGetTopItems = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/analytics', () => ({
  getSalesSummary: mockGetSalesSummary,
  getDailySales: mockGetDailySales,
  getTopItems: mockGetTopItems,
}));

vi.mock('../../shared/constants', () => ({
  COLORS: {
    primary: 'var(--color-primary)',
    text: 'var(--color-text)',
    textSecondary: 'var(--color-text-secondary)',
    cardBackground: 'var(--color-card-background)',
    border: 'var(--color-border)',
    'primary-10': 'var(--color-primary-10)',
  },
}));

const mockSummary = {
  totalRevenue: 15000,
  totalOrders: 45,
  avgOrderValue: 333.33,
};

const mockDailySales = [
  { date: '2026-06-01', revenue: 3000, orders: 10 },
  { date: '2026-06-02', revenue: 5000, orders: 15 },
  { date: '2026-06-03', revenue: 2000, orders: 8 },
];

const mockTopItems = [
  { rank: 1, name: 'Coffee', qtySold: 30, revenue: 3000 },
  { rank: 2, name: 'Tea', qtySold: 20, revenue: 2000 },
  { rank: 3, name: 'Sandwich', qtySold: 15, revenue: 2250 },
];

const resolveAll = () => {
  mockGetSalesSummary.mockResolvedValue({ data: mockSummary, error: null });
  mockGetDailySales.mockResolvedValue({ data: mockDailySales, error: null });
  mockGetTopItems.mockResolvedValue({ data: mockTopItems, error: null });
};

const pendingPromise = () => new Promise(() => {});

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveAll();
  });

  it('shows loading skeletons initially', () => {
    mockGetSalesSummary.mockReturnValue(pendingPromise());
    mockGetDailySales.mockReturnValue(pendingPromise());
    mockGetTopItems.mockReturnValue(pendingPromise());

    const { container } = render(<AnalyticsPage />);

    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders summary cards with data', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('฿15,000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('฿333.33')).toBeInTheDocument();
  });

  it('renders daily sales bars', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('06-01')).toBeInTheDocument();
    });

    expect(screen.getByText('06-02')).toBeInTheDocument();
    expect(screen.getByText('06-03')).toBeInTheDocument();
    expect(screen.getByText('฿5,000.00')).toBeInTheDocument();
  });

  it('renders top items table', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
    });

    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Sandwich')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    const revenueCells = screen.getAllByText('฿3,000.00');
    expect(revenueCells.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when fetch fails', async () => {
    mockGetSalesSummary.mockResolvedValue({ data: null, error: 'Failed to load' });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('switches between day ranges when buttons clicked', async () => {
    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('฿15,000.00')).toBeInTheDocument();
    });

    vi.clearAllMocks();
    resolveAll();

    fireEvent.click(screen.getByText('7d'));

    await waitFor(() => {
      expect(mockGetSalesSummary).toHaveBeenCalledWith(7);
      expect(mockGetDailySales).toHaveBeenCalledWith(7);
      expect(mockGetTopItems).toHaveBeenCalledWith(7);
    });
  });
});
