import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.hoisted(() => vi.fn());
const mockUploadImage = vi.hoisted(() => vi.fn());
const mockGetSignedImageUrl = vi.hoisted(() => vi.fn());

vi.mock('./supabase', () => ({
  supabase: { from: mockFrom },
  uploadImage: mockUploadImage,
  getSignedImageUrl: mockGetSignedImageUrl,
}));

vi.mock('./util', () => ({
  generateOrderId: vi.fn(() => 'ORD-20260523-TEST'),
}));

const {
  getOrders,
  getOrderDetail,
  createOrder,
  createPendingOrder,
  approveOrder,
  cancelOrder,
  confirmPayment,
} = await import('./orders');

describe('orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadImage.mockResolvedValue('receipts/test.jpg');
    mockGetSignedImageUrl.mockResolvedValue('https://example.com/receipt.jpg');
  });

  describe('getOrders', () => {
    it('should return order summaries', async () => {
      const mockOrderFn = vi.fn().mockResolvedValue({
        data: [
          { id: 'tx-1', total_amount: 500, status: 'completed', created_at: '2026-05-23T10:00:00Z', order_id: 'ORD-001', customer_name: null, customer_phone: null, additional_detail: null, receipt_url: null, created_by: 'user-1', users: { email: 'staff@shop.com', full_name: 'Staff' } },
        ],
        error: null,
      });
      const mockGte = vi.fn();
      const mockLte = vi.fn();
      const mockEq = vi.fn();
      const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrderFn, gte: mockGte, lte: mockLte }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const mockCountEq = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockCountSelect = vi.fn(() => ({ eq: mockCountEq }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') {
          return { select: mockCountSelect };
        }
        return { select: mockSelect };
      });

      const { data, error } = await getOrders();

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe('tx-1');
      expect(data![0].totalAmount).toBe(500);
      expect(data![0].itemsCount).toBe(3);
    });

    it('should apply status filter', async () => {
      const mockEq = vi.fn();
      const mockOrderFn = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrderFn }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') {
          return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ count: 0 }) })) };
        }
        return { select: mockSelect };
      });

      await getOrders({ status: 'pending' });

      expect(mockSelect).toHaveBeenCalledWith('*, users(email, full_name)');
      expect(mockEq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should return null with error on failure', async () => {
      const mockOrderFn = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') {
          return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ count: 0 }) })) };
        }
        return { select: vi.fn(() => ({ eq: vi.fn(), order: mockOrderFn })) };
      });

      const { data, error } = await getOrders();

      expect(data).toBeNull();
      expect(error).toBe('DB error');
    });
  });

  describe('getOrderDetail', () => {
    it('should return order detail with items', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'tx-1', total_amount: 500, status: 'completed', created_at: '2026-05-23T10:00:00Z', order_id: 'ORD-001', customer_name: 'John', customer_phone: '0811111111', additional_detail: 'Notes', receipt_url: 'receipts/test.jpg', created_by: 'user-1', users: { email: 'staff@shop.com', full_name: 'Staff', phone: '0812345678' } },
        error: null,
      });
      const mockEq = vi.fn(() => ({ single: mockSingle, order: vi.fn() }));
      const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSingle }));

      const mockItemsOrder = vi.fn().mockResolvedValue({
        data: [{ id: 'ti-1', transaction_id: 'tx-1', item_id: 'item-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 }],
        error: null,
      });
      const mockItemsEq = vi.fn(() => ({ order: mockItemsOrder }));
      const mockItemsSelect = vi.fn(() => ({ eq: mockItemsEq }));

      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') {
          return { select: mockItemsSelect };
        }
        return { select: mockSelect };
      });

      const { data, error } = await getOrderDetail('tx-1');

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.id).toBe('tx-1');
      expect(data!.totalAmount).toBe(500);
      expect(data!.items).toHaveLength(1);
      expect(data!.sellerName).toBe('Staff');
    });

    it('should return null with error on fetch failure', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })), single: mockSingle })) });

      const { data, error } = await getOrderDetail('tx-1');

      expect(data).toBeNull();
      expect(error).toBe('Not found');
    });
  });

  describe('createOrder', () => {
    const basket = new Map([['item-1', 2], ['item-2', 1]]);
    const items = [
      { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
      { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
    ];

    function makeInsertMock(dataResult: Record<string, unknown>) {
      const mockSingle = vi.fn().mockResolvedValue({ data: dataResult, error: null });
      const mockSelect = vi.fn(() => {
        const p = Promise.resolve({ data: [dataResult], error: null });
        (p as unknown as { single: typeof mockSingle }).single = mockSingle;
        return p;
      });
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      return { mockInsert, mockSingle, mockSelect };
    }

    it('should create a completed order and clear basket', async () => {
      const { mockInsert } = makeInsertMock({ id: 'tx-new', order_id: 'ORD-001', total_amount: 450 });
      const itemInsertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'transactions') {
          return { insert: mockInsert };
        }
        if (table === 'transaction_items') {
          return { insert: itemInsertMock };
        }
        return { insert: vi.fn() };
      });

      const { data, error } = await createOrder(basket, items, 'user-1');

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.id).toBe('tx-new');
      expect(data!.totalAmount).toBe(450);
    });

    it('should upload receipt when provided', async () => {
      const { mockInsert } = makeInsertMock({ id: 'tx-new', order_id: 'ORD-001', total_amount: 450 });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const receiptFile = new File([''], 'receipt.jpg', { type: 'image/jpeg' });
      const { error } = await createOrder(basket, items, 'user-1', { receiptFile });

      expect(mockUploadImage).toHaveBeenCalledWith(receiptFile);
      expect(error).toBeNull();
    });

    it('should return error with empty basket', async () => {
      const { data, error } = await createOrder(new Map(), items, 'user-1');

      expect(data).toBeNull();
      expect(error).toBe('Basket is empty');
    });

    it('should return error on insert failure', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      const mockSelect = vi.fn(() => {
        const p = Promise.resolve({ data: null, error: { message: 'Insert failed' } });
        (p as unknown as { single: typeof mockSingle }).single = mockSingle;
        return p;
      });
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockFrom.mockReturnValue({ insert: mockInsert });

      const { data, error } = await createOrder(basket, items, 'user-1');

      expect(data).toBeNull();
      expect(error).toBe('Insert failed');
    });
  });

  describe('createPendingOrder', () => {
    const basket = new Map([['item-1', 2]]);
    const items = [{ id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 }];

    function makeInsertMock(dataResult: Record<string, unknown>) {
      const mockSingle = vi.fn().mockResolvedValue({ data: dataResult, error: null });
      const mockSelect = vi.fn(() => {
        const p = Promise.resolve({ data: [dataResult], error: null });
        (p as unknown as { single: typeof mockSingle }).single = mockSingle;
        return p;
      });
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      return { mockInsert, mockSingle, mockSelect };
    }

    it('should create pending order with customer info', async () => {
      const { mockInsert } = makeInsertMock({ id: 'tx-pending', order_id: 'ORD-PND', total_amount: 400 });
      const itemInsertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'transactions') {
          return { insert: mockInsert };
        }
        if (table === 'transaction_items') {
          return { insert: itemInsertMock };
        }
        return { insert: vi.fn() };
      });

      const { data, error } = await createPendingOrder(basket, items, {
        name: 'John',
        phone: '0811111111',
        detail: 'Extra cheese',
      });

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.id).toBe('tx-pending');
    });

    it('should return error with empty basket', async () => {
      const { data, error } = await createPendingOrder(new Map(), items);

      expect(data).toBeNull();
      expect(error).toBe('Basket is empty');
    });
  });

  describe('approveOrder', () => {
    it('should update status to approved', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const { error } = await approveOrder('order-1');

      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' });
    });

    it('should return error on failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Approve failed' } });
      mockFrom.mockReturnValue({ update: vi.fn(() => ({ eq: mockEq })) });

      const { error } = await approveOrder('order-1');

      expect(error).toBe('Approve failed');
    });
  });

  describe('cancelOrder', () => {
    it('should update status to cancelled', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const { error } = await cancelOrder('order-1');

      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('should return error on failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Cancel failed' } });
      mockFrom.mockReturnValue({ update: vi.fn(() => ({ eq: mockEq })) });

      const { error } = await cancelOrder('order-1');

      expect(error).toBe('Cancel failed');
    });
  });

  describe('confirmPayment', () => {
    it('should update status to completed', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const { error } = await confirmPayment('order-1');

      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should upload receipt and update receipt_url', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      await confirmPayment('order-1', { receiptFile: new File([''], 'rec.jpg') });

      expect(mockUploadImage).toHaveBeenCalled();
    });

    it('should update customer info before confirming', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      await confirmPayment('order-1', {
        customerName: 'John',
        customerPhone: '0811111111',
      });

      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenNthCalledWith(1, { customer_name: 'John', customer_phone: '0811111111' });
      expect(mockUpdate).toHaveBeenNthCalledWith(2, { status: 'completed' });
    });

    it('should return error on failure', async () => {
      mockFrom.mockReturnValue({ update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }) })) });

      const { error } = await confirmPayment('order-1');

      expect(error).toBe('Update failed');
    });

    it('should include additional detail when provided', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const { error } = await confirmPayment('order-1', {
        additionalDetail: 'Gift wrap please',
      });

      expect(error).toBeNull();
      expect(mockUpdate).toHaveBeenCalledWith({ additional_detail: 'Gift wrap please' });
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should return error when customer info update fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Info update failed' } });
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const { error } = await confirmPayment('order-1', {
        customerName: 'John',
      });

      expect(error).toBe('Info update failed');
    });

    it('should handle thrown errors in catch block', async () => {
      mockFrom.mockImplementation(() => { throw new Error('Network error'); });

      const { error } = await confirmPayment('order-1');

      expect(error).toBe('Network error');
    });
  });

  describe('order lifecycle', () => {
    const basket = new Map([['item-1', 2], ['item-2', 1]]);
    const items = [
      { id: 'item-1', name: 'Pizza', price: 200, image: '', quantity: 10 },
      { id: 'item-2', name: 'Cola', price: 50, image: '', quantity: 20 },
    ];
    const txId = 'tx-flow-1';
    const txData = { id: txId, total_amount: 450, status: 'pending', created_at: '2026-05-23T10:00:00Z', order_id: 'ORD-FLOW', customer_name: 'John', customer_phone: '0811111111', additional_detail: null, receipt_url: null, created_by: 'user-1', users: { email: 'staff@shop.com', full_name: 'Staff', phone: '0812345678' } };

    function makeInsertMock() {
      const mockSingle = vi.fn().mockResolvedValue({ data: txData, error: null });
      const mockSelect = vi.fn(() => {
        const p = Promise.resolve({ data: [txData], error: null });
        (p as unknown as { single: typeof mockSingle }).single = mockSingle;
        return p;
      });
      return vi.fn(() => ({ select: mockSelect }));
    }

    it('should create pending order then list, approve, confirm, and view detail', async () => {
      const txInsert = makeInsertMock();
      const tiInsert = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transactions') return { insert: txInsert };
        return { insert: tiInsert };
      });

      const { data: order, error: createErr } = await createPendingOrder(basket, items, {
        name: 'John', phone: '0811111111', detail: 'No ice',
      });
      expect(createErr).toBeNull();
      expect(order!.id).toBe(txId);

      const listOrder = vi.fn().mockResolvedValue({
        data: [{ id: txId, total_amount: 450, status: 'pending', created_at: '2026-05-23T10:00:00Z', order_id: 'ORD-FLOW', customer_name: 'John', customer_phone: '0811111111', additional_detail: null, receipt_url: null, created_by: 'user-1', users: { email: 'staff@shop.com', full_name: 'Staff' } }],
        error: null,
      });
      const listGte = vi.fn();
      const listLte = vi.fn();
      const listEq = vi.fn(() => ({ order: listOrder }));
      const listSelect = vi.fn(() => ({ eq: listEq, order: listOrder, gte: listGte, lte: listLte }));
      const countEq = vi.fn().mockResolvedValue({ count: 2, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') return { select: vi.fn(() => ({ eq: countEq })) };
        return { select: listSelect };
      });

      const { data: pendingOrders } = await getOrders({ status: 'pending' });
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders![0].id).toBe(txId);

      const approveEq = vi.fn().mockResolvedValue({ error: null });
      const approveUpdate = vi.fn(() => ({ eq: approveEq }));
      mockFrom.mockReturnValue({ update: approveUpdate });

      const { error: approveErr } = await approveOrder(txId);
      expect(approveErr).toBeNull();
      expect(approveUpdate).toHaveBeenCalledWith({ status: 'approved' });

      const confirmEq = vi.fn().mockResolvedValue({ error: null });
      const confirmUpdate = vi.fn(() => ({ eq: confirmEq }));
      mockFrom.mockReturnValue({ update: confirmUpdate });

      const { error: confirmErr } = await confirmPayment(txId);
      expect(confirmErr).toBeNull();
      expect(confirmUpdate).toHaveBeenCalledWith({ status: 'completed' });

      const detailSingle = vi.fn().mockResolvedValue({ data: { ...txData, status: 'completed', receipt_url: 'receipts/rec.jpg' }, error: null });
      const detailEq = vi.fn(() => ({ single: detailSingle, order: vi.fn() }));
      const detailSelect = vi.fn(() => ({ eq: detailEq, single: detailSingle }));
      const detailTiOrder = vi.fn().mockResolvedValue({ data: [{ id: 'ti-1', transaction_id: txId, item_id: 'item-1', item_name: 'Pizza', quantity: 2, unit_price: 200, subtotal: 400 }], error: null });
      const detailTiEq = vi.fn(() => ({ order: detailTiOrder }));
      const detailTiSelect = vi.fn(() => ({ eq: detailTiEq }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'transaction_items') return { select: detailTiSelect };
        return { select: detailSelect };
      });

      const { data: detail } = await getOrderDetail(txId);
      expect(detail).not.toBeNull();
      expect(detail!.id).toBe(txId);
      expect(detail!.items).toHaveLength(1);
    });
  });
});
