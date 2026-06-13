import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../../shared/constants';
import { Receipt, RefreshCw, Eye } from 'lucide-react';
import { getOrders } from '../../shared/lib/orders';
import type { OrderSummary } from '../../shared/lib/orders';

export default function PendingOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPendingOrders = async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchErr } = await getOrders({ status: 'pending' });

    if (fetchErr) {
      setError(typeof fetchErr === 'string' ? fetchErr : 'Failed to load pending orders');
      console.error('Error fetching pending orders:', fetchErr);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPendingOrders();
    setRefreshing(false);
  };

  const mountedRef = useRef(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const interval = setInterval(() => {
      if (mountedRef.current) {
        fetchPendingOrders();
      }
    }, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
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
      <div className="space-y-2" role="status" aria-label="Loading pending orders">
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

  if (orders.length === 0 && !error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-16">
          <Receipt size={48} style={{ color: COLORS.textSecondary }} />
          <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>No pending orders</p>
          <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
            Orders from the public menu will appear here for approval
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {error && (
        <div className="p-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200" role="alert">
          {error}
        </div>
      )}

      {!error && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
            Pending Orders ({orders.length})
          </h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            style={{ color: COLORS.primary, backgroundColor: COLORS['primary-10'] }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}

      {!error && orders.map((order) => (
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
                  ฿{order.totalAmount.toFixed(2)}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: COLORS['textSecondary-15'], color: COLORS.textSecondary }}
                >
                  {order.status}
                </span>
                {order.orderId && (
                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {order.orderId}
                  </span>
                )}
              </div>
              <div className="text-sm" style={{ color: COLORS.textSecondary }}>
                {order.itemsCount} items • {order.sellerName || order.sellerEmail || 'Unknown'}
                {order.customerName && (
                  <span className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
                    ({order.customerName})
                  </span>
                )}
                {order.customerPhone && (
                  <span className="ml-2 text-xs" style={{ color: COLORS.textSecondary }}>
                    ({order.customerPhone})
                  </span>
                )}
              </div>
              {order.additionalDetail && (
                <div className="text-xs mt-1 truncate max-w-xs" style={{ color: COLORS.textSecondary }}>
                  {order.additionalDetail}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {formatDate(order.createdAt)}
              </span>
              <Link
                to={`/pending-orders/${order.id}`}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ color: COLORS.primary, backgroundColor: COLORS['primary-10'] }}
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