import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemManagementPage from './ItemManagement';

const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockUploadImage = vi.fn();
const mockDeleteImage = vi.fn();
const mockGetSignedImageUrl = vi.fn();

const mockItems = [
  { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
  { id: 'item-2', name: 'Burger', price: 150, image: 'burger.jpg', quantity: 5 },
];

const mockUseAppState = vi.hoisted(() => vi.fn());

vi.mock('../../shared/context/AppContext', () => ({
  useApp: mockUseAppState,
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {},
  uploadImage: (...args: any[]) => mockUploadImage(...args),
  deleteImage: (...args: any[]) => mockDeleteImage(...args),
  getSignedImageUrl: (...args: any[]) => mockGetSignedImageUrl(...args),
}));

vi.mock('../../shared/constants', () => ({
  COLORS: {
    primary: '#111111',
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    text: '#111111',
    textSecondary: '#666666',
    border: '#E5E5E5',
    danger: '#EF4444',
    accent: '#333333',
    borderInput: '#D4D4D4',
  },
  UI: { stickyTop: '100px', borderRadius: '8px' },
  PAYMENT: { qrSize: 200, qrLevel: 'H' },
}));

vi.mock('../../shared/components/MenuQRCode', () => ({
  default: () => <div data-testid="menu-qr">Menu QR</div>,
}));

describe('ItemManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddItem.mockResolvedValue(undefined);
    mockUpdateItem.mockResolvedValue(undefined);
    mockDeleteItem.mockResolvedValue(undefined);
    mockUploadImage.mockResolvedValue('uploaded-path');
    mockDeleteImage.mockResolvedValue(undefined);
    mockGetSignedImageUrl.mockResolvedValue('https://example.com/img.jpg');
    mockUseAppState.mockReturnValue({
      items: mockItems,
      addToBasket: vi.fn(),
      removeFromBasket: vi.fn(),
      getBasketQuantity: vi.fn(() => 0),
      clearBasket: vi.fn(),
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      loading: false,
      refreshItems: vi.fn(),
      total: 0,
      basket: new Map(),
    });
  });

  it('should render heading', () => {
    render(<ItemManagementPage />);
    expect(screen.getByText('Item Management')).toBeInTheDocument();
  });

  it('should render item list', () => {
    render(<ItemManagementPage />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('should render QR code section', () => {
    render(<ItemManagementPage />);
    expect(screen.getByTestId('menu-qr')).toBeInTheDocument();
  });

  it('should render add new button', () => {
    render(<ItemManagementPage />);
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('should show add form when Add New clicked', () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
  });

  it('should cancel add form', () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
  });

  it('should show edit form when edit button clicked', () => {
    render(<ItemManagementPage />);
    const editButton = screen.getByLabelText('Edit Pizza');
    fireEvent.click(editButton);
    expect(screen.getByText('Edit Item')).toBeInTheDocument();
  });

  it('should show edit form with item name', () => {
    render(<ItemManagementPage />);
    const editButton = screen.getByLabelText('Edit Pizza');
    fireEvent.click(editButton);
    expect(screen.getByDisplayValue('Pizza')).toBeInTheDocument();
  });

  it('should call deleteItem on confirm delete', async () => {
    render(<ItemManagementPage />);
    const deleteButton = screen.getByLabelText('Delete Pizza');
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteItem).toHaveBeenCalledWith('item-1');
    });
  });

  it('should cancel deletion', () => {
    render(<ItemManagementPage />);
    const deleteButton = screen.getByLabelText('Delete Pizza');
    fireEvent.click(deleteButton);

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    mockUseAppState.mockReturnValue({
      items: [],
      addToBasket: vi.fn(),
      removeFromBasket: vi.fn(),
      getBasketQuantity: vi.fn(() => 0),
      clearBasket: vi.fn(),
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      loading: false,
      refreshItems: vi.fn(),
      total: 0,
      basket: new Map(),
    });

    render(<ItemManagementPage />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });
});
