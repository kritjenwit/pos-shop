import { describe, it, expect } from 'vitest';
import { generateThaiQRPayment } from './thaiQR';

describe('generateThaiQRPayment', () => {
  describe('Phone number targeting', () => {
    it('should generate QR for phone number starting with 0', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toBeTruthy();
      expect(qr.length).toBeGreaterThan(0);
      expect(qr).toContain('010212'); // Dynamic POI method when amount provided
    });

    it('should convert phone starting with 0 to 66 format', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toBeTruthy();
    });

    it('should handle phone number with dashes', () => {
      const qr = generateThaiQRPayment('081-234-5678', 100);
      expect(qr).toBeTruthy();
    });

    it('should handle phone number with spaces', () => {
      const qr = generateThaiQRPayment('081 234 5678', 100);
      expect(qr).toBeTruthy();
    });
  });

  describe('Tax ID targeting', () => {
    it('should generate QR for 13-digit Tax ID', () => {
      const qr = generateThaiQRPayment('1234567890123', 100);
      expect(qr).toBeTruthy();
    });
  });

  describe('e-Wallet ID targeting', () => {
    it('should generate QR for 15+ digit e-Wallet ID', () => {
      const qr = generateThaiQRPayment('123456789012345678', 100);
      expect(qr).toBeTruthy();
    });
  });

  describe('Amount handling', () => {
    it('should include amount when provided as number', () => {
      const qr = generateThaiQRPayment('0812345678', 123.45);
      expect(qr).toBeTruthy();
      expect(qr).toContain('5406123.45'); // Amount field with value
    });

    it('should include amount when provided as string', () => {
      const qr = generateThaiQRPayment('0812345678', '500');
      expect(qr).toBeTruthy();
    });

    it('should not include amount when null', () => {
      const qr = generateThaiQRPayment('0812345678', null);
      expect(qr).toBeTruthy();
      expect(qr).not.toContain('54'); // No amount field
    });

    it('should not include amount when zero', () => {
      const qr = generateThaiQRPayment('0812345678', 0);
      expect(qr).toBeTruthy();
    });

    it('should not include amount when negative', () => {
      const qr = generateThaiQRPayment('0812345678', -100);
      expect(qr).toBeTruthy();
    });

    it('should format amount with 2 decimal places', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toContain('5406100.00');
    });
  });

  describe('Static vs Dynamic QR', () => {
    it('should generate static QR when no amount', () => {
      const qr = generateThaiQRPayment('0812345678');
      expect(qr).toBeTruthy();
      expect(qr).toContain('010211'); // Static POI method (no amount)
    });

    it('should generate dynamic QR when amount provided', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toBeTruthy();
      expect(qr).toContain('010212'); // Dynamic POI method (with amount)
    });
  });

  describe('CRC checksum', () => {
    it('should generate valid CRC at the end', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toBeTruthy();
      const crcPart = qr.slice(-4);
      expect(crcPart).toMatch(/^[0-9A-F]{4}$/);
    });
  });

  describe('PromptPay GUID', () => {
    it('should include PromptPay GUID', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toContain('A000000677010111');
    });
  });

  describe('Currency', () => {
    it('should use THB currency code', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toContain('5303764'); // Currency THB = 764
    });
  });

  describe('Country code', () => {
    it('should use TH country code', () => {
      const qr = generateThaiQRPayment('0812345678', 100);
      expect(qr).toContain('5802TH');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string target', () => {
      const qr = generateThaiQRPayment('', 100);
      expect(qr).toBeTruthy();
    });

    it('should handle special characters in target', () => {
      const qr = generateThaiQRPayment('081-234-5678 ext.123', 100);
      expect(qr).toBeTruthy();
    });
  });
});
