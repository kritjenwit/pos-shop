import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CheckoutPage from './Checkout';

const mockNavigate = vi.fn();
const mockCompleteOrder = vi.fn();
const mockConfirmPayment = vi.fn();

const mockUploadImage = vi.hoisted(() => vi.fn());
const mockGetSignedImageUrl = vi.hoisted(() => vi.fn());
const mockGenerateThaiQRPayment = vi.hoisted(() => vi.fn());
const mockUseAppState = vi.hoisted(() => vi.fn());
const mockUseAuthState = vi.hoisted(() => vi.fn());
const mockOrdersGetOrderDetail = vi.hoisted(() => vi.fn());
const mockOrdersConfirmPayment = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../shared/context/AppContext', () => ({ useApp: mockUseAppState }));
vi.mock('../../shared/context/AuthContext', () => ({ useAuth: mockUseAuthState }));
vi.mock('../../shared/lib/images', () => ({
  uploadImage: mockUploadImage,
  getSignedImageUrl: mockGetSignedImageUrl,
}));

vi.mock('../../shared/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));
vi.mock('../../shared/lib/thaiQR', () => ({
  generateThaiQRPayment: mockGenerateThaiQRPayment,
}));
vi.mock('../../shared/lib/orders', () => ({
  getOrderDetail: mockOrdersGetOrderDetail,
  confirmPayment: mockOrdersConfirmPayment,
}));
vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code">QR</div>,
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
  },
  PAYMENT: { qrSize: 200, qrLevel: 'H' },
}));

