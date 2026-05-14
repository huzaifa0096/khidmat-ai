/**
 * Performance Ticker — theme-aware animated metric counters.
 */
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { colors as iconPalette, radii } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';

const METRICS = [
  {
    id: 'response',
    icon: 'flash' as const,
    color: iconPalette.ios.yellow,
    label: 'AVG RESPONSE',
    target: 1.8,
    suffix: 's',
    decimal: 1,
  },
  {
    id: 'accuracy',
    icon: 'checkmark-circle' as const,
    color: iconPalette.ios.green,
    label: 'MATCH ACCURACY',
    target: 96,
    suffix: '%',
    decimal: 0,
  },
  {
    id: 'languages',
    icon: 'language' as const,
    color: iconPalette.ios.cyan,
    label: 'LANGUAGES',
    target: 3,
    suffix: '',
    decimal: 0,
  },
  {
    id: 'tools',
    icon: 'construct' as const,
    color: iconPalette.ios.purple,
    label: 'AGENT TOOLS',
    target: 24,
    suffix: '',
    decimal: 0,
  },
];

const Counter = ({
  target,
  decimal,
  suffix,
  delay,
}: {
  target: number;
  decimal: number;
  suffix: string;
  delay: number;
}) => {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 12, delay }}
    >
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.5,
        }}
      >
        {target.toFixed(decimal)}
        {suffix}
      </Text>
    </MotiView>
  );
};

export const PerformanceTicker = ({ lang }: { lang: 'ur' | 'en' }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {METRICS.map((m, idx) => (
        <View
          key={m.id}
          style={{
            flex: 1,
            backgroundColor: colors.bg.surfaceSolid,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: m.color + '22',
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            gap: 3,
            ...(Platform.OS === 'web'
              ? ({
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                } as any)
              : {}),
          }}
        >
          <Ionicons name={m.icon} size={13} color={m.color} />
          <Counter target={m.target} decimal={m.decimal} suffix={m.suffix} delay={idx * 120} />
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 8,
              fontWeight: '800',
              letterSpacing: 0.6,
              textAlign: 'center',
            }}
            numberOfLines={1}
          >
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  );
};
