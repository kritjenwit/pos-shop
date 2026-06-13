import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Share2, Copy, Check, Receipt, ImageOff } from 'lucide-react';
import { COLORS, PAYMENT } from '../constants';
import { getOrderDetail } from '../lib/orders';
import type { OrderDetail } from '../lib/orders';

interface TransactionDetailViewProps {
  transactionId: string;
  shareUrl: string;
  errorRedirectUrl: string;
  backUrl?: string;
  backLabel?: string;
  showStatusColors?: boolean;
}

export default function TransactionDetailView({
  transactionId,
  shareUrl,
  errorRedirectUrl,
  backUrl,
  backLabel = 'Back',
  showStatusColors = false,
}: TransactionDetailViewProps) {
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchTransaction = async () => {
    if (!transactionId) return;

    const { data, error } = await getOrderDetail(transactionId);

    if (error || !data) {
      console.error('Error fetching transaction:', error);
      navigate(errorRedirectUrl);
      return;
    }

    setTransaction(data);
    setLoading(false);
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

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
      case 'completed': return { backgroundColor: COLORS.primary + '15', color: COLORS.primary };
      case 'approved': return { backgroundColor: COLORS.accent + '15', color: COLORS.accent };
      case 'pending': return { backgroundColor: COLORS.textSecondary + '15', color: COLORS.textSecondary };
      case 'cancelled': return { backgroundColor: COLORS.danger + '15', color: COLORS.danger };
      default: return { backgroundColor: COLORS.textSecondary + '15', color: COLORS.textSecondary };
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
      {backUrl && (
        <button
          onClick={() => navigate(backUrl)}
          className="flex items-center gap-2 text-sm transition-colors duration-200 cursor-pointer hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-2 py-1"
          style={{ color: COLORS.textSecondary }}
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      )}

      <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold font-heading" style={{ color: COLORS.text }}>
              ฿{transaction.totalAmount.toFixed(2)}
            </span>
            <span
              className="text-xs px-2 py-1 rounded-full font-semibold"
              style={showStatusColors ? getStatusStyle(transaction.status) : { backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
            >
              {transaction.status}
            </span>
          </div>
          <div className="text-sm" style={{ color: COLORS.textSecondary }}>
            {formatDate(transaction.createdAt)}
          </div>
          {transaction.orderId && (
            <div className="text-xs font-mono font-bold mt-2 text-gray-400">
              {transaction.orderId}
            </div>
          )}
        </div>

        <div className="border-t pt-4" style={{ borderColor: COLORS.border }}>
          <h3 className="font-semibold mb-3 font-heading" style={{ color: COLORS.text }}>
            Items
          </h3>
          {transaction.items.map((item) => (
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

      {transaction.additionalDetail && (
        <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
          <h3 className="font-semibold mb-2 font-heading" style={{ color: COLORS.text }}>
            Additional Detail
          </h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: COLORS.textSecondary }}>
            {transaction.additionalDetail}
          </p>
        </div>
      )}

      {transaction.receiptUrl ? (
        <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
          <h3 className="font-semibold mb-3 font-heading" style={{ color: COLORS.text }}>
            Receipt
          </h3>
          <img src={transaction.receiptUrl} alt="Receipt" className="w-full rounded-lg" style={{ maxHeight: '400px', objectFit: 'contain' }} />
        </div>
      ) : (
        <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="flex items-center gap-2 mb-3">
            <ImageOff size={20} style={{ color: COLORS.textSecondary }} />
            <h3 className="font-semibold font-heading" style={{ color: COLORS.text }}>
              Receipt
            </h3>
          </div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>Receipt not found</p>
        </div>
      )}

      <div className="rounded-lg shadow-card p-5" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold font-heading" style={{ color: COLORS.text }}>
            Share Transaction
          </h3>
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 rounded-lg text-sm transition-all duration-200 cursor-pointer hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
            aria-label={showQR ? 'Hide QR Code' : 'Show QR Code'}
          >
            <Share2 size={18} />
          </button>
        </div>

        {showQR && (
          <div className="text-center animate-fade-in">
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
        )}
      </div>
    </div>
  );
}
