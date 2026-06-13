import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('../../shared/constants', () => ({
  COLORS: {
    primary: '#111111',
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    text: '#111111',
    textSecondary: '#666666',
    border: '#E5E5E5',
    danger: '#EF4444',
    accent: '#333333',
  },
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle" />,
  RefreshCw: () => <div data-testid="refresh-cw" />,
}));

const ThrowingComponent = ({ message }: { message?: string }) => {
  throw new Error(message);
};

const ThrowingComponentEmptyError = () => {
  throw new Error();
};

const SafeComponent = () => <div data-testid="safe-child">Safe content</div>;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('safe-child')).toBeInTheDocument();
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('shows error fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-cw')).toBeInTheDocument();
  });

  it('displays the error message in the fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('test error')).toBeInTheDocument();
  });

  it('shows default error message when error has no message', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponentEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('resets error state and re-renders children on Try Again click', () => {
    let shouldThrow = true;

    const ToggleThrowingComponent = () => {
      if (shouldThrow) throw new Error('test error');
      return <div data-testid="recovered-child">Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <ToggleThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByTestId('recovered-child')).not.toBeInTheDocument();

    shouldThrow = false;

    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.getByTestId('recovered-child')).toBeInTheDocument();
    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
