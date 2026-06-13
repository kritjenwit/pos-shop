import { supabase, type Item, type TransactionItem } from './supabase';
import { getSignedImageUrl, uploadImage } from './images';
import { generateOrderId } from './util';

export interface OrderQuery {
  status?: string;
  sellerId?: string;
  dateRange?: { start: string; end: string };
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  detail?: string;
}

export interface OrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderId: string | null;
  itemsCount: number;
  customerName: string | null;
  customerPhone: string | null;
  additionalDetail: string | null;
  sellerName: string | null;
  sellerEmail: string | null;
  sellerId: string;
  receiptUrl: string | null;
}

export interface OrderDetail {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  additionalDetail: string | null;
  receiptUrl: string | null;
  items: TransactionItem[];
  sellerName: string | null;
  sellerEmail: string | null;
  sellerPhone: string | null;
}

function mapTransaction(data: Record<string, unknown>, itemsCount: number): OrderSummary {
  return {
    id: data.id as string,
    totalAmount: data.total_amount as number,
    status: data.status as string,
    createdAt: data.created_at as string,
    orderId: (data.order_id as string) || null,
    itemsCount,
    customerName: (data.customer_name as string) || null,
    customerPhone: (data.customer_phone as string) || null,
    additionalDetail: (data.additional_detail as string) || null,
    sellerName: ((data.users as Record<string, unknown>)?.full_name as string) || null,
    sellerEmail: ((data.users as Record<string, unknown>)?.email as string) || null,
    sellerId: data.created_by as string,
    receiptUrl: data.receipt_url ? (data.receipt_url as string) : null,
  };
}

function mapTransactionDetail(
  data: Record<string, unknown>,
  items: TransactionItem[],
  receiptUrl: string | null,
): OrderDetail {
  return {
    id: data.id as string,
    totalAmount: data.total_amount as number,
    status: data.status as string,
    createdAt: data.created_at as string,
    orderId: (data.order_id as string) || null,
    customerName: (data.customer_name as string) || null,
    customerPhone: (data.customer_phone as string) || null,
    additionalDetail: (data.additional_detail as string) || null,
    receiptUrl,
    items,
    sellerName: ((data.users as Record<string, unknown>)?.full_name as string) || null,
    sellerEmail: ((data.users as Record<string, unknown>)?.email as string) || null,
    sellerPhone: ((data.users as Record<string, unknown>)?.phone as string) || null,
  };
}

function buildTransactionItems(
  basket: Map<string, number>,
  allItems: Item[],
): {
  items: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  total: number;
} {
  let total = 0;
  const items = Array.from(basket.entries()).map(([id, qty]) => {
    const item = allItems.find((i) => i.id === id);
    const subtotal = (item?.price || 0) * qty;
    total += subtotal;
    return {
      item_id: id,
      item_name: item?.name || '',
      quantity: qty,
      unit_price: item?.price || 0,
      subtotal,
    };
  });
  return { items, total };
}

