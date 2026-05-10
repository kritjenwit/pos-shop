import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ShoppingCart, Upload, ArrowLeft, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, uploadImage } from '../../lib/supabase';
import { generateThaiQRPayment } from '../../lib/thaiQR';
import { COLORS, PAYMENT } from '../../constants';

export default function CheckoutPage() {
  const { basket, items, completeOrder, confirmPayment } = useApp();
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  const isAdminMode = !!orderId;

  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_id: string; total_amount: number } | null>(null);

  // Admin order state
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
  } | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Initialize prompt pay target from user profile
  useEffect(() => {
    if (user?.phone) {
      setPromptPayTarget(user.phone);
    }
  }, [user]);

  // Fetch admin order details when orderId is present
  useEffect(() => {
    if (isAdminMode && orderId) {
      loadAdminOrder();
    }
  }, [orderId]);

  const loadAdminOrder = async () => {
    setAdminLoading(true);
    try {
      const { data: tx, error } = await supabase
        .from('transactions')
        .select('*, users(email, full_name, phone)')
        .eq('id', orderId)
        .eq('status', 'approved')
        .single();

      if (error || !tx) {
        console.error('Error fetching admin order:', error);
        navigate('/pending-orders');
        return;
      }

      const { data: txItems } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', tx.id)
        .order('id');

      setAdminOrder({
        id: tx.id,
        order_id: tx.order_id || '',
        total_amount: tx.total_amount,
        customer_name: tx.customer_name,
        customer_phone: tx.customer_phone,
        items: txItems?.map((ti) => ({
          item_name: ti.item_name,
          quantity: ti.quantity,
          unit_price: ti.unit_price,
          subtotal: ti.subtotal,
        })) || [],
        user_email: tx.user_email,
        user_full_name: tx.user_full_name,
        user_phone: tx.user_phone,
      });

      // Set prompt pay target to customer's phone if available
      if (tx.customer_phone) {
        setPromptPayTarget(tx.customer_phone);
      } else if (tx.user_phone) {
        setPromptPayTarget(tx.user_phone);
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleCompleteOrder = async () => {
    if (isAdminMode && orderId) {
      // Admin mode: confirm payment for approved order
      setCompleting(true);
      try {
        if (receiptFile) {
          const receiptUrl = await uploadImage(receiptFile);
          await supabase
            .from('transactions')
            .update({ receipt_url: receiptUrl })
            .eq('id', orderId);
        }
        await confirmPayment(orderId);
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
      return;
    }

    // Normal customer checkout
    try {
      const data = await completeOrder(receiptFile);
      if (data) {
        setCreatedOrder(data as { id: string; order_id: string; total_amount: number });
      }
      setOrderComplete(true);
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleReset = () => {
    if (isAdminMode) {
      navigate('/pending-orders');
      return;
    }
    setOrderComplete(false);
    setCreatedOrder(null);
    setPromptPayTarget(user?.phone || '');
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  // Build basket details based on mode
  const basketDetails = isAdminMode
    ? (adminOrder?.items || []).map((item) => ({
        name: item.item_name,
        qty: item.quantity,
        price: item.unit_price,
      }))
    : Array.from(basket.entries())
        .map(([itemId, qty]) => {
          const item = items.find((i) => i.id === itemId);
          return { name: item?.name || '', qty, price: item?.price || 0 };
        })
        .filter((i) => i.qty > 0);

  const total = isAdminMode
    ? (adminOrder?.total_amount || 0)
    : Array.from(basket.entries()).reduce((sum: number, [itemId, qty]) => {
        const item = items.find((i) => i.id === itemId);
        return sum + (item ? item.price * qty : 0);
      }, 0);

  const qrValue = promptPayTarget && total > 0
    ? generateThaiQRPayment(promptPayTarget, total)
    : '';

  // Loading state for admin
  if (isAdminMode && adminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <div className="skeleton h-8 w-32 mb-4"></div>
        <div className="skeleton h-4 w-64 mb-2"></div>
      </div>
    );
  }

  // Admin order not found
  if (isAdminMode && !adminOrder) {
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

  // Order complete success screen
  if (orderComplete && createdOrder) {
    const isAdminSuccess = isAdminMode;
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
        <div className="rounded-lg shadow-card p-8 text-center animate-scale-in" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.primary + '20' }}>
            <CheckCircle size={40} style={{ color: COLORS.primary }} />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: COLORS.text }}>
            {isAdminSuccess ? 'Payment Confirmed' : 'Order Complete!'}
          </h1>
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
            ฿{createdOrder.total_amount.toFixed(2)}
          </p>
          <p className="mb-1" style={{ color: COLORS.textSecondary }}>
            {isAdminSuccess ? 'Payment has been confirmed successfully' : 'Payment has been processed successfully'}
          </p>
          {createdOrder.order_id && (
            <p className="text-sm font-mono text-gray-400 mb-6">{createdOrder.order_id}</p>
          )}
          <button className="btn-primary w-full font-heading" onClick={handleReset}>
            {isAdminMode ? 'Back to Pending Orders' : 'New Order'}
          </button>
        </div>
      </div>
    );
  }

  // Admin checkout view
  if (isAdminMode) {
    return renderCheckoutView(true);
  }

  // Normal customer checkout
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <ShoppingCart size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Your basket is empty</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Add items to see checkout</p>
      </div>
    );
  }

  return renderCheckoutView(false);

  function renderCheckoutView(isAdmin: boolean) {
    return (
      <div className="max-w-md mx-auto">
        {/* Admin Header */}
        {isAdmin && adminOrder && (
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
            {adminOrder.customer_name && (
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Customer: <span className="font-medium" style={{ color: COLORS.text }}>{adminOrder.customer_name}</span>
                {adminOrder.customer_phone && ` (${adminOrder.customer_phone})`}
              </p>
            )}
            {adminOrder.user_full_name && (
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                Placed by: {adminOrder.user_full_name || adminOrder.user_email}
              </p>
            )}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>
          {isAdmin ? 'Payment' : 'Checkout'}
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
          {adminOrder && (
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
          )}
        </div>

        <div className="rounded-lg shadow-card p-6 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
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

          {qrValue ? (
            <div className="text-center">
              <div className="inline-block p-4 rounded-lg shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                <QRCodeSVG value={qrValue} size={PAYMENT.qrSize} level={PAYMENT.qrLevel} />
              </div>
              <p className="text-xl font-bold font-heading mt-4" style={{ color: COLORS.primary }}>
                Amount: ฿{total.toFixed(2)}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 rounded-lg" style={{ backgroundColor: COLORS.background }}>
              <p className="font-medium" style={{ color: COLORS.text }}>Enter PromptPay target</p>
              <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>QR code will appear here</p>
            </div>
          )}
        </div>

        {!isAdmin && (
          <div className="rounded-lg shadow-card p-6 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
            <h2 className="text-base font-semibold mb-4 font-heading" style={{ color: COLORS.text }}>Upload Receipt (Optional)</h2>
            {receiptPreview ? (
              <div className="mb-4">
                <img src={receiptPreview} alt="Receipt preview" className="w-full rounded-lg mb-2" style={{ maxHeight: '200px', objectFit: 'contain' }} />
                <button onClick={handleRemoveReceipt} className="btn-danger text-sm py-1 px-3">Remove</button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: COLORS.border }}>
                <Upload size={32} className="mx-auto mb-2" style={{ color: COLORS.textSecondary }} />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <span className="text-sm font-medium" style={{ color: COLORS.primary }}>Click to upload receipt</span>
                  <input id="receipt-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
        )}

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
          ) : isAdmin ? 'Confirm Payment' : 'Complete Order'}
        </button>
      </div>
    );
  }
}