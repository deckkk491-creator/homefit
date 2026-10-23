import { useColorScheme } from 'react-native';

/**
 * Палитра: тёплый «бумажный» светлый фон и почти чёрный графит в тёмной теме.
 * Один акцент — кислотный лайм. На лайме всегда тёмный текст (контраст ≥ 12:1).
 */
const palette = {
  light: {
    bg: '#F4F3EE',
    surface: '#FFFFFF',
    surfaceAlt: '#EAE9E2',
    border: '#DCDBD3',
    text: '#141512',
    textMuted: '#62645C',
    textFaint: '#9A9C93',
    accent: '#C8F53C',
    accentInk: '#141512',
    /** Акцент для текста/иконок на светлом фоне (лайм нечитаем на белом). */
    accentStrong: '#4E6B00',
    danger: '#C2410C',
    success: '#3F7D20',
    overlay: 'rgba(20,21,18,0.06)',
  },
  dark: {
    bg: '#0E0F0C',
    surface: '#181A15',
    surfaceAlt: '#22241E',
    border: '#2C2F27',
    text: '#F4F3EE',
    textMuted: '#A4A79B',
    textFaint: '#6D7066',
    accent: '#C8F53C',
    accentInk: '#141512',
    accentStrong: '#C8F53C',
    danger: '#FB923C',
    success: '#A3E635',
    overlay: 'rgba(244,243,238,0.06)',
  },
};

export type Palette = typeof palette.light;

export function useTheme(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...palette[scheme], scheme };
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const type = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400' as const },
  bodyStrong: { fontSize: 17, lineHeight: 25, fontWeight: '600' as const },
  small: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  number: { fontSize: 56, lineHeight: 60, fontWeight: '800' as const, letterSpacing: -2, fontVariant: ['tabular-nums' as const] },
};
