import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuPage from './MenuPage';

const mockAddToBasket = vi.fn();
const mockRemoveFromBasket = vi.fn();
const mockGetBasketQuantity = vi.fn<(id: string) => number>();
const mockClearBasket = vi.fn();
const mockRefreshItems = vi.fn();

const mockState = vi.hoisted(() => {
  const mockItems = [
    { id: 'item-1', name: 'Pizza', price: 200, image: 'pizza.jpg', quantity: 10 },
    { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
    { id: 'item-3', name: 'Burger', price: 150, image: null, quantity: 5 },
  ];
  return {
    items: mockItems,
    basket: new Map<string, number>(),
    total: 0,
    loading: false,
    itemsError: '',
  };
});

vi.mock('../../shared/context/AppContext', () => ({
  useApp: vi.fn(() => ({
    items: mockState.items,
    basket: mockState.basket,
    total: mockState.total,
    loading: mockState.loading,
    itemsError: mockState.itemsError,
    addToBasket: mockAddToBasket,
    removeFromBasket: mockRemoveFromBasket,
    getBasketQuantity: mockGetBasketQuantity,
    clearBasket: mockClearBasket,
    refreshItems: mockRefreshItems,
    createPendingOrder: vi.fn(),
  })),
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../../shared/lib/images', () => ({
  getSignedImageUrl: vi.fn(() => Promise.resolve('https://placehold.co/150x150')),
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {},
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

describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.items = [
      { id: 'item-1', name: 'Pizza', price: 200, image: 'pizza.jpg', quantity: 10 },
      { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
      { id: 'item-3', name: 'Burger', price: 150, image: null, quantity: 5 },
    ];
    mockState.basket = new Map();
    mockState.total = 0;
    mockState.loading = false;
    mockState.itemsError = '';
    mockGetBasketQuantity.mockReturnValue(0);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/menu']}>
        <MenuPage />
      </MemoryRouter>
    );
  };

  it('should render heading', () => {
    renderPage();
    expect(screen.getByText('Our Menu')).toBeInTheDocument();
  });

  it('should render all items', () => {
    renderPage();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('should render loading skeleton', () => {
    mockState.loading = true;
    mockState.items = [];
    renderPage();
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('should filter items by search query', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'Pizza' } });

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.queryByText('Cola')).not.toBeInTheDocument();
    expect(screen.queryByText('Burger')).not.toBeInTheDocument();
  });

  it('should show no items found when search has no matches', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentItem' } });

    expect(screen.getByText(/We couldn't find anything matching/)).toBeInTheDocument();
  });

  it('should show clear search link when no results from search', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentItem' } });

    expect(screen.getByText('Clear search')).toBeInTheDocument();
  });

  it('should show basket bar when items in basket', () => {
    mockState.basket = new Map([['item-1', 1]]);
    mockState.total = 200;
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 1 : 0);

    renderPage();
    expect(screen.getByText('Your Basket')).toBeInTheDocument();
    expect(screen.getByText('1 Item')).toBeInTheDocument();
  });

  it('should make basket bar a link to /checkout', () => {
    mockState.basket = new Map([['item-1', 1]]);
    mockState.total = 200;
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 1 : 0);

    renderPage();
    const basketLink = screen.getByRole('link', { name: /Your Basket/i });
    expect(basketLink).toHaveAttribute('href', '/checkout');
  });

  it('should show basket bar with multiple items', () => {
    mockState.basket = new Map([['item-1', 2], ['item-2', 1]]);
    mockState.total = 450;
    mockGetBasketQuantity.mockImplementation((id: string) => (mockState.basket.get(id) || 0));

    renderPage();
    expect(screen.getByText('3 Items')).toBeInTheDocument();
  });

  it('should show Review Order button when items in basket', () => {
    mockState.basket = new Map([['item-1', 1]]);
    mockState.total = 200;
    mockGetBasketQuantity.mockReturnValue(1);

    renderPage();
    expect(screen.getByText('Review Order & Checkout')).toBeInTheDocument();
  });

  it('should call refreshItems on refresh click', () => {
    renderPage();
    const refreshButton = screen.getByTitle('Refresh items');
    fireEvent.click(refreshButton);
    expect(mockRefreshItems).toHaveBeenCalledWith();
  });

  it('should add item to basket', () => {
    mockGetBasketQuantity.mockReturnValue(0);
    renderPage();

    const addButtons = screen.getAllByLabelText('Add to cart');
    fireEvent.click(addButtons[0]);
    expect(mockAddToBasket).toHaveBeenCalledWith('item-1');
  });

  it('should show clear search button when typing', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'Pizza' } });

    const clearButton = document.querySelector('button.absolute.right-3');
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton!);
    expect(searchInput).toHaveValue('');
  });

  it('should show no items message when items array is empty', () => {
    mockState.items = [];
    mockState.loading = false;
    renderPage();
    expect(screen.getByText(/no items available/)).toBeInTheDocument();
  });

  it('should update basket display when basketQty > 0', () => {
    mockState.basket = new Map([['item-2', 2]]);
    mockState.total = 100;
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-2' ? 2 : 0);

    renderPage();

    expect(screen.getByText('Your Basket')).toBeInTheDocument();
    expect(screen.getByText('2 Items')).toBeInTheDocument();
    expect(screen.getByText(/Review Order/)).toBeInTheDocument();
  });

  it('should show badge count when item in basket', () => {
    mockState.basket = new Map([['item-1', 3]]);
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 3 : 0);

    renderPage();
    const threes = screen.getAllByText('3');
    expect(threes.length).toBeGreaterThan(0);
  });

  it('should handle image onLoad event', () => {
    const { container } = renderPage();
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(3);
    fireEvent.load(images[0]);
  });

  it('should call addToBasket via quick add overlay when basketQty is 0', () => {
    mockGetBasketQuantity.mockReturnValue(0);
    const { container } = renderPage();

    const overlayButtons = container.querySelectorAll('.absolute.inset-0 button');
    expect(overlayButtons.length).toBe(3);
    fireEvent.click(overlayButtons[0]);
    expect(mockAddToBasket).toHaveBeenCalledWith('item-1');
  });

  it('should call removeFromBasket when minus button clicked', () => {
    mockState.basket = new Map([['item-1', 2]]);
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 2 : 0);

    renderPage();
    fireEvent.click(screen.getByLabelText('Remove one Pizza from basket'));
    expect(mockRemoveFromBasket).toHaveBeenCalledWith('item-1');
  });

  it('should call addToBasket via quantity control plus when basketQty > 0', () => {
    mockState.basket = new Map([['item-1', 2]]);
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 2 : 0);

    renderPage();
    fireEvent.click(screen.getByLabelText('Add one Pizza to basket'));
    expect(mockAddToBasket).toHaveBeenCalledWith('item-1');
  });

  it('should clear search from empty state button and show all items again', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'xyz' } });

    expect(screen.getByText(/We couldn't find anything matching/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear search'));

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('should show basket controls instead of add-to-cart when item is in basket', () => {
    mockState.basket = new Map([['item-1', 1]]);
    mockGetBasketQuantity.mockImplementation((id: string) => id === 'item-1' ? 1 : 0);

    renderPage();

    expect(screen.getAllByLabelText('Add to cart').length).toBe(2);
    expect(screen.getByLabelText('Remove one Pizza from basket')).toBeInTheDocument();
    expect(screen.getByLabelText('Add one Pizza to basket')).toBeInTheDocument();
  });

  it('should show error state when itemsError is set', () => {
    mockState.items = [];
    mockState.itemsError = 'Failed to fetch';
    renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load items/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefreshItems).toHaveBeenCalled();
  });
});
