import { supabase } from './supabase';

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
  rank: number;
  name: string;
  qtySold: number;
  revenue: number;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function getSalesSummary(days: number): Promise<{ data: SalesSummary | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('created_at', daysAgo(days));

    if (error) return { data: null, error: error.message };

    const rows = (data || []) as { total_amount: number }[];
    const totalRevenue = rows.reduce((sum, r) => sum + (r.total_amount || 0), 0);
    const totalOrders = rows.length;

    return {
      data: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch sales summary' };
  }
}

export async function getDailySales(days: number): Promise<{ data: DailySales[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', daysAgo(days));

    if (error) return { data: null, error: error.message };

    const rows = (data || []) as { total_amount: number; created_at: string }[];
    const map = new Map<string, { revenue: number; orders: number }>();

    for (const r of rows) {
      const key = r.created_at.slice(0, 10);
      const e = map.get(key) || { revenue: 0, orders: 0 };
      e.revenue += r.total_amount || 0;
      e.orders += 1;
      map.set(key, e);
    }

    const result: DailySales[] = [];
    for (const [date, v] of map) result.push({ date, revenue: v.revenue, orders: v.orders });
    result.sort((a, b) => a.date.localeCompare(b.date));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch daily sales' };
  }
}

export async function getTopItems(days: number, limit?: number): Promise<{ data: TopItem[] | null; error: string | null }> {
  try {
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('id')
      .eq('status', 'completed')
      .gte('created_at', daysAgo(days));

    if (txError) return { data: null, error: txError.message };

    const ids = ((txData || []) as { id: string }[]).map((r) => r.id);
    if (ids.length === 0) return { data: [], error: null };

    const { data: itemsData, error: itemsError } = await supabase
      .from('transaction_items')
      .select('item_name, quantity, subtotal')
      .in('transaction_id', ids);

    if (itemsError) return { data: null, error: itemsError.message };

    const itemRows = (itemsData || []) as { item_name: string; quantity: number; subtotal: number }[];
    const itemMap = new Map<string, { qty: number; rev: number }>();

    for (const r of itemRows) {
      const name = r.item_name || 'Unknown';
      const e = itemMap.get(name) || { qty: 0, rev: 0 };
      e.qty += r.quantity || 0;
      e.rev += r.subtotal || 0;
      itemMap.set(name, e);
    }

    let result: TopItem[] = Array.from(itemMap.entries())
      .map(([name, v]) => ({ name, qtySold: v.qty, revenue: v.rev, rank: 0 }))
      .sort((a, b) => b.qtySold - a.qtySold)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    if (limit !== undefined) {
      result = result.slice(0, limit);
    }

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch top items' };
  }
}