const mockItems = [
  { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
  { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
];

function makeBasket() {
  const b = new Map<string, number>();
  b.set('item-1', 2);
  b.set('item-2', 1);
  return b;
}

function renderCheckout(initialEntries = ['/checkout']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/pending-orders" element={<div>Pending Orders</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockCompleteOrder.mockResolvedValue({ id: 'tx-new', order_id: 'ORD-001', total_amount: 450 });
    mockConfirmPayment.mockResolvedValue(undefined);
    mockGenerateThaiQRPayment.mockReturnValue('thai-qr-string');
    mockUploadImage.mockResolvedValue('receipts/test.jpg');
    mockGetSignedImageUrl.mockResolvedValue('https://example.com/img.jpg');
    mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: null });

    mockUseAppState.mockReturnValue({
      basket: makeBasket(),
      items: mockItems,
      completeOrder: mockCompleteOrder,
      confirmPayment: mockConfirmPayment,
      addToBasket: vi.fn(),
      removeFromBasket: vi.fn(),
      getBasketQuantity: vi.fn(() => 0),
      clearBasket: vi.fn(),
      loading: false,
      refreshItems: vi.fn(),
      total: 450,
    });
    mockUseAuthState.mockReturnValue({
      user: { id: 'user-1', email: 'staff@shop.com', full_name: 'Staff User', phone: '0812345678' },
    });
  });

  describe('Customer Mode', () => {
    it('should render checkout heading', () => {
      renderCheckout();
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });

    it('should show empty basket when total is 0', () => {
      mockUseAppState.mockReturnValue({
        basket: new Map(),
        items: mockItems,
        completeOrder: mockCompleteOrder,
        confirmPayment: mockConfirmPayment,
        addToBasket: vi.fn(),
        removeFromBasket: vi.fn(),
        getBasketQuantity: vi.fn(() => 0),
        clearBasket: vi.fn(),
        loading: false,
        refreshItems: vi.fn(),
        total: 0,
      });
      renderCheckout();
      expect(screen.getByText('Your basket is empty')).toBeInTheDocument();
    });

    it('should render order summary with items', () => {
      renderCheckout();
      expect(screen.getByText(/Pizza/)).toBeInTheDocument();
      expect(screen.getByText(/Cola/)).toBeInTheDocument();
      const totals = screen.getAllByText(/฿450\.00/);
      expect(totals.length).toBeGreaterThanOrEqual(1);
    });

    it('should render PromptPay target input', () => {
      renderCheckout();
      const input = screen.getByLabelText('PromptPay Target (phone number)') as HTMLInputElement;
      expect(input.value).toBe('0812345678');
    });

    it('should render QR code when prompt pay target is set', () => {
      renderCheckout();
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    it('should show placeholder when no prompt pay target', () => {
      mockUseAuthState.mockReturnValue({
        user: { id: 'user-1', email: 'a@b.com', phone: '', full_name: 'A' },
      });
      renderCheckout();
      expect(screen.getByText('Enter PromptPay target')).toBeInTheDocument();
    });

    it('should update QR when prompt pay target changes', () => {
      mockUseAuthState.mockReturnValue({
        user: { id: 'user-1', email: 'a@b.com', phone: '', full_name: 'A' },
      });
      renderCheckout();
      const input = screen.getByLabelText('PromptPay Target (phone number)');
      fireEvent.change(input, { target: { value: '0999999999' } });
      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    it('should render receipt upload section', () => {
      renderCheckout();
      expect(screen.getByText('Click to upload receipt')).toBeInTheDocument();
    });

    it('should show complete order button', () => {
      renderCheckout();
      expect(screen.getByText('Complete Order')).toBeInTheDocument();
    });

    it('should complete order on submit', async () => {
      renderCheckout();
      fireEvent.click(screen.getByText('Complete Order'));

      await waitFor(() => {
        expect(mockCompleteOrder).toHaveBeenCalledWith(null, 'completed', null, null, null);
      });
    });

    it('should show success screen after order completion', async () => {
      renderCheckout();
      fireEvent.click(screen.getByText('Complete Order'));

      await waitFor(() => {
        expect(screen.getByText('Order Complete!')).toBeInTheDocument();
      });

      expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
      expect(screen.getByText('New Order')).toBeInTheDocument();
    });

    it('should call completeOrder with customer details', async () => {
      renderCheckout();
      fireEvent.change(screen.getByLabelText('Customer Name'), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0811111111' } });
      fireEvent.change(screen.getByLabelText('Additional Detail'), { target: { value: 'Extra spicy' } });
      fireEvent.click(screen.getByText('Complete Order'));

      await waitFor(() => {
        expect(mockCompleteOrder).toHaveBeenCalledWith(null, 'completed', 'John', '0811111111', 'Extra spicy');
      });
    });

    it('should reset state after clicking New Order', async () => {
      renderCheckout();
      fireEvent.click(screen.getByText('Complete Order'));

      await waitFor(() => {
        expect(screen.getByText('Order Complete!')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Order'));
      expect(screen.getByText('Checkout')).toBeInTheDocument();
    });
  });

  describe('Admin Mode', () => {
    const mockOrderDetail = {
      id: 'tx-1',
      totalAmount: 500,
      status: 'approved',
      createdAt: '2026-05-23T10:00:00Z',
      orderId: 'ORD-001',
      customerName: 'Customer A',
      customerPhone: '0899999999',
      additionalDetail: 'No onions',
      receiptUrl: null,
      items: [
        { id: 'ti-1', transaction_id: 'tx-1', item_id: 'item-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 },
        { id: 'ti-2', transaction_id: 'tx-1', item_id: 'item-2', item_name: 'Cola', quantity: 1, unit_price: 100, subtotal: 100 },
      ],
      sellerName: 'Staff User',
      sellerEmail: 'staff@shop.com',
      sellerPhone: '0812345678',
    };

    it('should render loading skeleton', () => {
      mockOrdersGetOrderDetail.mockResolvedValue(new Promise(() => {}));
      renderCheckout(['/checkout/tx-1']);
      expect(document.querySelector('.skeleton')).toBeInTheDocument();
    });

    it('should redirect when order not found', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: null, error: 'Not found' });

      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/pending-orders');
      });
    });

    it('should render payment view for approved order', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText(/Placed by: Staff User/)).toBeInTheDocument();
      expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
    });

    it('should set customer phone as PromptPay target', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        const input = screen.getByLabelText('PromptPay Target (phone number)') as HTMLInputElement;
        expect(input.value).toBe('0899999999');
      });
    });

    it('should confirm payment on submit', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Payment'));

      await waitFor(() => {
        expect(mockOrdersConfirmPayment).toHaveBeenCalledWith('tx-1', expect.objectContaining({}));
      });

      expect(screen.getByText('Payment Confirmed')).toBeInTheDocument();
    });

    it('should show processing state on confirm payment', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      mockOrdersConfirmPayment.mockImplementation(() => new Promise(() => {}));
      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Payment'));

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should show error when confirm payment fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      mockOrdersConfirmPayment.mockResolvedValue({ data: null, error: 'Payment error' });

      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(screen.getByText('Confirm Payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Confirm Payment'));

      await waitFor(() => {
        expect(screen.getByText('Payment error')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error confirming order:', 'Payment error');
      consoleSpy.mockRestore();
    });

    it('should navigate to pending-orders on back', async () => {
      mockOrdersGetOrderDetail.mockResolvedValue({ data: mockOrderDetail, error: null });
      renderCheckout(['/checkout/tx-1']);

      await waitFor(() => {
        expect(screen.getByText('Payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back'));

      expect(mockNavigate).toHaveBeenCalledWith('/pending-orders');
    });
  });
});
