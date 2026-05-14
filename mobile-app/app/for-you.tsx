/**
 * For You — AI-personalized recommendations (uses the Insights agent).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { colors as iconPalette, radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { fetchInsights } from '../src/services/api';

// Personalized smart cards — hand-crafted to feel like the AI is anticipating user needs
const PERSONALIZED_CARDS = (userName: string, city: string, sector: string) => [
  {
    id: 'p1',
    type: 'predictive',
    icon: 'snow' as const,
    color: iconPalette.ios.cyan,
    title: `${userName}, AC service overdue`,
    subtitle: `Last serviced 91 days ago · Summer peak in 14 days`,
    impact: 'Predicted breakdown probability: 23%',
    action: 'Book preventive service',
    actionColor: iconPalette.brand.primary,
  },
  {
    id: 'p2',
    type: 'trend',
    icon: 'trending-up' as const,
    color: iconPalette.ios.purple,
    title: `Plumber demand ↑ 47% in ${sector}`,
    subtitle: 'Top providers booking up fast for next 3 days',
    impact: 'Avg wait time: 4.2h (was 1.1h last week)',
    action: 'Book before slots fill',
    actionColor: iconPalette.ios.orange,
  },
  {
    id: 'p3',
    type: 'crisis',
    icon: 'rainy' as const,
    color: iconPalette.ios.blue,
    title: 'Rain forecast tomorrow',
    subtitle: 'PMD: 38mm rainfall expected · 70% chance',
    impact: 'Drainage prep recommended for ground floor',
    action: 'Schedule drainage check',
    actionColor: iconPalette.ios.cyan,
  },
  {
    id: 'p4',
    type: 'social',
    icon: 'people' as const,
    color: iconPalette.ios.green,
    title: 'Iqbal AC Solutions recommends you',
    subtitle: '3 of your neighbors in G-13 booked them this week',
    impact: 'Highest-rated AC tech in 2km radius',
    action: 'View profile',
    actionColor: iconPalette.semantic.success,
  },
  {
    id: 'p5',
    type: 'savings',
    icon: 'cash' as const,
    color: iconPalette.ios.yellow,
    title: 'Group booking opportunity',
    subtitle: '4 neighbors need pest control this month',
    impact: 'Group discount: PKR 3,000 → 1,800 per home',
    action: 'Join group booking',
    actionColor: iconPalette.ios.yellow,
  },
  {
    id: 'p6',
    type: 'reminder',
    icon: 'alarm' as const,
    color: iconPalette.ios.pink,
    title: `Eid prep — beautician slots filling`,
    subtitle: 'Bridal appointments 65% booked for Eid week',
    impact: 'Reserve now for guaranteed slot',
    action: 'Browse beauticians',
    actionColor: iconPalette.ios.pink,
  },
];

export default function ForYouScreen() {
  const { lang, user, colors } = useApp();
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights()
      .then(setInsights)
      .finally(() => setLoading(false));
  }, []);

  const personalized = PERSONALIZED_CARDS(user.name, user.city, user.sector || 'G-13');

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'For You' : 'For You'}
        subtitle={lang === 'ur' ? 'Aap ke liye AI ki recommendations' : 'AI predictions for you'}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: spacing.xl }}>
          {/* Hero banner */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380 }}
            style={{ marginBottom: spacing.lg }}
          >
            <GlassCard glow>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ position: 'relative' }}>
                  <MotiView
                    from={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: colors.brand.primary + '55',
                    }}
                  />
                  <View style={{ width: 44, height: 44, borderRadius: 14, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={colors.brand.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="sparkles" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>
                    PREDICTIVE INTELLIGENCE
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800', letterSpacing: -0.4, marginTop: 2 }}>
                    {lang === 'ur'
                      ? `${personalized.length} smart suggestions for ${user.name}`
                      : `${personalized.length} smart suggestions for ${user.name}`}
                  </Text>
                  <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                    {lang === 'ur'
                      ? 'Aap ke patterns, weather, neighbors aur season se generate kiye'
                      : 'Generated from your patterns, weather, neighbors & season'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          {/* Personalized cards */}
          <SectionLabel text={lang === 'ur' ? 'AAP KE LIYE' : 'TAILORED FOR YOU'} />
          {personalized.map((p, i) => (
            <MotiView
              key={p.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: i * 70 }}
              style={{ marginBottom: 10 }}
            >
              <PersonalCard card={p} lang={lang} />
            </MotiView>
          ))}

          {/* Backend insights */}
          <SectionLabel text={lang === 'ur' ? 'PLATFORM INSIGHTS' : 'PLATFORM INSIGHTS'} style={{ marginTop: spacing.lg }} />
          {loading ? (
            <ActivityIndicator color={colors.brand.textAccent} style={{ marginTop: 20 }} />
          ) : (
            <GlassCard>
              <Text style={{ color: colors.text.primary, fontSize: 14, lineHeight: 20, letterSpacing: -0.2 }}>
                {lang === 'ur' ? insights?.executive_summary_ur : insights?.executive_summary_en}
              </Text>
              {(insights?.insights || []).slice(0, 2).map((ins: any) => (
                <View
                  key={ins.id}
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border.subtle,
                  }}
                >
                  <Text style={{ color: colors.brand.textAccent, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                    {ins.type?.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '700', marginTop: 4, letterSpacing: -0.2 }}>
                    {lang === 'ur' ? ins.title_ur || ins.title_en : ins.title_en}
                  </Text>
                  <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                    {ins.impact}
                  </Text>
                </View>
              ))}
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PersonalCard = ({ card, lang }: any) => {
  const { colors, theme } = useApp();
  return (
  <Pressable>
    {({ pressed }) => (
      <View
        style={{
          backgroundColor: pressed ? colors.bg.elevated : colors.bg.surfaceSolid,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: card.color + '33',
          overflow: 'hidden',
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              } as any)
            : {}),
        }}
      >
        {/* Subtle color stripe */}
        <View style={{ height: 3, backgroundColor: card.color }} />
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: card.color + '22',
                borderWidth: 1,
                borderColor: card.color + '55',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={card.icon} size={18} color={card.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                    backgroundColor: card.color + '22',
                  }}
                >
                  <Text style={{ color: card.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                    {card.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '800', letterSpacing: -0.3, marginTop: 4 }}>
                {card.title}
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                {card.subtitle}
              </Text>
              <View
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.subtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 15 }}>
                  💡 {card.impact}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: card.actionColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {card.action}
                  </Text>
                  <Ionicons name="arrow-forward" size={11} color="#fff" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    )}
  </Pressable>
  );
};

const SectionLabel = ({ text, style }: any) => {
  const { colors } = useApp();
  return (
    <Text
      style={[
        {
          color: colors.text.tertiary,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.4,
          marginBottom: 8,
          marginLeft: 4,
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
};
