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



export const INDIA_STATES = [
  { name: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400 },
  { name: 'Arunachal Pradesh', lat: 28.2180, lng: 94.7278 },
  { name: 'Assam', lat: 26.2006, lng: 92.9376 },
  { name: 'Bihar', lat: 25.0961, lng: 85.3131 },
  { name: 'Chhattisgarh', lat: 21.2787, lng: 81.8661 },
  { name: 'Goa', lat: 15.2993, lng: 74.1240 },
  { name: 'Gujarat', lat: 22.2587, lng: 71.1924 },
  { name: 'Haryana', lat: 29.0588, lng: 76.0856 },
  { name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { name: 'Jharkhand', lat: 23.6102, lng: 85.2799 },
  { name: 'Karnataka', lat: 15.3173, lng: 75.7139 },
  { name: 'Kerala', lat: 10.8505, lng: 76.2711 },
  { name: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569 },
  { name: 'Maharashtra', lat: 19.7515, lng: 75.7139 },
  { name: 'Manipur', lat: 24.6637, lng: 93.9063 },
  { name: 'Meghalaya', lat: 25.4670, lng: 91.3662 },
  { name: 'Mizoram', lat: 23.1645, lng: 92.9376 },
  { name: 'Nagaland', lat: 26.1584, lng: 94.5624 },
  { name: 'Odisha', lat: 20.9517, lng: 85.0985 },
  { name: 'Punjab', lat: 31.1471, lng: 75.3412 },
  { name: 'Rajasthan', lat: 27.0238, lng: 74.2179 },
  { name: 'Sikkim', lat: 27.5330, lng: 88.5122 },
  { name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569 },
  { name: 'Telangana', lat: 18.1124, lng: 79.0193 },
  { name: 'Tripura', lat: 23.9408, lng: 91.9882 },
  { name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Uttarakhand', lat: 30.0668, lng: 79.0193 },
  { name: 'West Bengal', lat: 22.9868, lng: 87.8550 },

  // Union Territories (7 here per req — note actual current count is 8 with J&K + Ladakh)
  { name: 'Andaman and Nicobar Islands', lat: 11.7401, lng: 92.6586 },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.1809, lng: 73.0169 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Lakshadweep', lat: 10.5667, lng: 72.6417 },
  { name: 'Puducherry', lat: 11.9416, lng: 79.8083 },
  { name: 'Jammu and Kashmir', lat: 33.7782, lng: 76.5762 },
];