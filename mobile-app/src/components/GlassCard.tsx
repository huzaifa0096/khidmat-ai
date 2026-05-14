/**
 * Card surface — iOS UITableViewCell grouped style.
 *
 * Always uses a solid surface color (no blur on web — kills perf and looks cheap).
 * Tinted variant gets a 1px hairline on light bg, transparent on dark.
 */
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padded?: boolean;
  glow?: boolean;
  variant?: 'glass' | 'solid' | 'tinted';
  tintColor?: string;
};

export const GlassCard = ({
  children,
  style,
  padded = true,
  glow = false,
  variant = 'solid',
  tintColor,
}: Props) => {
  const { colors, radii, shadows, isDark } = useTheme();

  // Surface:
  //   - dark mode tinted: subtle tinted fill (works well on dark backgrounds)
  //   - light mode tinted: plain white card (the tinted fill on white looked like a brown border)
  //   - solid: regular elevated surface
  const surfaceBg =
    variant === 'tinted' && isDark
      ? (tintColor || colors.brand.primary) + '14'
      : colors.bg.surfaceSolid;

  // No borders, ever, on any mode — the surface contrast does the work.
  const borderColor = 'transparent';
  const borderWidth = 0;

  // Shadows: only on dark mode for glow, never as a subtle border substitute on light.
  // (On light mode the off-white page bg already gives enough separation from white cards.)
  const shadowStyle = glow ? shadows.md : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: surfaceBg,
          borderWidth,
          borderColor,
          borderRadius: radii.lg,
          padding: padded ? 16 : 0,
          overflow: 'hidden',
        },
        shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};
