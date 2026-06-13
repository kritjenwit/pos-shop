import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const mockNavigate = vi.fn();
const mockUpdateUserPhone = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockSingle, mockFrom };
});

vi.mock('../../shared/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('../../shared/lib/auth', () => ({
  updateUserPhone: mockUpdateUserPhone,
}));

vi.mock('../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com', full_name: 'Test User' },
    signOut: vi.fn(),
    loading: false,
  })),
}));

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

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockUpdateUserPhone.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({
      data: { id: 'test-user-id', email: 'test@example.com', full_name: 'Test User', phone: '0812345678' },
      error: null,
    });
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
  };

  it('should render loading skeleton initially', () => {
    mockSingle.mockResolvedValue(new Promise(() => {}));
    renderPage();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('should render profile heading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  it('should render user info', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('should render phone number', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('0812345678')).toBeInTheDocument();
    });
  });

  it('should show display name fallback when full_name is null', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'test-user-id', email: 'anon@example.com', full_name: null, phone: null },
      error: null,
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/User/)).toBeInTheDocument();
    });
  });

  it('should save phone number', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('0812345678')).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '0898765432' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateUserPhone).toHaveBeenCalledWith('test-user-id', '0898765432');
    });
  });

  it('should save null phone when emptied', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('0812345678')).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockUpdateUserPhone).toHaveBeenCalledWith('test-user-id', null);
    });
  });

  it('should show success message on save', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('0812345678')).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '0898765432' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Phone number updated')).toBeInTheDocument();
    });
  });

  it('should show error message on save failure', async () => {
    mockUpdateUserPhone.mockResolvedValue({ error: new Error('Update failed') });

    renderPage();
    await waitFor(() => {
      expect(screen.getByDisplayValue('0812345678')).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText('Phone Number');
    fireEvent.change(phoneInput, { target: { value: '0898765432' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('should handle error when fetching profile', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Profile fetch error' } });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile:', { message: 'Profile fetch error' });
    consoleSpy.mockRestore();
  });
});
