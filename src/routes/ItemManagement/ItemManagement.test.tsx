import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemManagementPage from './ItemManagement';

const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
const mockUploadImage = vi.hoisted(() => vi.fn());
const mockDeleteImage = vi.hoisted(() => vi.fn());
const mockGetSignedImageUrl = vi.hoisted(() => vi.fn());

const mockItems = [
  { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
  { id: 'item-2', name: 'Burger', price: 150, image: 'burger.jpg', quantity: 5 },
];

const mockUseAppState = vi.hoisted(() => vi.fn());

vi.mock('../../shared/context/AppContext', () => ({
  useApp: mockUseAppState,
}));

vi.mock('../../shared/lib/images', () => ({
  uploadImage: mockUploadImage,
  deleteImage: mockDeleteImage,
  getSignedImageUrl: mockGetSignedImageUrl,
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {},
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
  VALIDATION: { maxItemNameLength: 200, maxCustomerNameLength: 200, maxPhoneLength: 30, maxAdditionalDetailLength: 1000 },
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

  it('should show validation error when name is empty', async () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));

    const priceInput = screen.getByLabelText('Price');
    fireEvent.change(priceInput, { target: { value: '100' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid name or price')).toBeInTheDocument();
    });
  });

  it('should show validation error when price is zero', async () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));

    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid name or price')).toBeInTheDocument();
    });
  });

  it('should reset and close modal on backdrop click', () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));
    expect(screen.getByText('Add New Item')).toBeInTheDocument();

    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(screen.queryByText('Add New Item')).not.toBeInTheDocument();
  });

  it('should call updateItem when editing', async () => {
    render(<ItemManagementPage />);

    const editButton = screen.getByLabelText('Edit Pizza');
    fireEvent.click(editButton);
    expect(screen.getByText('Edit Item')).toBeInTheDocument();

    const nameInput = screen.getByDisplayValue('Pizza');
    fireEvent.change(nameInput, { target: { value: 'Pizza Updated' } });
    fireEvent.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
        name: 'Pizza Updated',
        price: 200,
        image: '',
      });
    });
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

  it('should call addItem when creating new item', async () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));

    const nameInput = screen.getByLabelText('Name');
    const priceInput = screen.getByLabelText('Price');

    fireEvent.change(nameInput, { target: { value: 'New Item' } });
    fireEvent.change(priceInput, { target: { value: '99' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith({ name: 'New Item', price: 99, image: '', quantity: 100 });
    });
  });

  it('should show error when save fails', async () => {
    mockAddItem.mockRejectedValue(new Error('Save failed'));
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));

    const nameInput = screen.getByLabelText('Name');
    const priceInput = screen.getByLabelText('Price');

    fireEvent.change(nameInput, { target: { value: 'New Item' } });
    fireEvent.change(priceInput, { target: { value: '99' } });

    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('should trigger file input when upload button clicked', () => {
    render(<ItemManagementPage />);
    fireEvent.click(screen.getByText('Add New'));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(screen.getByText('Upload Image'));

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should close delete confirmation on backdrop click', () => {
    render(<ItemManagementPage />);
    const deleteButton = screen.getByLabelText('Delete Pizza');
    fireEvent.click(deleteButton);
    expect(screen.getByText(/Are you sure/)).toBeInTheDocument();

    const backdrop = document.querySelector('.modal-backdrop')!;
    fireEvent.click(backdrop);

    expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
  });
});
