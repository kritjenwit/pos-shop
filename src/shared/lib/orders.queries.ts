import { supabase } from './supabase';
import { getSignedImageUrl } from './images';
import type { TransactionItem } from './supabase';

export interface OrderQuery {
  status?: string;
  sellerId?: string;
  dateRange?: { start?: string; end?: string };
  page?: number;
  pageSize?: number;
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

export async function getOrders(query?: OrderQuery): Promise<{ data: OrderSummary[] | null; total: number; error: string | null }> {
  try {
    let dbQuery = supabase
      .from('transactions')
      .select('*, users(email, full_name)', { count: 'exact' });

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
    if (query?.page && query?.pageSize) {
      const start = (query.page - 1) * query.pageSize;
      const end = start + query.pageSize - 1;
      dbQuery = dbQuery.range(start, end);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      return { data: null, total: 0, error: error.message };
    }

    const txList = (data || []) as Record<string, unknown>[];
    const txIds = txList.map((t) => t.id as string);

    const batchCounts = new Map<string, number>();
    if (txIds.length > 0) {
      const { data: allItems } = await supabase
        .from('transaction_items')
        .select('transaction_id')
        .in('transaction_id', txIds);

      if (allItems) {
        for (const item of allItems) {
          const tid = item.transaction_id;
          batchCounts.set(tid, (batchCounts.get(tid) || 0) + 1);
        }
      }
    }

    const summaries = txList.map((t) =>
      mapTransaction(t, batchCounts.get(t.id as string) || 0),
    );

    return { data: summaries, total: count || 0, error: null };
  } catch (err) {
    return { data: null, total: 0, error: err instanceof Error ? err.message : 'Failed to fetch orders' };
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
