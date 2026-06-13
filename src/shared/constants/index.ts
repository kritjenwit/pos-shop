export const APP = {
  name: 'POS Shop',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
} as const;

export const UI = {
  stickyTop: '100px' as const,
  borderRadius: '8px' as const,
  borderRadiusSm: '4px' as const,
} as const;

export const COLORS = {
  background: 'var(--color-background)',
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  danger: 'var(--color-danger)',
  text: 'var(--color-text)',
  textSecondary: 'var(--color-text-secondary)',
  cardBackground: 'var(--color-card-background)',
  border: 'var(--color-border)',
  borderInput: 'var(--color-border-input)',
  'primary-04': 'var(--color-primary-04)',
  'primary-08': 'var(--color-primary-08)',
  'primary-10': 'var(--color-primary-10)',
  'primary-15': 'var(--color-primary-15)',
  'primary-20': 'var(--color-primary-20)',
  'primary-30': 'var(--color-primary-30)',
  'primary-80': 'var(--color-primary-80)',
  'accent-15': 'var(--color-accent-15)',
  'danger-10': 'var(--color-danger-10)',
  'danger-15': 'var(--color-danger-15)',
  'danger-30': 'var(--color-danger-30)',
  'textSecondary-15': 'var(--color-text-secondary-15)',
} as const;

export const PAYMENT = {
  qrSize: 200,
  qrLevel: 'H' as const,
} as const;

export const ROUTES = {
  menu: '/menu',
} as const;

export const VALIDATION = {
  maxItemNameLength: 200,
  maxCustomerNameLength: 200,
  maxPhoneLength: 30,
  maxAdditionalDetailLength: 1000,
} as const;
