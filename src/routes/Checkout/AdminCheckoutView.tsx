import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ArrowLeft, Receipt } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { getSignedImageUrl } from '../../shared/lib/supabase';
import { generateThaiQRPayment } from '../../shared/lib/thaiQR';
import { COLORS, PAYMENT } from '../../shared/constants';
import * as orders from '../../shared/lib/orders';

interface AdminCheckoutViewProps {
  orderId: string;
}

export default function AdminCheckoutView({ orderId }: AdminCheckoutViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_id: string; total_amount: number } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [additionalDetail, setAdditionalDetail] = useState('');
  const [thaiQrLogoUrl, setThaiQrLogoUrl] = useState<string | null>(null);
  const [promptPayBadgeUrl, setPromptPayBadgeUrl] = useState<string | null>(null);
  const [qrOverlayUrl, setQrOverlayUrl] = useState<string | null>(null);

  const [adminOrder, setAdminOrder] = useState<{
    id: string;
    order_id: string;
    total_amount: number;
    customer_name: string | null;
    customer_phone: string | null;
    items: { item_name: string; quantity: number; unit_price: number; subtotal: number }[];
    user_email?: string;
    user_full_name?: string | null;
    user_phone?: string | null;
    additional_detail?: string | null;
  } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setPromptPayTarget(user.phone);
    }
  }, [user]);

  const loadAdminOrder = async () => {
    setAdminLoading(true);
    try {
      const { data: tx, error } = await orders.getOrderDetail(orderId);

      if (error || !tx || tx.status !== 'approved') {
        console.error('Error fetching admin order:', error);
        navigate('/pending-orders');
        return;
      }

      setAdminOrder({
        id: tx.id,
        order_id: tx.orderId || '',
        total_amount: tx.totalAmount,
        customer_name: tx.customerName,
        customer_phone: tx.customerPhone,
        items: tx.items.map((ti) => ({
          item_name: ti.item_name,
          quantity: ti.quantity,
          unit_price: ti.unit_price,
          subtotal: ti.subtotal,
        })),
        user_email: tx.sellerEmail || '',
        user_full_name: tx.sellerName,
        user_phone: tx.sellerPhone,
        additional_detail: tx.additionalDetail,
      });

      setCustomerName(tx.customerName || '');
      setCustomerPhone(tx.customerPhone || '');
      setAdditionalDetail(tx.additionalDetail || '');

      if (tx.customerPhone) {
        setPromptPayTarget(tx.customerPhone);
      } else if (tx.sellerPhone) {
        setPromptPayTarget(tx.sellerPhone);
      }
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOrder();
  }, [orderId]);

  const handleCompleteOrder = async () => {
    setCompleting(true);
    try {
      const { error } = await orders.confirmPayment(orderId, {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        additionalDetail: additionalDetail || undefined,
      });

      if (error) {
        console.error('Error confirming order:', error);
        return;
      }

      setCreatedOrder({
        id: orderId,
        order_id: adminOrder?.order_id || '',
        total_amount: adminOrder?.total_amount || 0,
      });
      setOrderComplete(true);
    } catch (error) {
      console.error('Error confirming order:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleReset = () => {
    navigate('/pending-orders');
  };

  const total = adminOrder?.total_amount || 0;

  const qrValue = promptPayTarget && total > 0
    ? generateThaiQRPayment(promptPayTarget, total)
    : '';

  useEffect(() => {
    if (!qrValue) {
      setThaiQrLogoUrl(null);
      setPromptPayBadgeUrl(null);
      setQrOverlayUrl(null);
      return;
    }

    getSignedImageUrl('Thai_QR_Payment_Logo-01.jpg').then(setThaiQrLogoUrl);
    getSignedImageUrl('PromptPay2.png').then(setPromptPayBadgeUrl);
    getSignedImageUrl('Thai_QR_Payment_Logo-06.png').then(setQrOverlayUrl);
  }, [qrValue]);

  if (adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <div className="skeleton h-8 w-32 mb-4"></div>
        <div className="skeleton h-4 w-64 mb-2"></div>
      </div>
    );
  }

  if (!adminOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <Receipt size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Order not found</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>This order may not be in approved status</p>
        <button
          onClick={() => navigate('/pending-orders')}
          className="btn-primary mt-4"
        >
          <ArrowLeft size={16} className="inline mr-2" />
          Back to Pending Orders
        </button>
      </div>
    );
  }

  if (orderComplete && createdOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
        <div className="rounded-lg shadow-card p-8 text-center animate-scale-in" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.primary + '20' }}>
            <CheckCircle size={40} style={{ color: COLORS.primary }} />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: COLORS.text }}>
            Payment Confirmed
          </h1>
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
            ฿{createdOrder.total_amount.toFixed(2)}
          </p>
          <p className="mb-1" style={{ color: COLORS.textSecondary }}>
            Payment has been confirmed successfully
          </p>
          {createdOrder.order_id && (
            <p className="text-sm font-mono text-gray-400 mb-6">{createdOrder.order_id}</p>
          )}
          <button className="btn-primary w-full font-heading" onClick={handleReset}>
            Back to Pending Orders
          </button>
        </div>
      </div>
    );
  }

  const basketDetails = (adminOrder.items || []).map((item) => ({
    name: item.item_name,
    qty: item.quantity,
    price: item.unit_price,
  }));

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: COLORS.primary + '10' }}>
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: COLORS.accent + '15', color: COLORS.accent }}
          >
            Approved
          </span>
        </div>
        {adminOrder.user_full_name && (
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>
            Placed by: {adminOrder.user_full_name || adminOrder.user_email}
          </p>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>
        Payment
      </h1>

      <div className="rounded-lg shadow-card p-5 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <h2 className="text-base font-semibold mb-4 font-heading" style={{ color: COLORS.text }}>Order Summary</h2>
        <div className="border-b pb-4 mb-4" style={{ borderColor: COLORS.border }}>
          {basketDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2" style={{ color: COLORS.textSecondary }}>
              <span className="font-medium">{item.name} x {item.qty}</span>
              <span className="font-heading">฿{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-lg font-bold font-heading">
          <span style={{ color: COLORS.text }}>Total</span>
          <span style={{ color: COLORS.primary }}>฿{total.toFixed(2)}</span>
        </div>

        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: COLORS.border }}>
          <div>
            <label htmlFor="customerName" className="label-base" style={{ color: COLORS.textSecondary }}>
              Customer Name
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="customerPhone" className="label-base" style={{ color: COLORS.textSecondary }}>
              Phone Number
            </label>
            <input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="input-base font-mono"
            />
          </div>
          <div>
            <label htmlFor="additionalDetail" className="label-base" style={{ color: COLORS.textSecondary }}>
              Additional Detail
            </label>
            <textarea
              id="additionalDetail"
              value={additionalDetail}
              onChange={(e) => setAdditionalDetail(e.target.value)}
              placeholder="e.g. No onions, extra spicy, gift wrap..."
              rows={3}
              className="input-base"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {adminOrder.order_id && (
              <div>
                <span className="text-gray-400">Order ID</span>
                <div className="font-mono font-semibold text-sm">{adminOrder.order_id}</div>
              </div>
            )}
            {adminOrder.user_full_name && (
              <div>
                <span className="text-gray-400">Staff</span>
                <div>{adminOrder.user_full_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg shadow-card mb-6 overflow-hidden" style={{ backgroundColor: COLORS.cardBackground }}>
        <div className="p-6">
          <h2 className="text-base font-semibold mb-4 font-heading" style={{ color: COLORS.text }}>Scan to Pay</h2>
          <div className="mb-4">
            <label htmlFor="promptPay" className="label-base" style={{ color: COLORS.textSecondary }}>
              PromptPay Target (phone number)
            </label>
            <input
              id="promptPay"
              type="text"
              value={promptPayTarget}
              onChange={(e) => setPromptPayTarget(e.target.value)}
              placeholder="0812345678"
              className="input-base font-mono"
            />
          </div>
        </div>

        {qrValue ? (
          <>
            <div className="text-center py-4" style={{ backgroundColor: '#003D6B' }}>
              {thaiQrLogoUrl && (
                <img
                  src={thaiQrLogoUrl}
                  alt="Thai QR Payment"
                  className="mx-auto"
                  style={{ maxWidth: '180px', height: 'auto' }}
                />
              )}
            </div>
            <div className="p-6 pt-4 text-center">
              {promptPayBadgeUrl && (
                <img
                  src={promptPayBadgeUrl}
                  alt="PromptPay"
                  className="mx-auto mb-4"
                  style={{ maxWidth: '120px', height: 'auto' }}
                />
              )}
              <div className="relative inline-block">
                <div className="inline-block p-4 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                  <QRCodeSVG value={qrValue} size={PAYMENT.qrSize} level={PAYMENT.qrLevel} />
                </div>
                {qrOverlayUrl && (
                  <img
                    src={qrOverlayUrl}
                    alt=""
                    className="absolute"
                    style={{
                      width: '48px',
                      height: '48px',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
              <p className="text-xl font-bold font-heading mt-4" style={{ color: COLORS.primary }}>
                Amount: ฿{total.toFixed(2)}
              </p>
            </div>
          </>
        ) : (
          <div className="p-6 pt-0 text-center py-8">
            <p className="font-medium" style={{ color: COLORS.text }}>Enter PromptPay target</p>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>QR code will appear here</p>
          </div>
        )}
      </div>

      <button
        onClick={handleCompleteOrder}
        disabled={completing}
        className="btn-primary w-full py-3 font-heading mt-4"
      >
        {completing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : 'Confirm Payment'}
      </button>
    </div>
  );
}
