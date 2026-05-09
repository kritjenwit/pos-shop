import { useState } from 'react';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants';

export default function PublicCheckoutPage() {
  const { total, basket, items, createPendingOrder } = useApp();
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleCompleteOrder = async () => {
    setCompleting(true);
    try {
      await createPendingOrder(customerName || undefined, customerPhone || undefined);
      setOrderComplete(true);
    } catch (error) {
      console.error('Error creating pending order:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleReset = () => {
    setOrderComplete(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  const basketDetails = Array.from(basket.entries())
    .map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return { name: item?.name || '', qty, price: item?.price || 0 };
    })
    .filter((i) => i.qty > 0);

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
          <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: COLORS.text }}>Order Submitted!</h1>
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>฿{total}</p>
          <p className="mb-6" style={{ color: COLORS.textSecondary }}>Your order has been sent for approval. Please wait for confirmation.</p>
          <button className="btn-primary w-full font-heading" onClick={handleReset}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>Place Your Order</h1>

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

      <div className="rounded-lg shadow-card p-6 mb-6" style={{ backgroundColor: COLORS.cardBackground }}>
        <h2 className="text-base font-semibold mb-4 font-heading" style={{ color: COLORS.text }}>Your Information (Optional)</h2>

        <div className="mb-4">
          <label htmlFor="customerName" className="label-base" style={{ color: COLORS.textSecondary }}>
            Name
          </label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
            className="input-base"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="customerPhone" className="label-base" style={{ color: COLORS.textSecondary }}>
            Phone Number
          </label>
          <input
            id="customerPhone"
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0812345678"
            className="input-base font-mono"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCompleteOrder}
          disabled={completing || orderComplete}
          className="btn-primary w-full py-3 font-heading"
        >
          {completing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting Order...
            </span>
          ) : 'Submit Order'}
        </button>

        <button
          onClick={() => window.location.href = '/menu'}
          className="btn-ghost w-full py-2 font-heading"
          style={{ color: COLORS.textSecondary }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}