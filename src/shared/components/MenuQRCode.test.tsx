import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuQRCode from './MenuQRCode';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: vi.fn(({ value, size, level }: { value: string; size: number; level: string }) =>
    <svg data-value={value} data-size={size} data-level={level} />
  ),
}));

vi.stubGlobal('import.meta', {
  env: {},
});

describe('MenuQRCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render QR code with menu URL', () => {
    render(<MenuQRCode />);
    expect(screen.getByText('Scan to access the menu')).toBeInTheDocument();
  });

  it('should render menu URL text', () => {
    render(<MenuQRCode />);
    const urlText = screen.getByText(/http/);
    expect(urlText).toBeInTheDocument();
    expect(urlText).toHaveTextContent('/menu');
  });

  it('should pass origin/menu as QR value', () => {
    render(<MenuQRCode />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('data-value', `${window.location.origin}/menu`);
  });

  it('should use default size from PAYMENT.qrSize', () => {
    render(<MenuQRCode />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('data-size', '200');
  });

  it('should use H level for QR code', () => {
    render(<MenuQRCode />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('data-level', 'H');
  });

  it('should accept custom size', () => {
    render(<MenuQRCode size={300} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('data-size', '300');
  });
});
