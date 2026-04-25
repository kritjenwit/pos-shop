import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../../context/AppContext';

export default function CheckoutPage() {
  const { total, basket, items } = useApp();

  const basketDetails = Array.from(basket.entries())
    .map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return { name: item?.name || '', qty, price: item?.price || 0 };
    })
    .filter((i) => i.qty > 0);

  const qrValue = `https://payment.example.com/pay?amount=${total}`;

  if (total === 0) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg">Your basket is empty</p>
        <p className="text-slate-500">Add items to see checkout</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold mb-4">Order Summary</h2>
        <div className="border-b border-slate-200 pb-4 mb-4">
          {basketDetails.map((item, idx) => (
            <div key={idx} className="flex justify-between py-2 text-slate-500">
              <span>
                {item.name} x {item.qty}
              </span>
              <span>฿{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>฿{total}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <h2 className="text-base font-semibold mb-4">Scan to Pay</h2>
        <div className="inline-block bg-white p-4 rounded-lg">
          <QRCodeSVG value={qrValue} size={200} level="H" />
        </div>
        <p className="text-xl font-bold text-blue-600 mt-4">Amount: ฿{total}</p>
      </div>
    </div>
  );
}