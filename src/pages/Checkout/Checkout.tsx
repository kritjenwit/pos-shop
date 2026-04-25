import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';
import { generateThaiQRPayment } from '../../lib/thaiQR';
import { COLORS, PAYMENT } from '../../constants';

export default function CheckoutPage() {
  const { total, basket, items, completeOrder } = useApp();
  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const handleCompleteOrder = async () => {
    setCompleting(true);
    try {
      await completeOrder();
      setOrderComplete(true);
    } catch (error) {
      console.error('Error completing order:', error);
    } finally {
      setCompleting(false);
    }
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg" style={{ color: COLORS.text }}>Your basket is empty</p>
        <p style={{ color: COLORS.textSecondary }}>Add items to see checkout</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: COLORS.text }}>Checkout</h1>

      <div className="rounded-lg shadow-sm p-5 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: COLORS.text }}>Order Summary</h2>
        <div className="border-b pb-4 mb-4" style={{ borderColor: COLORS.border }}>
          {basketDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2" style={{ color: COLORS.textSecondary }}>
              <span>
                {item.name} x {item.qty}
              </span>
              <span>฿{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span style={{ color: COLORS.text }}>Total</span>
          <span style={{ color: COLORS.text }}>฿{total}</span>
        </div>
      </div>

      <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: COLORS.text }}>Scan to Pay</h2>
        
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1" style={{ color: COLORS.textSecondary }}>
            PromptPay Target (phone number)
          </label>
          <input
            type="text"
            value={promptPayTarget}
            onChange={(e) => setPromptPayTarget(e.target.value)}
            placeholder="0812345678"
            className="w-full px-3 py-2 border rounded text-sm focus:outline-none"
            style={{ borderColor: COLORS.border }}
          />
        </div>

        {qrValue ? (
          <div className="text-center">
            <div className="inline-block p-4 rounded-lg" style={{ backgroundColor: '#ffffff' }}>
              <QRCodeSVG value={qrValue} size={PAYMENT.qrSize} level={PAYMENT.qrLevel} />
            </div>
            <p className="text-xl font-bold mt-4" style={{ color: COLORS.primary }}>Amount: ฿{total}</p>
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
            <p>Enter PromptPay target to generate QR</p>
          </div>
        )}
      </div>

      <button
        onClick={handleCompleteOrder}
        disabled={completing || orderComplete}
        className="w-full py-3 rounded-lg font-semibold mt-4 transition-colors"
        style={{
          backgroundColor: orderComplete ? '#22c55e' : COLORS.primary,
          color: '#ffffff',
          opacity: completing ? 0.6 : 1,
        }}
      >
        {orderComplete ? 'Order Complete!' : completing ? 'Processing...' : 'Complete Order'}
      </button>
    </div>
  );
}