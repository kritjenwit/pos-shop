import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('import.meta', {
  env: {},
});

import { APP, UI, COLORS, PAYMENT } from './index';

describe('constants', () => {
  describe('APP', () => {
    it('should have name', () => {
      expect(APP.name).toBe('POS Shop');
    });

    it('should have environment', () => {
      expect(APP.environment).toBe('development');
    });
  });

  describe('UI', () => {
    it('should have borderRadius', () => {
      expect(UI.borderRadius).toBe('8px');
    });

    it('should have borderRadiusSm', () => {
      expect(UI.borderRadiusSm).toBe('4px');
    });
  });

  describe('COLORS', () => {
    it('should have primary color reference', () => {
      expect(COLORS.primary).toBe('var(--color-primary)');
    });
    
    it('should have accent color reference', () => {
      expect(COLORS.accent).toBe('var(--color-accent)');
    });
    
    it('should have danger color reference', () => {
      expect(COLORS.danger).toBe('var(--color-danger)');
    });
    
    it('should have text color reference', () => {
      expect(COLORS.text).toBe('var(--color-text)');
    });
  });

  describe('PAYMENT', () => {
    it('should have qrSize', () => {
      expect(PAYMENT.qrSize).toBe(200);
    });

    it('should have qrLevel', () => {
      expect(PAYMENT.qrLevel).toBe('H');
    });
  });
});