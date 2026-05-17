/**
 * ScoringMathModal — "Why This Provider?" transparency modal.
 *
 * Shows the literal weighted scoring math behind a provider's ranking:
 *  - Per-dimension normalized score [0,1]
 *  - Weight % (urgency-adaptive)
 *  - Contribution to final = score × weight
 *  - Animated bar chart per dimension
 *  - Toggle between normal / urgent / emergency weights
 *
 * Mathematical AI explainability — competitor apps don't show this.
 */
import React, { useState, useMemo } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';

const WEIGHTS = {
  normal: {
    distance: 0.25,
    rating: 0.25,
    reviews: 0.1,
    verified: 0.1,
    availability: 0.15,
    completion: 0.1,
    response_time: 0.05,
  },
  urgent: {
    distance: 0.35,
    rating: 0.2,
    reviews: 0.05,
    verified: 0.1,
    availability: 0.2,
    completion: 0.05,
    response_time: 0.05,
  },
  emergency: {
    distance: 0.5,
    rating: 0.1,
    reviews: 0.05,
    verified: 0.05,
    availability: 0.25,
    completion: 0.05,
    response_time: 0.0,
  },
};

const DIM_LABELS: Record<string, { en: string; ur: string }> = {
  distance: { en: 'Distance', ur: 'Fasla' },
  rating: { en: 'Rating', ur: 'Rating' },
  reviews: { en: 'Reviews', ur: 'Reviews' },
  verified: { en: 'Verified', ur: 'Verified' },
  availability: { en: 'Availability', ur: 'Available' },
  completion: { en: 'Completion Rate', ur: 'Kaam Complete Rate' },
  response_time: { en: 'Response Time', ur: 'Reply Speed' },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  provider: any;
  scoreBreakdown?: Record<string, number>;
  finalScore?: number;
  rank?: number;
};

