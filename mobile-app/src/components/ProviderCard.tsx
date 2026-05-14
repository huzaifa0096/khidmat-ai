/**
 * Provider card — Apple-style restrained.
 * Single column. Mono text. One accent (blue) for rank-1. Status dots only.
 */
import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../hooks/useTheme';
import { getProviderImage } from '../utils/providerImage';

type Props = {
  rank: number;
  data: any;
  lang: 'ur' | 'en';
  onPress: () => void;
  index?: number;
};

const tierLabel: Record<string, string> = {
  elite: 'Elite',
  trusted: 'Trusted',
  verified: 'Verified',
  new: 'New',
};

export const ProviderCard = ({ rank, data, lang, onPress, index = 0 }: Props) => {
  const { colors, radii, shadows, isDark } = useTheme();
  const p = data.provider;
  const reasoning = lang === 'ur' ? data.reasoning_ur : data.reasoning_en;
  const isBest = rank === 1;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 360, delay: index * 70 }}
    >
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <MotiView
            animate={{ scale: pressed ? 0.985 : 1 }}
            transition={{ type: 'timing', duration: 120 }}
            style={[
              {
                backgroundColor: colors.bg.surfaceSolid,
                borderRadius: radii.lg,
                borderWidth: isBest ? 1 : isDark ? 0.5 : 0,
                borderColor: isBest
                  ? colors.brand.primary + '55'
                  : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'transparent',
                padding: 16,
                overflow: 'hidden',
              },
              isDark ? undefined : shadows.sm,
            ]}
          >
            {/* Top: avatar + name + rank */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image
                source={{ uri: getProviderImage(p) }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.bg.elevated,
                }}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 16,
                      fontWeight: '600',
                      letterSpacing: -0.3,
                    }}
                    numberOfLines={1}
                  >
                    {p.business_name}
                  </Text>
                  {p.verified ? (
                    <Ionicons name="checkmark-circle" size={13} color={colors.brand.primary} />
                  ) : null}
                </View>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 12,
                    marginTop: 1,
                    letterSpacing: -0.1,
                  }}
                  numberOfLines={1}
                >
                  {p.name} · {p.experience_years} yrs · {p.sector}
                </Text>
              </View>
              {isBest ? (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: colors.brand.primary,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                    BEST
                  </Text>
                </View>
              ) : (
                <Text style={{ color: colors.text.tertiary, fontSize: 13, fontWeight: '500' }}>
                  #{rank}
                </Text>
              )}
            </View>

            {/* Stat row — mono */}
            <View
              style={{
                flexDirection: 'row',
                marginTop: 14,
                gap: 14,
              }}
            >
              <Stat label={`${p.rating}★`} sub={`${p.reviews_count} reviews`} />
              <DotSeparator />
              <Stat label={`${data.distance_km.toFixed(1)} km`} sub="away" />
              <DotSeparator />
              <Stat label={`${p.completion_rate_percent}%`} sub="complete" />
            </View>

            {/* Reasoning */}
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 13,
                lineHeight: 18,
                marginTop: 12,
                letterSpacing: -0.1,
              }}
            >
              {reasoning}
            </Text>

            {/* Trust + price strip — compact, monochrome */}
            {(data.trust || data.pricing) ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 0.5,
                  borderTopColor: isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {data.trust ? (
                  <View>
                    <Text
                      style={{
                        color: colors.text.tertiary,
                        fontSize: 10,
                        fontWeight: '600',
                        letterSpacing: 0.4,
                      }}
                    >
                      TRUST
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text
                        style={{
                          color: colors.text.primary,
                          fontSize: 17,
                          fontWeight: '700',
                          letterSpacing: -0.4,
                        }}
                      >
                        {data.trust.score}
                      </Text>
                      <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>
                        / 100 · {tierLabel[data.trust.tier]}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {data.pricing ? (
                  <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        color: colors.text.tertiary,
                        fontSize: 10,
                        fontWeight: '600',
                        letterSpacing: 0.4,
                      }}
                    >
                      ESTIMATE
                    </Text>
                    <Text
                      style={{
                        color: colors.text.primary,
                        fontSize: 17,
                        fontWeight: '700',
                        letterSpacing: -0.4,
                      }}
                    >
                      PKR{' '}
                      {data.pricing.final_pkr?.toLocaleString?.() || data.pricing.final_pkr}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </MotiView>
        )}
      </Pressable>
    </MotiView>
  );
};

const Stat = ({ label, sub }: { label: string; sub: string }) => {
  const { colors } = useTheme();
  return (
    <View>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 11,
          marginTop: 1,
        }}
      >
        {sub}
      </Text>
    </View>
  );
};

const DotSeparator = () => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.text.quaternary,
        alignSelf: 'center',
      }}
    />
  );
};
