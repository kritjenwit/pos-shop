import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Share2, Copy, Check, Receipt } from 'lucide-react';
import { supabase, type Transaction, type TransactionItem } from '../../lib/supabase';
import { COLORS, PAYMENT } from '../../constants';

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = (path: string) => window.location.href = path;
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/transactions/${id}`;

  const fetchTransaction = async () => {
    if (!id) return;
    
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (txError) {
      console.error('Error fetching transaction:', txError);
      navigate('/transactions');
      return;
    }

    const { data: itemsData } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id)
      .order('id');

    setTransaction(txData);
    setItems(itemsData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transaction ${id?.slice(0, 8)}`,
          text: `Transaction total: ฿${transaction?.total_amount}`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { bg: COLORS.primary + '15', color: COLORS.primary };
      case 'pending': return { bg: COLORS.accent + '15', color: COLORS.accent };
      case 'cancelled': return { bg: COLORS.danger + '15', color: COLORS.danger };
      default: return { bg: COLORS.textSecondary + '15', color: COLORS.textSecondary };
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <div className="skeleton h-8 w-40"></div>
        <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="skeleton h-10 w-32 mx-auto mb-2"></div>
          <div className="skeleton h-4 w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Receipt size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Transaction not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in">
      <button
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-2 text-sm transition-colors duration-200 cursor-pointer hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft size={16} />
        Back to Transactions
      </button>

      <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold font-heading" style={{ color: COLORS.text }}>
              ฿{transaction.total_amount.toFixed(2)}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={getStatusStyle(transaction.status)}
            >
              {transaction.status}
            </span>
          </div>
          <div className="text-sm" style={{ color: COLORS.textSecondary }}>
            {formatDate(transaction.created_at)}
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: COLORS.border }}>
          <h3 className="font-semibold mb-3 font-heading" style={{ color: COLORS.text }}>
            Items
          </h3>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between py-2"
              style={{ color: COLORS.textSecondary }}
            >
              <span className="font-medium">{item.item_name} x {item.quantity}</span>
              <span className="font-heading">฿{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold font-heading" style={{ color: COLORS.text }}>
            Share Transaction
          </h3>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
          >
            <Share2 size={14} />
            Share
          </button>
        </div>

        <div className="text-center">
          <div className="inline-block p-4 rounded-lg shadow-sm mb-3" style={{ backgroundColor: '#ffffff' }}>
            <QRCodeSVG value={shareUrl} size={PAYMENT.qrSize} level={PAYMENT.qrLevel} />
          </div>
          <p className="text-xs mb-3" style={{ color: COLORS.textSecondary }}>
            Scan to view transaction details
          </p>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 mx-auto text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              backgroundColor: copied ? COLORS.primary + '15' : COLORS.primary + '15',
              color: copied ? COLORS.primary : COLORS.primary,
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
