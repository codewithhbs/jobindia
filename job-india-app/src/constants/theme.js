// src/constants/theme.js

export const COLORS = {
  // Brand — warm indigo, not harsh blue
  primary: '#4F6EF7',
  primaryDark: '#3A57E8',
  primaryLight: '#F0F3FF',
  primaryMid: '#C7D0FC',

  // Accent — soft teal
  secondary: '#0EA5A0',
  secondaryLight: '#EDFAFA',

  // Warm amber
  accent: '#F59E0B',
  warningLight: '#FFF8EC',

  // States
  danger: '#F43F5E',
  dangerLight: '#FFF1F3',
  success: '#22C55E',
  successLight: '#F0FDF4',

  // Neutrals — warm not cold
  white: '#FFFFFF',
  black: '#13111A',

  gray50: '#F9F9FB',
  gray100: '#F2F2F6',
  gray200: '#E6E6EF',
  gray300: '#CACAD8',
  gray400: '#9898B0',
  gray500: '#6B6B85',
  gray600: '#4E4E66',
  gray700: '#333347',
  gray800: '#1E1E2E',

  // Surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F8',
  border: '#E6E6EF',

  // Text
  text: '#13111A',
  textSecondary: '#6B6B85',
  textLight: '#9898B0',

  overlay: 'rgba(19,17,26,0.45)',

  // Hero gradient stops
  heroTop: '#4F6EF7',
  heroBot: '#6B8BFF',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30 },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, full: 999 };

export const SHADOWS = {
  xs: { shadowColor: '#4F6EF7', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#13111A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#13111A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#13111A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  none: {},
};
