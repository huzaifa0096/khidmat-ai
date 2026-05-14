/**
 * Dual-theme palettes — Dark (default) + Light.
 * Both follow Apple iOS color systems for their respective modes.
 *
 * Components that opt into theming consume the active palette via
 * `useApp().colors`. Components that import `colors` directly continue to
 * use the legacy dark palette.
 */
import { colors as darkColors, radii, spacing, typography, shadows } from './colors';

export const lightColors: typeof darkColors = {
  bg: {
    // Khidmat brand light: warm off-white page, pure white cards.
    primary: '#f5f5f5',
    secondary: '#FFFFFF',
    surface: 'rgba(255,255,255,0.96)',
    surfaceSolid: '#FFFFFF',
    elevated: '#FAFAFA',
    elevatedHi: '#EFEFEF',
    glass: 'rgba(62,0,63,0.04)',
    glassStrong: 'rgba(62,0,63,0.08)',
    overlay: 'rgba(0,0,0,0.45)',
  },
  text: {
    primary: '#000000',
    secondary: 'rgba(0,0,0,0.72)',
    tertiary: 'rgba(0,0,0,0.50)',
    quaternary: 'rgba(0,0,0,0.30)',
    placeholder: 'rgba(0,0,0,0.36)',
    inverse: '#FFFFFF',
  },
  ios: {
    blue: '#007AFF',
    indigo: '#5856D6',
    purple: '#AF52DE',
    pink: '#FF2D55',
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    mint: '#00C7BE',
    teal: '#30B0C7',
    cyan: '#32ADE6',
    gray: '#8E8E93',
    gray2: '#AEAEB2',
    gray3: '#C7C7CC',
  },
  brand: {
    primary: '#3e003f',
    primaryDim: '#2a002b',
    primaryLight: '#7a3a7b',
    secondary: '#f05423',
    accent: '#f05423',
    // light mode: use the dark purple for text accents (high contrast on white)
    textAccent: '#3e003f',
    gradient: ['#3e003f', '#5a1f5c'] as const,
    gradientSoft: ['#3e003f', '#3e003f'] as const,
    gradientWarm: ['#f05423', '#d4421a'] as const,
    gradientEmergency: ['#f05423', '#d4421a'] as const,
    gradientSuccess: ['#34C759', '#34C759'] as const,
  },
  semantic: {
    success: '#34C759',
    warning: '#f05423',
    danger: '#FF3B30',
    info: '#3e003f',
  },
  agent: {
    intent: '#32ADE6',
    discovery: '#AF52DE',
    ranking: '#FF9500',
    booking: '#34C759',
    followup: '#FF2D55',
    crisis: '#FF3B30',
  },
  border: {
    // Light theme: borders nearly invisible — cards stand out via background contrast.
    subtle: 'rgba(0,0,0,0)',
    default: 'rgba(0,0,0,0.10)',
    strong: 'rgba(0,0,0,0.20)',
    divider: 'rgba(0,0,0,0.08)',  // row dividers — visible in light too
  },
};

export const themes = {
  dark: darkColors,
  light: lightColors,
};

export type ThemeName = keyof typeof themes;

export { darkColors, radii, spacing, typography, shadows };
