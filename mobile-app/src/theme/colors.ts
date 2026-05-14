/**
 * Khidmat AI — Apple-inspired premium design tokens.
 *
 * Palette uses Apple's iOS Dark Mode system colors:
 * https://developer.apple.com/design/human-interface-guidelines/color
 *
 * Philosophy: less is more. Restrained palette, generous spacing,
 * subtle shadows, large radii. No loud gradients on everything.
 */

export const colors = {
  // True iOS dark backgrounds — pure neutrals, no tint
  bg: {
    primary: '#000000',           // iOS true black canvas
    secondary: '#0A0A0A',         // very slight elevation
    surface: 'rgba(28,28,30,0.94)',           // iOS systemBackground (Dark)
    surfaceSolid: '#1C1C1E',      // iOS secondarySystemGroupedBackground
    elevated: '#2C2C2E',          // iOS tertiarySystemBackground
    elevatedHi: '#3A3A3C',        // iOS quaternarySystemFill
    glass: 'rgba(255,255,255,0.04)',
    glassStrong: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.55)',
  },

  // iOS-style label hierarchy — boosted contrast for web readability
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(235,235,245,0.82)',   // brighter for web
    tertiary: 'rgba(235,235,245,0.56)',
    quaternary: 'rgba(235,235,245,0.34)',
    placeholder: 'rgba(235,235,245,0.38)',
    inverse: '#000000',
  },

  // iOS system colors (Dark Mode)
  ios: {
    blue: '#0A84FF',
    indigo: '#5E5CE6',
    purple: '#BF5AF2',
    pink: '#FF375F',
    red: '#FF453A',
    orange: '#FF9F0A',
    yellow: '#FFD60A',
    green: '#30D158',
    mint: '#63E6E2',
    teal: '#40C8E0',
    cyan: '#64D2FF',
    gray: '#8E8E93',
    gray2: '#636366',
    gray3: '#48484A',
  },

  // Brand mapping — Khidmat AI: deep aubergine purple + warm orange accent
  brand: {
    primary: '#3e003f',           // deep aubergine — for tiles / buttons / icons WITH WHITE TEXT
    primaryDim: '#2a002b',
    primaryLight: '#7a3a7b',       // lighter purple — used when text/accent needs purple on dark
    secondary: '#f05423',         // warm orange — used for highlights / status / accents
    accent: '#f05423',
    // text-friendly accent: bright orange — readable in BOTH dark and light modes
    textAccent: '#f05423',
    // Brand gradient uses both signature colours
    gradient: ['#3e003f', '#5a1f5c'] as const,
    gradientSoft: ['#3e003f', '#3e003f'] as const,
    gradientWarm: ['#f05423', '#d4421a'] as const,
    gradientEmergency: ['#f05423', '#d4421a'] as const,
    gradientSuccess: ['#30D158', '#34C759'] as const,
  },

  // Semantic
  semantic: {
    success: '#30D158',
    warning: '#f05423',           // brand orange = warning highlight
    danger: '#FF453A',
    info: '#3e003f',              // brand purple
  },

  // Agent identity colors — refined, each gets a single iOS color
  agent: {
    intent: '#64D2FF',          // cyan
    discovery: '#BF5AF2',       // purple
    ranking: '#FF9F0A',         // orange
    booking: '#30D158',         // green
    followup: '#FF375F',        // pink
    crisis: '#FF453A',          // red
  },

  // iOS separator colors
  border: {
    subtle: 'rgba(84,84,88,0.36)',     // iOS separator (Dark)
    default: 'rgba(84,84,88,0.55)',
    strong: 'rgba(255,255,255,0.18)',
    divider: 'rgba(255,255,255,0.08)', // row dividers inside cards
  },
};

// iOS-standard rounded corners — tighter and more consistent
export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,                  // iOS card standard (UITableViewCell groups)
  xl: 24,
  xxl: 32,
  pill: 999,
};

// 4-pt grid like iOS HIG
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  huge: 56,
};

// SF Pro-inspired type scale (matches iOS Large Title / Title 1-3 / Body)
export const typography = {
  largeTitle: { fontSize: 34, fontWeight: '800' as const, lineHeight: 41, letterSpacing: 0.37 },
  title1:     { fontSize: 28, fontWeight: '700' as const, lineHeight: 34, letterSpacing: 0.36 },
  title2:     { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: 0.35 },
  title3:     { fontSize: 20, fontWeight: '600' as const, lineHeight: 25, letterSpacing: 0.38 },
  headline:   { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.41 },
  body:       { fontSize: 17, fontWeight: '400' as const, lineHeight: 22, letterSpacing: -0.41 },
  callout:    { fontSize: 16, fontWeight: '400' as const, lineHeight: 21, letterSpacing: -0.32 },
  subhead:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 20, letterSpacing: -0.24 },
  footnote:   { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, letterSpacing: -0.08 },
  caption1:   { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0 },
  caption2:   { fontSize: 11, fontWeight: '600' as const, lineHeight: 13, letterSpacing: 0.06 },

  // legacy aliases for older code that still references these
  hero: { fontSize: 40, fontWeight: '800' as const, lineHeight: 48, letterSpacing: 0.4 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 25 },
  bodyBold: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  tiny: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
};

// Apple-style soft shadows — almost imperceptible
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  glow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};
