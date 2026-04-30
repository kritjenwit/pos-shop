import { describe, it, expect, vi } from 'vitest';

vi.stubGlobal('import.meta', {
  env: {},
});

import { APP, UI, COLORS, BREAKPOINTS, GRID, PAYMENT } from './index';

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
    it('should have primary color', () => {
      expect(COLORS.primary).toBe('#111111');
    });
    
    it('should have accent color', () => {
      expect(COLORS.accent).toBe('#333333');
    });
    
    it('should have danger color', () => {
      expect(COLORS.danger).toBe('#EF4444');
    });
    
    it('should have text color', () => {
      expect(COLORS.text).toBe('#111111');
    });
  });

  describe('BREAKPOINTS', () => {
    it('should have sm breakpoint', () => {
      expect(BREAKPOINTS.sm).toBe('640px');
    });

    it('should have md breakpoint', () => {
      expect(BREAKPOINTS.md).toBe('768px');
    });

    it('should have lg breakpoint', () => {
      expect(BREAKPOINTS.lg).toBe('1024px');
    });
  });

  describe('GRID', () => {
    it('should have cols configuration', () => {
      expect(GRID.cols).toEqual({ sm: 2, md: 3, lg: 4 });
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