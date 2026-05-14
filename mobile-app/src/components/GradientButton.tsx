/**
 * Premium button — Apple's "Continue" feel with refined depth. Theme-aware.
 */
import React from 'react';
import { Pressable, Text, View, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../hooks/useTheme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger' | 'soft' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantGradient: Record<NonNullable<Props['variant']>, readonly [string, string]> = {
  // Subtle near-solid gradients only — single-hue, premium feel
  primary: ['#0A84FF', '#0A84FF'] as const,
  secondary: ['#0A84FF', '#0A84FF'] as const,
  danger: ['#FF453A', '#FF453A'] as const,
  soft: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'] as const,
  success: ['#30D158', '#30D158'] as const,
};

const sizeConfig = {
  sm: { paddingV: 10, paddingH: 16, fontSize: 14, iconSize: 16 },
  md: { paddingV: 13, paddingH: 20, fontSize: 15, iconSize: 17 },
  lg: { paddingV: 15, paddingH: 24, fontSize: 16, iconSize: 18 },
};

export const GradientButton = ({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: Props) => {
  const { colors, radii, shadows } = useTheme();
  const cfg = sizeConfig[size];
  const handle = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onPress();
  };

  const gradient: readonly [string, string] =
    variant === 'soft' ? [colors.bg.surfaceSolid, colors.bg.surfaceSolid] : variantGradient[variant];

  const softTextColor = variant === 'soft' ? colors.text.primary : '#fff';

  return (
    <Pressable
      onPress={handle}
      style={[{ opacity: disabled ? 0.4 : 1 }, style]}
      disabled={disabled || loading}
    >
      {({ pressed }) => (
        <MotiView
          animate={{ scale: pressed ? 0.97 : 1 }}
          transition={{ type: 'timing', duration: 140 }}
        >
          <View style={variant !== 'soft' ? shadows.sm : undefined}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: cfg.paddingV,
                paddingHorizontal: cfg.paddingH,
                borderRadius: radii.pill,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                borderWidth: variant === 'soft' ? 1 : 0,
                borderColor: colors.border.default,
                overflow: 'hidden',
              }}
            >
              {loading ? (
                <ActivityIndicator color={softTextColor} size="small" />
              ) : (
                <>
                  {icon ? <Ionicons name={icon} size={cfg.iconSize} color={softTextColor} /> : null}
                  <Text
                    style={{
                      color: softTextColor,
                      fontSize: cfg.fontSize,
                      fontWeight: '600',
                      letterSpacing: -0.3,
                    }}
                  >
                    {label}
                  </Text>
                  {iconRight ? (
                    <Ionicons name={iconRight} size={cfg.iconSize} color={softTextColor} />
                  ) : null}
                </>
              )}
            </LinearGradient>
          </View>
        </MotiView>
      )}
    </Pressable>
  );
};
