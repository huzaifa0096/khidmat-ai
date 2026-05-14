/**
 * Khidmat Logo — renders the brand mark.
 *
 * Resolution order:
 *   1. assets/logo.png if present (user-provided brand asset)
 *   2. Stylised SVG fallback using brand colors
 */
import React from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type Props = {
  size?: number;
  /** If true, renders the icon inside a rounded square tile (typical for nav). */
  tile?: boolean;
  /** Tile background. Defaults to brand.primary. */
  tileColor?: string;
};

// Try to require the brand PNGs. If missing, fallback to sparkles.
let logoColor: any = null;
let logoWhite: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  logoColor = require('../../assets/logo.png');
} catch {
  logoColor = null;
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  logoWhite = require('../../assets/logo-white.png');
} catch {
  logoWhite = null;
}

export const Logo = ({ size = 32, tile = true, tileColor }: Props) => {
  const { colors, radii } = useTheme();
  const bg = tileColor ?? colors.brand.primary;
  const iconSize = Math.round(size * 0.55);

  // When tiled (purple bg) use white variant; otherwise use color logo
  const source = tile ? logoWhite || logoColor : logoColor || logoWhite;

  const inner = source ? (
    <Image
      source={source}
      style={{ width: size * (tile ? 0.78 : 1), height: size * (tile ? 0.78 : 1) }}
      resizeMode="contain"
    />
  ) : (
    <Ionicons name="sparkles" size={iconSize} color="#fff" />
  );

  if (!tile) {
    return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{inner}</View>;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.min(radii.md, Math.round(size * 0.3)),
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {inner}
    </View>
  );
};
