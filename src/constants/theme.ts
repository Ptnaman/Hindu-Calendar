import { Platform } from 'react-native';

export const palette = {
  background: '#F6F1EA',
  surface: '#FFFDF9',
  surfaceMuted: '#EEE6DC',
  surfaceStrong: '#E5DBD0',
  textPrimary: '#171411',
  textSecondary: '#665E55',
  textMuted: '#9A9187',
  border: '#DED4C9',
  accent: '#C55F2D',
  accentSoft: '#D69E2E',
  selected: '#111111',
  selectedText: '#FFFFFF',
  success: '#56745F',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

export const typography = {
  display: 48,
  title: 22,
  body: 16,
  small: 13,
  caption: 11,
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: '#1B140C',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 6,
  },
  default: {
    shadowColor: '#1B140C',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});

export const layout = {
  maxWidth: 520,
} as const;
