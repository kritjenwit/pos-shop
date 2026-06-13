import { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, ShoppingCart, Upload, ArrowLeft } from 'lucide-react';
import { useApp } from '../../shared/context/AppContext';
import { useAuth } from '../../shared/context/AuthContext';
import { getSignedImageUrl } from '../../shared/lib/images';
import { generateThaiQRPayment } from '../../shared/lib/thaiQR';
import { COLORS, PAYMENT, VALIDATION } from '../../shared/constants';
import { resetFormState } from '../../shared/lib/util';

function CustomerCheckoutView() {
  const navigate = useNavigate();
  const { basket, items, completeOrder, total } = useApp();
  const { user } = useAuth();

  const [promptPayTarget, setPromptPayTarget] = useState('');
  const [completing, setCompleting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<{ id: string; order_id: string; total_amount: number } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [additionalDetail, setAdditionalDetail] = useState('');
  const [thaiQrLogoUrl, setThaiQrLogoUrl] = useState<string | null>(null);
  const [promptPayBadgeUrl, setPromptPayBadgeUrl] = useState<string | null>(null);
  const [qrOverlayUrl, setQrOverlayUrl] = useState<string | null>(null);

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
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (customerName.length > VALIDATION.maxCustomerNameLength) {
      setError(`Name must be ${VALIDATION.maxCustomerNameLength} characters or less`);
      return;
    }
    if (customerPhone.length > VALIDATION.maxPhoneLength) {
      setError(`Phone must be ${VALIDATION.maxPhoneLength} characters or less`);
      return;
    }
    if (additionalDetail.length > VALIDATION.maxAdditionalDetailLength) {
      setError(`Additional detail must be ${VALIDATION.maxAdditionalDetailLength} characters or less`);
      return;
    }
    setCompleting(true);
    setError('');
    try {
      const data = await completeOrder(receiptFile, 'completed', customerName || null, customerPhone || null, additionalDetail || null);
      if (data) {
        setCreatedOrder(data as { id: string; order_id: string; total_amount: number });
      }
      setOrderComplete(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete order';
      setError(message);
      console.error('Error completing order:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleReset = () => {
    resetFormState({ setOrderComplete, setCreatedOrder, setCustomerName, setCustomerPhone, setAdditionalDetail });
    setPromptPayTarget(user?.phone || '');
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const basketDetails = useMemo(() => Array.from(basket.entries())
    .map(([itemId, qty]) => {
      const item = items.find((i) => i.id === itemId);
      return { name: item?.name || '', qty, price: item?.price || 0 };
    })
    .filter((i) => i.qty > 0), [basket, items]);

  const totalAmount = total;

  const qrValue = useMemo(() => promptPayTarget && totalAmount > 0
    ? generateThaiQRPayment(promptPayTarget, totalAmount)
    : '', [promptPayTarget, totalAmount]);

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

  if (totalAmount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-16">
        <ShoppingCart size={48} style={{ color: COLORS.textSecondary }} />
        <p className="text-lg mt-4 font-medium" style={{ color: COLORS.text }}>Your basket is empty</p>
        <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Add items to see checkout</p>
      </div>
    );
  }

  if (orderComplete && createdOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
        <div className="rounded-lg shadow-card p-8 text-center animate-scale-in" style={{ backgroundColor: COLORS.cardBackground }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS['primary-20'] }}>
            <CheckCircle size={40} style={{ color: COLORS.primary }} />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: COLORS.text }}>
            Order Complete!
          </h1>
          <p className="text-lg font-bold mb-2" style={{ color: COLORS.primary }}>
            ฿{createdOrder.total_amount.toFixed(2)}
          </p>
          <p className="mb-1" style={{ color: COLORS.textSecondary }}>
            Payment has been processed successfully
          </p>
          {createdOrder.order_id && (
            <p className="text-sm font-mono text-gray-400 mb-6">{createdOrder.order_id}</p>
          )}
          <button className="btn-primary w-full font-heading" onClick={handleReset}>
            New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={() => navigate('/menu')}
        className="flex items-center gap-2 mb-4 text-sm font-medium hover:opacity-80 transition-colors"
        style={{ color: COLORS.textSecondary }}
      >
        <ArrowLeft size={18} />
        Back
      </button>
      <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: COLORS.text }}>
        Checkout
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
          <span style={{ color: COLORS.primary }}>฿{totalAmount.toFixed(2)}</span>
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
            <div className="text-center py-4" style={{ backgroundColor: '#003D6B' }} aria-hidden="true">
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
                <div className="inline-block p-4 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--color-card-background)' }}>
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
                Amount: ฿{totalAmount.toFixed(2)}
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

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200" role="alert">
          {error}
        </div>
      )}

      <button
        onClick={handleCompleteOrder}
        disabled={completing}
        className="btn-primary w-full py-3 font-heading mt-4"
      >
        {completing ? (
          <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

export default memo(CustomerCheckoutView);