export const ScoringMathModal = ({
  visible,
  onClose,
  provider,
  scoreBreakdown,
  finalScore,
  rank,
}: Props) => {
  const { colors, lang } = useApp();
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');

  // Compute or use passed-in score breakdown
  const breakdown = useMemo(() => {
    if (scoreBreakdown) return scoreBreakdown;
    // Compute deterministic mock from provider
    const distance_km = provider?.distance_km ?? 3.5;
    const rating = provider?.rating ?? 4.5;
    const reviews_count = provider?.reviews_count ?? 100;
    const verified = provider?.verified ?? true;
    const availability = provider?.availability ?? 'available_now';
    const completion = provider?.completion_rate_percent ?? 92;
    const response = provider?.avg_response_minutes ?? 30;

    return {
      distance: Math.max(0, 1 - distance_km / 15),
      rating: Math.max(0, (rating - 3.0) / 2.0),
      reviews: Math.min(1, Math.log10(reviews_count + 1) / 3),
      verified: verified ? 1.0 : 0.5,
      availability:
        availability === 'available_now'
          ? 1.0
          : availability === 'available_today'
          ? 0.85
          : 0.7,
      completion: Math.max(0, (completion - 80) / 20),
      response_time: Math.max(0, 1 - response / 90),
    };
  }, [provider, scoreBreakdown]);

  const weights = WEIGHTS[urgency];
  const contributions: Record<string, number> = {};
  let total = 0;
  Object.keys(weights).forEach((k) => {
    const s = (breakdown as any)[k] ?? 0;
    const w = (weights as any)[k];
    const c = s * w;
    contributions[k] = c;
    total += c;
  });
  total = Math.min(1, total);

  const computedFinal = Math.round(total * 100);
  const displayFinal = finalScore != null ? Math.round(finalScore * 100) : computedFinal;

  const maxContribution = Math.max(...Object.values(contributions), 0.01);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg.primary,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: '88%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border.divider,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="analytics" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800' }}>
                {lang === 'ur' ? 'Yeh Provider Kyun?' : 'Why This Provider?'}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                Agent 3 (Ranking Brain) · Explainable AI
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={colors.text.tertiary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Final score banner */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: radii.lg,
                backgroundColor: colors.brand.primary + '15',
                marginBottom: spacing.lg,
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1,
                  }}
                >
                  {lang === 'ur' ? 'FINAL SCORE' : 'FINAL SCORE'}
                </Text>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 32,
                    fontWeight: '800',
                    letterSpacing: -0.6,
                    marginTop: 2,
                  }}
                >
                  {displayFinal}
                  <Text style={{ color: colors.text.tertiary, fontSize: 14, fontWeight: '600' }}> /100</Text>
                </Text>
                {rank ? (
                  <Text style={{ color: colors.brand.textAccent, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                    {lang === 'ur' ? `Rank #${rank}` : `Ranked #${rank}`}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  {lang === 'ur' ? 'PROVIDER' : 'PROVIDER'}
                </Text>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 13,
                    fontWeight: '700',
                    marginTop: 2,
                    maxWidth: 160,
                  }}
                  numberOfLines={2}
                >
                  {provider?.business_name || provider?.name || '—'}
                </Text>
              </View>
            </View>

            {/* Urgency selector — weights change based on this */}
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {lang === 'ur' ? 'WEIGHTS BY URGENCY (try changing)' : 'WEIGHTS BY URGENCY (tap to change)'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.lg }}>
              {(['normal', 'urgent', 'emergency'] as const).map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUrgency(u)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: urgency === u ? colors.brand.primary : colors.bg.surfaceSolid,
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: urgency === u ? '#fff' : colors.text.secondary,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'capitalize',
                    }}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Math header */}
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 8,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border.divider,
                marginBottom: 4,
              }}
            >
              <Text
                style={{ flex: 2, color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}
              >
                DIMENSION
              </Text>
              <Text
                style={{ width: 50, color: colors.text.tertiary, fontSize: 10, fontWeight: '700', textAlign: 'right' }}
              >
                SCORE
              </Text>
              <Text
                style={{ width: 50, color: colors.text.tertiary, fontSize: 10, fontWeight: '700', textAlign: 'right' }}
              >
                WEIGHT
              </Text>
              <Text
                style={{ width: 60, color: colors.text.tertiary, fontSize: 10, fontWeight: '700', textAlign: 'right' }}
              >
                POINTS
              </Text>
            </View>

            {/* Rows */}
            {Object.keys(weights).map((dim, idx) => {
              const s = (breakdown as any)[dim] ?? 0;
              const w = (weights as any)[dim];
              const c = contributions[dim];
              const barW = (c / maxContribution) * 100;
              const points = c * 100;
              return (
                <MotiView
                  key={dim}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 250, delay: idx * 50 }}
                  style={{ paddingVertical: 8, gap: 4 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 2, color: colors.text.primary, fontSize: 13, fontWeight: '600' }}>
                      {DIM_LABELS[dim]?.[lang === 'ur' ? 'ur' : 'en'] || dim}
                    </Text>
                    <Text
                      style={{ width: 50, color: colors.text.secondary, fontSize: 13, fontWeight: '600', textAlign: 'right' }}
                    >
                      {s.toFixed(2)}
                    </Text>
                    <Text
                      style={{ width: 50, color: colors.text.secondary, fontSize: 13, fontWeight: '600', textAlign: 'right' }}
                    >
                      {Math.round(w * 100)}%
                    </Text>
                    <Text
                      style={{
                        width: 60,
                        color: colors.brand.textAccent,
                        fontSize: 13,
                        fontWeight: '800',
                        textAlign: 'right',
                      }}
                    >
                      {points.toFixed(1)}
                    </Text>
                  </View>
                  {/* Bar */}
                  <View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.bg.elevated,
                      overflow: 'hidden',
                    }}
                  >
                    <MotiView
                      from={{ width: '0%' as any }}
                      animate={{ width: `${barW}%` as any }}
                      transition={{ type: 'timing', duration: 600, delay: idx * 50 + 100 }}
                      style={{
                        height: '100%',
                        backgroundColor: colors.brand.accent,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </MotiView>
              );
            })}

            {/* Total row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 0.5,
                borderTopColor: colors.border.divider,
              }}
            >
              <Text style={{ flex: 2, color: colors.text.primary, fontSize: 14, fontWeight: '800' }}>
                {lang === 'ur' ? 'TOTAL' : 'TOTAL'}
              </Text>
              <Text
                style={{ width: 50, color: colors.text.tertiary, fontSize: 13, fontWeight: '700', textAlign: 'right' }}
              ></Text>
              <Text
                style={{ width: 50, color: colors.text.tertiary, fontSize: 13, fontWeight: '700', textAlign: 'right' }}
              >
                100%
              </Text>
              <Text
                style={{
                  width: 60,
                  color: colors.brand.textAccent,
                  fontSize: 16,
                  fontWeight: '800',
                  textAlign: 'right',
                }}
              >
                {(total * 100).toFixed(1)}
              </Text>
            </View>

            {/* Footnote */}
            <View
              style={{
                marginTop: spacing.lg,
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: colors.bg.surfaceSolid,
              }}
            >
              <Text style={{ color: colors.text.tertiary, fontSize: 11, lineHeight: 16 }}>
                {lang === 'ur'
                  ? `Yeh literal scoring math hai jo Ranking Agent (Agent 3) ne use kiya. Har dimension normalized score [0-1] × weight = points contribution. Total 100 par. ${
                      urgency === 'emergency'
                        ? 'Emergency mein distance ka weight 50% ho jata hai.'
                        : urgency === 'urgent'
                        ? 'Urgent mein distance ka weight badh ke 35% ho jata hai.'
                        : 'Normal urgency ke standard weights.'
                    }`
                  : `This is the literal scoring math used by the Ranking Agent (Agent 3). Each dimension's normalized score [0-1] × weight = contribution. Sum is out of 100. ${
                      urgency === 'emergency'
                        ? 'In emergency mode, distance jumps to 50% weight.'
                        : urgency === 'urgent'
                        ? 'Urgent mode raises distance weight to 35%.'
                        : 'Standard weights for normal urgency.'
                    }`}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
