import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomerCheckoutPage from './CustomerCheckoutPage';

const mockCreatePendingOrder = vi.fn();

const mockState = vi.hoisted(() => ({
  items: [
    { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
    { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
  ],
  basket: new Map([['item-1', 2], ['item-2', 1]]),
  total: 450,
}));

vi.mock('../../shared/context/AppContext', () => ({
  useApp: vi.fn(() => ({
    items: mockState.items,
    basket: mockState.basket,
    total: mockState.total,
    addToBasket: vi.fn(),
    removeFromBasket: vi.fn(),
    getBasketQuantity: vi.fn(() => 0),
    clearBasket: vi.fn(),
    createPendingOrder: mockCreatePendingOrder,
    loading: false,
    refreshItems: vi.fn(),
  })),
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to, className, ...props }: { children: React.ReactNode; to: string; className?: string }) => (
      <a href={to} className={className} {...props}>{children}</a>
    ),
  };
});

describe('CustomerCheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.items = [
      { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
      { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
    ];
    mockState.basket = new Map([['item-1', 2], ['item-2', 1]]);
    mockState.total = 450;
    mockCreatePendingOrder.mockResolvedValue({
      id: 'new-order-id',
      order_id: 'ORD-20260523-ABCD',
      total_amount: 450,
    });
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/checkout']}>
        <CustomerCheckoutPage />
      </MemoryRouter>
    );
  };

  it('should render checkout heading', () => {
    renderPage();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Complete your order details')).toBeInTheDocument();
  });

  it('should render basket items', () => {
    renderPage();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
  });

  it('should render total amount', () => {
    renderPage();
    const totals = screen.getAllByText(/450/);
    expect(totals.length).toBeGreaterThan(0);
  });

  it('should render Place Order button', () => {
    renderPage();
    expect(screen.getByText('Place Order')).toBeInTheDocument();
  });

  it('should show empty basket when total is 0', () => {
    mockState.total = 0;
    mockState.basket = new Map();
    renderPage();
    expect(screen.getByText('Your basket is empty')).toBeInTheDocument();
  });

  it('should not submit without customer name', () => {
    renderPage();
    const button = screen.getByText('Place Order');
    expect(button.closest('button')).toBeDisabled();
  });

  it('should create pending order on submit', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });

    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(mockCreatePendingOrder).toHaveBeenCalledWith('John Doe', undefined, undefined);
    });

    await waitFor(() => {
      expect(screen.getByText('Order Received!')).toBeInTheDocument();
    });
  });

  it('should show order complete screen with details', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });

    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(screen.getByText('Order Received!')).toBeInTheDocument();
    });

    expect(screen.getByText('ORD-20260523-ABCD')).toBeInTheDocument();
  });

  it('should show order complete with Start New Order button', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });

    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(screen.getByText('Start New Order')).toBeInTheDocument();
    });
  });

  it('should handle create pending order error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreatePendingOrder.mockRejectedValue(new Error('Network error'));

    renderPage();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });

    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error creating pending order:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should submit with phone and additional detail', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Full Name/), {
      target: { value: 'John Doe' },
    });

    fireEvent.change(screen.getAllByLabelText(/Phone Number/)[0], {
      target: { value: '0812345678' },
    });

    fireEvent.change(screen.getAllByLabelText(/Additional Detail/)[0], {
      target: { value: 'No onions' },
    });

    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() => {
      expect(mockCreatePendingOrder).toHaveBeenCalledWith('John Doe', '0812345678', 'No onions');
    });
  });
});
