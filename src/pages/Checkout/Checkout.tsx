import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ShoppingCart, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { generateThaiQRPayment } from '../../lib/thaiQR';
import { COLORS, PAYMENT } from '../../constants';

export default function CheckoutPage() {
  const { total, basket, items, completeOrder } = useApp();
  const { user } = useAuth();
  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{ id: string, total_amount: number } | null>(null);

  useEffect(() => {
    if (user?.phone) {
      setPromptPayTarget(user.phone);
    }
  }, [user]);

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
    setCompleting(true);
    try {
      const data = await completeOrder(receiptFile);
      if (data) {
        setCreatedOrder(data as { id: string, total_amount: number });
      }
      setOrderComplete(true);
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleReset = () => {
    setOrderComplete(false);
    setCreatedOrder(null);
    setPromptPayTarget(user?.phone || '');
  };

  const basketDetails = Array.from(basket.entries())
    .map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return { name: item?.name || '', qty, price: item?.price || 0 };
    })
    .filter((i) => i.qty > 0);

  const qrValue = promptPayTarget && total > 0 
    ? generateThaiQRPayment(promptPayTarget, total)
    : '';

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <ShoppingCart size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Your basket is empty</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Add items to see checkout</p>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-lg shadow-card p-8 text-center animate-scale-in" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.primary + '20' }}>
            <CheckCircle size={40} style={{ color: COLORS.primary }} />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: COLORS.text }}>Order Complete!</h1>
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>฿{createdOrder?.total_amount || 0}</p>
          <p className="mb-6" style={{ color: COLORS.textSecondary }}>Payment has been processed successfully</p>
          <button className="btn-primary w-full font-heading" onClick={handleReset}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>Checkout</h1>

      <div className="rounded-lg shadow-card p-5 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <h2 className="text-base font-semibold mb-4 font-heading" style={{ color: COLORS.text }}>Order Summary</h2>
        <div className="border-b pb-4 mb-4" style={{ borderColor: COLORS.border }}>
          {basketDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2" style={{ color: COLORS.textSecondary }}>
              <span className="font-medium">{item.name} x {item.qty}</span>
              <span className="font-heading">฿{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-lg font-bold font-heading">
          <span style={{ color: COLORS.text }}>Total</span>
          <span style={{ color: COLORS.primary }}>฿{total}</span>
        </div>
      </div>

      <div className="rounded-lg shadow-card p-6" style={{ backgroundColor: COLORS.cardBackground }}>
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
            <p className="text-xl font-bold font-heading mt-4" style={{ color: COLORS.primary }}>Amount: ฿{total}</p>
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg" style={{ backgroundColor: COLORS.background }}>
            <p className="font-medium" style={{ color: COLORS.text }}>Enter PromptPay target</p>
            <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>QR code will appear here</p>
          </div>
        )}
      </div>

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

      <button
        onClick={handleCompleteOrder}
        disabled={completing || orderComplete}
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
        ) : 'Complete Order'}
      </button>
    </div>
  );
}
