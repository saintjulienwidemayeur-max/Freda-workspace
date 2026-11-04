import { useColorScheme } from 'react-native';

/** Identité visuelle Freda Workspace (pack officiel). */
export const Brand = {
  midnight: '#061137', navy: '#071653', deep: '#173A9E', blue: '#2B64E4', sky: '#4A95F5',
  mist: '#EEF3FD', slate: '#5B6478', amber: '#F5B83D', ink: '#0B1533', line: '#E3E8F2',
  green: '#10B981', danger: '#DC2626',
  gradient: ['#071653', '#173A9E', '#2B64E4', '#4A95F5'] as const,
  gradientStops: [0, 0.42, 0.78, 1] as const,
  avatars: ['#2B64E4', '#0E9F6E', '#7C3AED', '#DB2777', '#EA580C', '#0891B2', '#4F46E5', '#B45309'],
};

export const fonts = {
  regular: 'Inter-Regular', medium: 'Inter-Medium', semibold: 'Inter-SemiBold', bold: 'Inter-Bold',
  headMedium: 'Manrope-Medium', headSemi: 'Manrope-SemiBold', headBold: 'Manrope-Bold', headXBold: 'Manrope-ExtraBold',
};

export interface Palette {
  dark: boolean; bg: string; surface: string; text: string; sub: string; line: string; primary: string; unreadBg: string; field: string;
}
export const light: Palette = { dark: false, bg: '#F8FAFC', surface: '#FFFFFF', text: Brand.ink, sub: Brand.slate, line: Brand.line, primary: Brand.blue, unreadBg: '#F3F7FF', field: '#EEF3FD' };
export const darkP: Palette = { dark: true, bg: '#070D1F', surface: '#0B1226', text: '#F1F5FF', sub: '#9AA6C2', line: '#16213F', primary: Brand.sky, unreadBg: '#0E1733', field: '#111A33' };

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? darkP : light;
}
