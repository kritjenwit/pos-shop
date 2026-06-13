import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

function TestConsumer() {
  const { isDark, toggle } = useTheme();
  return (
    <div>
      <span data-testid="is-dark">{String(isDark)}</span>
      <button data-testid="toggle" onClick={toggle}>Toggle</button>
    </div>
  );
}

function mockMatchMedia(matches: boolean) {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides isDark=false by default when localStorage is empty and no prefers-color-scheme match', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMatchMedia(false));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
  });

  it('sets isDark=true when localStorage has dark', () => {
    localStorage.setItem('pos-shop-theme', 'dark');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
  });

  it('sets isDark=false when localStorage has light', () => {
    localStorage.setItem('pos-shop-theme', 'light');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
  });

  it('toggle switches isDark from false to true', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMatchMedia(false));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');

    fireEvent.click(screen.getByTestId('toggle'));

    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');
  });

  it('toggle switches isDark from true to false', () => {
    localStorage.setItem('pos-shop-theme', 'dark');

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('true');

    fireEvent.click(screen.getByTestId('toggle'));

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
  });

  it('toggling persists to localStorage', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMatchMedia(false));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(localStorage.getItem('pos-shop-theme')).toBe('light');

    fireEvent.click(screen.getByTestId('toggle'));

    expect(localStorage.getItem('pos-shop-theme')).toBe('dark');
  });

  it('toggling adds/removes dark class on document.documentElement', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMatchMedia(false));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(screen.getByTestId('toggle'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(screen.getByTestId('toggle'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('useTheme returns context value when used inside ThemeProvider', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(mockMatchMedia(false));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
  });

  it('useTheme returns { isDark: false, toggle: () => {} } by default', () => {
    render(<TestConsumer />);

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    expect(screen.getByTestId('toggle')).toBeInTheDocument();
  });
});
