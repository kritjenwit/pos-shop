import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { Receipt, Check, ArrowLeft } from 'lucide-react';
import type { Transaction, TransactionItem } from '../../lib/supabase';

interface TransactionWithUser extends Transaction {
  user_email?: string;
  user_full_name?: string | null;
  user_phone?: string | null;
  item_count?: number;
}

export default function PendingOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<TransactionWithUser | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    setLoading(true);

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*, users(email, full_name, phone)')
      .eq('id', id)
      .single();

    if (txError) {
      console.error('Error fetching order:', txError);
      navigate('/pending-orders');
      return;
    }

    const { data: itemsData } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id)
      .order('id');

    // Only allow pending orders on this page
    if (txData?.status !== 'pending') {
      navigate('/pending-orders');
      return;
    }

    setOrder(txData);
    setItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleApprove = async () => {
    if (!order) return;
    setApproving(true);
    try {
      await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', order.id);

      // Navigate to checkout with the approved order ID for QR payment
      navigate(`/checkout/${order.id}`);
    } catch (error) {
      console.error('Error approving order:', error);
    } finally {
      setApproving(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      await supabase
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      navigate('/pending-orders');
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

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
      <div className="max-w-lg mx-auto space-y-4">
        <button
          onClick={() => navigate('/pending-orders')}
          className="flex items-center gap-2 text-sm mt-4 text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Pending Orders
        </button>
        <div className="rounded-lg shadow-card p-6" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="skeleton h-8 w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="skeleton h-4 w-full"></div>
            <div className="skeleton h-4 w-4/5"></div>
            <div className="skeleton h-4 w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Receipt size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Order not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/pending-orders')}
        className="flex items-center gap-2 text-sm mt-4 text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Pending Orders
      </button>

      {/* Order Header */}
      <div className="rounded-lg shadow-card p-5 mt-4" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold font-heading" style={{ color: COLORS.text }}>
              Order Details
            </h2>
            <div className="flex items-center gap-2 mt-1">
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
          </div>
          <span className="text-xl font-bold font-heading" style={{ color: COLORS.primary }}>
            ฿{order.total_amount.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 border-t pt-4" style={{ borderColor: COLORS.border }}>
          <div className="text-sm" style={{ color: COLORS.textSecondary }}>
            <div>By {order.user_full_name || order.user_email || 'Unknown'}</div>
            {order.customer_name && <div>Customer: {order.customer_name}</div>}
            {order.customer_phone && <div>Phone: {order.customer_phone}</div>}
            {order.additional_detail && <div className="mt-2 text-xs italic">Note: {order.additional_detail}</div>}
            <div>Placed: {formatDate(order.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="rounded-lg shadow-card p-5 mt-4" style={{ backgroundColor: COLORS.cardBackground }}>
        <h3 className="font-semibold mb-3 font-heading" style={{ color: COLORS.text }}>
          Items ({items.length})
        </h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: COLORS.border }}>
              <div>
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>{item.item_name}</div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>
                  ฿{item.unit_price.toFixed(2)} × {item.quantity}
                </div>
              </div>
              <div className="text-sm font-semibold font-heading" style={{ color: COLORS.primary }}>
                ฿{item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
          <span className="text-sm font-semibold" style={{ color: COLORS.textSecondary }}>Total</span>
          <span className="text-lg font-bold font-heading" style={{ color: COLORS.primary }}>
            ฿{order.total_amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCancel}
          className="flex-1 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          style={{ backgroundColor: COLORS.danger + '15', color: COLORS.danger, border: `1px solid ${COLORS.danger + '30'}` }}
        >
          Cancel
        </button>
        <button
          onClick={handleApprove}
          disabled={approving}
          className="flex-1 py-3 rounded-xl font-heading font-medium transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          style={{
            backgroundColor: approving ? COLORS.primary + '80' : COLORS.primary,
            color: '#ffffff',
          }}
        >
          {approving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Approving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Check size={16} />
              Approve & View QR
            </span>
          )}
        </button>
      </div>
    </div>
  );
}