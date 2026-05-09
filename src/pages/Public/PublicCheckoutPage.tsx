import { useState } from 'react';
import { CheckCircle, ShoppingCart, ArrowLeft, User, Phone, CreditCard, ShoppingBag, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PublicCheckoutPage() {
  const { total, basket, items, createPendingOrder } = useApp();
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleCompleteOrder = async () => {
    if (!customerName.trim()) return;

    setCompleting(true);
    try {
      await createPendingOrder(customerName, customerPhone || undefined);
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

  if (total === 0 && !orderComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 animate-fade-in px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 font-heading">Your basket is empty</h2>
        <p className="text-gray-500 mt-2 max-w-xs text-center">
          Looks like you haven't added anything to your basket yet.
        </p>
        <button 
          onClick={() => window.location.href = '/menu'}
          className="mt-8 btn-primary px-8 py-3 rounded-xl flex items-center gap-2 hover:-translate-y-1 transition-all"
        >
          <ArrowLeft size={18} />
          Back to Menu
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-primary p-12 text-center relative overflow-hidden">
            {/* Success Animation Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <CheckCircle size={48} className="text-white" />
              </div>
              <h1 className="text-3xl font-black font-heading text-white mb-2">Order Received!</h1>
              <p className="text-white/80 font-medium">Thank you for your order</p>
            </div>
          </div>

          <div className="p-8 text-center">
            <div className="mb-8">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</div>
              <div className="text-4xl font-black text-primary font-heading">฿{total.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed">
                Your order has been sent to the shop for approval. Please wait for the staff to confirm your order.
              </p>
            </div>

            <button 
              className="btn-primary w-full py-4 rounded-2xl text-lg shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:translate-y-0" 
              onClick={handleReset}
            >
              Start New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => window.location.href = '/menu'}
          className="p-3 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black font-heading tracking-tight text-gray-900">Checkout</h1>
          <p className="text-gray-500 font-medium">Complete your order details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Left Column: Form */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-xl">
                <User size={20} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-heading">Customer Details</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="customerName" className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Full Name <span className="text-danger">*</span>
                </label>
                <div className="relative group">
                  <input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-4 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all duration-300 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-xs text-gray-400 italic">
              * Full Name is required to identify your order.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-xl">
                <CreditCard size={20} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-heading">Payment</h2>
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-sm text-primary font-bold">
                Payment will be handled at the counter.
              </p>
              <p className="text-xs text-primary/70 mt-1">
                Please present your order confirmation to the staff.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-xl">
                <ShoppingCart size={20} className="text-gray-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-heading">Summary</h2>
            </div>

            <div className="space-y-4 mb-8">
              {basketDetails.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex-grow">
                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">Qty: {item.qty}</div>
                  </div>
                  <div className="text-sm font-black text-gray-900 whitespace-nowrap">
                    ฿{(item.price * item.qty).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider">Subtotal</div>
                <div className="text-sm font-bold text-gray-900">฿{total.toLocaleString()}</div>
              </div>
              <div className="flex justify-between items-center text-xl">
                <div className="text-gray-900 font-black font-heading">Total</div>
                <div className="text-2xl font-black text-primary font-heading">฿{total.toLocaleString()}</div>
              </div>
            </div>

            <button
              onClick={handleCompleteOrder}
              disabled={completing || !customerName.trim()}
              className="w-full mt-8 btn-primary py-4 rounded-2xl text-lg shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {completing ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 size={24} className="animate-spin" />
                  Processing...
                </span>
              ) : 'Place Order'}
            </button>
            
            <p className="mt-4 text-[10px] text-center text-gray-400 uppercase tracking-widest font-black">
              SECURE CHECKOUT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}