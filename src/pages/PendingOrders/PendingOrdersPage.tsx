import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { Receipt, RefreshCw, Eye } from 'lucide-react';
import type { Transaction } from '../../lib/supabase';

interface TransactionWithUser extends Transaction {
  user_email?: string;
  user_full_name?: string | null;
  user_phone?: string | null;
  item_count?: number;
}

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, users(email, full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg shadow-sm" style={{ backgroundColor: COLORS.cardBackground }}>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="skeleton h-6 w-24"></div>
                <div className="skeleton h-4 w-40"></div>
              </div>
              <div className="skeleton h-4 w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Receipt size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>No pending orders</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
          Orders from the public menu will appear here for approval
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
          Pending Orders ({orders.length})
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          style={{ color: COLORS.primary, backgroundColor: COLORS.primary + '10' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {orders.map((order) => (
        <div
          key={order.id}
          className="w-full text-left p-4 rounded-lg transition-all duration-200 border"
          style={{
            backgroundColor: COLORS.cardBackground,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold font-heading" style={{ color: COLORS.text }}>
                  ฿{order.total_amount.toFixed(2)}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: COLORS.textSecondary + '15', color: COLORS.textSecondary }}
                >
                  {order.status}
                </span>
                {order.order_id && (
                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {order.order_id}
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: COLORS.textSecondary }}>
                {order.item_count} items • {order.user_full_name || order.user_email || 'Unknown'}
                {order.customer_name && (
                  <span className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
                    ({order.customer_name})
                  </span>
                )}
                {order.customer_phone && (
                  <span className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
                    ({order.customer_phone})
                  </span>
                )}
              </div>
              {order.additional_detail && (
                <div className="text-xs mt-1 truncate max-w-xs" style={{ color: COLORS.textSecondary }}>
                  {order.additional_detail}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {formatDate(order.created_at)}
              </span>
              <Link
                to={`/pending-orders/${order.id}`}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ color: COLORS.primary, backgroundColor: COLORS.primary + '10' }}
              >
                <Eye size={14} />
                View
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}