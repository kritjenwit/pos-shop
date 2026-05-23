import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuQRCode from './MenuQRCode';

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

  it('should accept custom size', () => {
    const { container } = render(<MenuQRCode size={300} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
