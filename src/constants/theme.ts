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
  display: 32,
  title: 21,
  body: 15,
  small: 12,
  caption: 11,
} as const;

export const festivalTheme = {
  containerHeight: 224,
  listGap: spacing.md,
  listPaddingTop: spacing.xs,
  listPaddingBottom: spacing.lg,
  accentWidth: 3,
  accentHeight: 54,
  accentColor: '#E4B06A',
  titleSize: 18,
  titleLineHeight: 24,
  titleLetterSpacing: -0.2,
  metaIconSize: 13,
  metaSize: 16,
  metaLineHeight: 22,
  emptyGap: spacing.xs,
  emptyPaddingHorizontal: spacing.md,
  emptyPaddingVertical: spacing.md,
  emptyIllustrationWidth: 108,
  emptyIllustrationHeight: 108,
  emptyTitleSize: 16,
  emptyTitleLineHeight: 22,
  emptyTitleColor: '#9E968D',
} as const;

export const shadows = Platform.select({
  ios: {
    shadowColor: '#1b150d',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  android: {
    elevation: 6,
  },
  default: {
    shadowColor: '#0000002f',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});

export const layout = {
  maxWidth: 520,
} as const;
