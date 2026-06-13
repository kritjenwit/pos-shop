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

const mockGetProfile = vi.hoisted(() => vi.fn());

vi.mock('../../shared/lib/profiles', () => ({
  getProfile: mockGetProfile,
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
    mockGetProfile.mockResolvedValue({
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
    mockGetProfile.mockResolvedValue(new Promise(() => {}));
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
    mockGetProfile.mockResolvedValue({
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

  it('should render back button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('should navigate back on back button click', async () => {
    renderPage();
    await waitFor(() => {
      fireEvent.click(screen.getByText('Back'));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show helper text under disabled fields', async () => {
    renderPage();
    await waitFor(() => {
      const helperTexts = screen.getAllByText('Contact admin to change');
      expect(helperTexts).toHaveLength(2);
    });
  });

  it('should auto-dismiss success message after 4 seconds', { timeout: 15000 }, async () => {
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

    await waitFor(() => {
      expect(screen.queryByText('Phone number updated')).not.toBeInTheDocument();
    }, { timeout: 6000, interval: 200 });
  });

  it('should handle error when fetching profile', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetProfile.mockResolvedValue({ data: null, error: { message: 'Profile fetch error' } });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching profile:', { message: 'Profile fetch error' });
    consoleSpy.mockRestore();
  });
});
