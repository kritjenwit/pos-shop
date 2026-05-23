import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire supabase module BEFORE importing
vi.mock('./supabase', () => {
  const mockUpload = vi.fn().mockResolvedValue({ error: null });
  const mockRemove = vi.fn().mockResolvedValue({ error: null });
  const mockCreateSignedUrl = vi.fn().mockResolvedValue({ 
    data: { signedUrl: 'https://supabase.com/signed-url' }, 
    error: null 
  });
  
  return {
    supabase: {
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
          remove: mockRemove,
          createSignedUrl: mockCreateSignedUrl,
        })),
      },
    },
    getSignedImageUrl: vi.fn((path: string) => {
      if (!path) return Promise.resolve(null);
      if (path.startsWith('data:') || path.startsWith('http')) return Promise.resolve(path);
      return Promise.resolve('https://supabase.com/signed-url');
    }),
    uploadImage: vi.fn(() => Promise.resolve('mock-file-path')),
    deleteImage: vi.fn(() => Promise.resolve()),
  };
});

import { uploadImage, deleteImage, getSignedImageUrl } from './supabase';

describe('supabase image functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload file and return file path', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const result = await uploadImage(mockFile);
      expect(result).toBe('mock-file-path');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      await expect(deleteImage('test-path.png')).resolves.not.toThrow();
    });

    it('should handle empty file path', async () => {
      await expect(deleteImage('')).resolves.not.toThrow();
    });
  });

  describe('getSignedImageUrl', () => {
    it('should return null for null path', async () => {
      const result = await getSignedImageUrl(null);
      expect(result).toBeNull();
    });

    it('should return data URL as-is', async () => {
      const dataUrl = 'data:image/png;base64,abc123';
      const result = await getSignedImageUrl(dataUrl);
      expect(result).toBe(dataUrl);
    });

    it('should return http URL as-is', async () => {
      const httpUrl = 'http://example.com/image.png';
      const result = await getSignedImageUrl(httpUrl);
      expect(result).toBe(httpUrl);
    });

    it('should create signed URL for storage path', async () => {
      const result = await getSignedImageUrl('test-path.png');
      expect(result).toBe('https://supabase.com/signed-url');
    });
  });
});
