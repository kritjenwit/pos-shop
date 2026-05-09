import { QRCodeSVG } from 'qrcode.react';
import { COLORS, PAYMENT } from '../constants';

interface MenuQRCodeProps {
  size?: number;
}

export default function MenuQRCode({ size = PAYMENT.qrSize }: MenuQRCodeProps) {
  const menuUrl = `${window.location.origin}/menu`;

  return (
    <div className="text-center">
      <div className="inline-block p-4 rounded-lg shadow-sm mb-4" style={{ backgroundColor: '#ffffff' }}>
        <QRCodeSVG value={menuUrl} size={size} level={PAYMENT.qrLevel} />
      </div>
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
        Scan to access the menu
      </p>
      <p className="text-xs mt-1 font-mono" style={{ color: COLORS.textSecondary }}>
        {menuUrl}
      </p>
    </div>
  );
}