export const APP = {
  name: 'POS Shop',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
} as const;

export const API = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY,
} as const;

export const UI = {
  headerHeight: 'auto' as const,
  stickyTop: '100px' as const,
  borderRadius: '8px' as const,
  borderRadiusSm: '4px' as const,
} as const;

export const COLORS = {
  primary: '#111111',
  primaryHover: '#000000',
  primaryLight: '#333333',
  secondary: '#666666',
  accent: '#333333',
  danger: '#EF4444',
  dangerHover: '#DC2626',
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  text: '#111111',
  textSecondary: '#666666',
  border: '#E5E5E5',
  borderInput: '#D4D4D4',
  shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.07)',
  shadowLg: '0 10px 15px rgba(0,0,0,0.1)',
  transition: 'all 200ms ease',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
} as const;

export const GRID = {
  cols: {
    sm: 2,
    md: 3,
    lg: 4,
  },
} as const;

export const PAYMENT = {
  qrSize: 200,
  qrLevel: 'H' as const,
} as const;