import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

type MockQueryBuilder = {
  single: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const createMockBuilder = (): MockQueryBuilder => {
  const builder: Partial<MockQueryBuilder> = {};
  builder.single = vi.fn();
  builder.eq = vi.fn(() => builder);
  builder.select = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  return builder as MockQueryBuilder;
};

const mockBuilder = createMockBuilder();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockBuilder),
  },
}));

import { signIn, signUp, updateUserPhone } from './auth';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuilder.single.mockReset();
    mockBuilder.eq.mockReset();
    mockBuilder.select.mockReset();
    mockBuilder.insert.mockReset();
    mockBuilder.update.mockReset();
    // Restore chain behavior
    mockBuilder.eq.mockReturnValue(mockBuilder);
    mockBuilder.select.mockReturnValue(mockBuilder);
    mockBuilder.insert.mockReturnValue(mockBuilder);
    mockBuilder.update.mockReturnValue(mockBuilder);
  });

  describe('signIn', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        full_name: 'Test User',
      };

      mockBuilder.single.mockResolvedValue({ data: mockUser, error: null });

      const { user, error } = await signIn('test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(error).toBeNull();
    });

    it('should return error when user not found', async () => {
      mockBuilder.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

      const { user, error } = await signIn('wrong@example.com', 'password123');

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });

    it('should return error when password is invalid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        full_name: 'Test User',
      };

      mockBuilder.single.mockResolvedValue({ data: mockUser, error: null });

      const { user, error } = await signIn('test@example.com', 'wrongpassword');

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('signUp', () => {
    it('should create user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'new@example.com',
        password: hashedPassword,
        full_name: 'New User',
      };

      mockBuilder.single.mockResolvedValue({ data: mockUser, error: null });

      const { user, error } = await signUp('new@example.com', 'password123', 'New User');

      expect(user).toBeDefined();
      expect(user?.email).toBe('new@example.com');
      expect(error).toBeNull();
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          full_name: 'New User',
        })
      );
    });

    it('should return error when signup fails', async () => {
      const insertReturn = createMockBuilder();
      insertReturn.single.mockResolvedValue({ data: null, error: { message: 'Email exists' } });
      mockBuilder.insert.mockReturnValueOnce(insertReturn);

      const { user, error } = await signUp('existing@example.com', 'password123');

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('updateUserPhone', () => {
    it('should update user phone number', async () => {
      mockBuilder.eq.mockResolvedValue({ error: null });

      const { error } = await updateUserPhone('user-1', '1234567890');

      expect(error).toBeNull();
      expect(mockBuilder.update).toHaveBeenCalledWith({ phone: '1234567890' });
    });

    it('should handle null phone number', async () => {
      mockBuilder.eq.mockResolvedValue({ error: null });

      const { error } = await updateUserPhone('user-1', null);

      expect(error).toBeNull();
      expect(mockBuilder.update).toHaveBeenCalledWith({ phone: null });
    });

    it('should return error when update fails', async () => {
      mockBuilder.eq.mockResolvedValue({ error: { message: 'Update failed' } });

      const { error } = await updateUserPhone('user-1', '1234567890');

      expect(error).toBeInstanceOf(Error);
    });
  });
});