export async function getOrders(query?: OrderQuery) {
  try {
    let dbQuery = supabase
      .from('transactions')
      .select('*, users(email, full_name)');

    if (query?.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query?.sellerId) {
      dbQuery = dbQuery.eq('created_by', query.sellerId);
    }
    if (query?.dateRange?.start) {
      dbQuery = dbQuery.gte('created_at', query.dateRange.start);
    }
    if (query?.dateRange?.end) {
      dbQuery = dbQuery.lte('created_at', query.dateRange.end);
    }

    dbQuery = dbQuery.order('created_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      return { data: null, error: error.message };
    }

    const txList = (data || []) as Record<string, unknown>[];
    const txIds = txList.map((t) => t.id as string);

    const batchCounts = new Map<string, number>();
    if (txIds.length > 0) {
      for (const txId of txIds) {
        const { count } = await supabase
          .from('transaction_items')
          .select('*', { count: 'exact', head: true })
          .eq('transaction_id', txId);
        batchCounts.set(txId, count || 0);
      }
    }

    const summaries = txList.map((t) =>
      mapTransaction(t, batchCounts.get(t.id as string) || 0),
    );

    return { data: summaries, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch orders' };
  }
}

export async function getOrderDetail(id: string) {
  try {
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*, users(email, full_name, phone)')
      .eq('id', id)
      .single();

    if (txError) {
      return { data: null, error: txError.message };
    }

    if (!txData) {
      return { data: null, error: 'Order not found' };
    }

    const { data: itemsData } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id)
      .order('id');

    let receiptUrl: string | null = null;
    if ((txData as Record<string, unknown>).receipt_url) {
      receiptUrl = await getSignedImageUrl(
        (txData as Record<string, unknown>).receipt_url as string,
      );
    }

    const detail = mapTransactionDetail(
      txData as Record<string, unknown>,
      itemsData || [],
      receiptUrl,
    );

    return { data: detail, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch order detail' };
  }
}

export async function createOrder(
  basket: Map<string, number>,
  allItems: Item[],
  userId: string,
  options?: {
    customerName?: string | null;
    customerPhone?: string | null;
    additionalDetail?: string | null;
    receiptFile?: File | null;
    status?: string;
  },
) {
  if (basket.size === 0) {
    return { data: null, error: 'Basket is empty' };
  }

  try {
    let receiptUrl: string | null = null;
    if (options?.receiptFile) {
      receiptUrl = await uploadImage(options.receiptFile);
    }

    const { items: transactionItems, total } = buildTransactionItems(basket, allItems);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status: options?.status || 'completed',
        created_by: userId,
        receipt_url: receiptUrl,
        customer_name: options?.customerName || null,
        customer_phone: options?.customerPhone || null,
        additional_detail: options?.additionalDetail || null,
        order_id: generateOrderId(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (data) {
      const lineItems = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        return { data: null, error: itemsError.message };
      }
    }

    return {
      data: {
        id: data.id,
        orderId: data.order_id || '',
        totalAmount: data.total_amount,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create order' };
  }
}

export async function createPendingOrder(
  basket: Map<string, number>,
  allItems: Item[],
  customerInfo?: CustomerInfo,
) {
  if (basket.size === 0) {
    return { data: null, error: 'Basket is empty' };
  }

  try {
    const { items: transactionItems, total } = buildTransactionItems(basket, allItems);

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        total_amount: total,
        status: 'pending',
        customer_name: customerInfo?.name || null,
        customer_phone: customerInfo?.phone || null,
        additional_detail: customerInfo?.detail || null,
        order_id: generateOrderId(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (data) {
      const lineItems = transactionItems.map((ti) => ({
        ...ti,
        transaction_id: data.id,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(lineItems);

      if (itemsError) {
        return { data: null, error: itemsError.message };
      }
    }

    return {
      data: {
        id: data.id,
        orderId: data.order_id || '',
        totalAmount: data.total_amount,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create pending order' };
  }
}

export async function approveOrder(id: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to approve order' };
  }
}

export async function cancelOrder(id: string) {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to cancel order' };
  }
}

export async function confirmPayment(
  id: string,
  options?: {
    receiptFile?: File;
    customerName?: string;
    customerPhone?: string;
    additionalDetail?: string;
  },
) {
  try {
    const updates: Record<string, string | null> = { status: 'completed' };

    if (options?.receiptFile) {
      const receiptUrl = await uploadImage(options.receiptFile);
      updates.receipt_url = receiptUrl;
    }

    const customerUpdates: Record<string, string | null | undefined> = {};
    if (options?.customerName !== undefined) {
      customerUpdates.customer_name = options.customerName;
    }
    if (options?.customerPhone !== undefined) {
      customerUpdates.customer_phone = options.customerPhone;
    }
    if (options?.additionalDetail !== undefined) {
      customerUpdates.additional_detail = options.additionalDetail;
    }

    const hasCustomerUpdates = Object.keys(customerUpdates).length > 0;
    if (hasCustomerUpdates) {
      const { error: infoError } = await supabase
        .from('transactions')
        .update(customerUpdates)
        .eq('id', id);

      if (infoError) {
        return { data: null, error: infoError.message };
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to confirm payment' };
  }
}
