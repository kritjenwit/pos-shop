import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

import { supabase } from './supabase';
import { signIn, signUp, updateUserPhone } from './auth';

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        full_name: 'Test User',
      };

      const singleMock = vi.fn().mockResolvedValue({ data: mockUser, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ select: selectMock });

      const { user, error } = await signIn('test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(error).toBeNull();
    });

    it('should return error when user not found', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ select: selectMock });

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

      const singleMock = vi.fn().mockResolvedValue({ data: mockUser, error: null });
      const eqMock = vi.fn(() => ({ single: singleMock }));
      const selectMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ select: selectMock });

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

      const singleMock = vi.fn().mockResolvedValue({ data: mockUser, error: null });
      const selectMock = vi.fn(() => ({ single: singleMock }));
      const insertMock = vi.fn(() => ({ select: selectMock }));
      (supabase.from as any).mockReturnValue({ insert: insertMock });

      const { user, error } = await signUp('new@example.com', 'password123', 'New User');

      expect(user).toBeDefined();
      expect(user?.email).toBe('new@example.com');
      expect(error).toBeNull();
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          full_name: 'New User',
        })
      );
    });

    it('should return error when signup fails', async () => {
      const insertMock = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Email exists' } }),
        })),
      }));
      (supabase.from as any).mockReturnValue({ insert: insertMock });

      const { user, error } = await signUp('existing@example.com', 'password123');

      expect(user).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('updateUserPhone', () => {
    it('should update user phone number', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ update: updateMock });

      const { error } = await updateUserPhone('user-1', '1234567890');

      expect(error).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({ phone: '1234567890' });
    });

    it('should handle null phone number', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ update: updateMock });

      const { error } = await updateUserPhone('user-1', null);

      expect(error).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({ phone: null });
    });

    it('should return error when update fails', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
      const updateMock = vi.fn(() => ({ eq: eqMock }));
      (supabase.from as any).mockReturnValue({ update: updateMock });

      const { error } = await updateUserPhone('user-1', '1234567890');

      expect(error).toBeInstanceOf(Error);
    });
  });
});
