/**
 * Results — Apple-style top-3 + AI voice narration on landing.
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Alert, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { ProviderCard } from '../src/components/ProviderCard';
import { GradientButton } from '../src/components/GradientButton';
import { GlassCard } from '../src/components/GlassCard';
import { confirmBooking } from '../src/services/api';

export default function ResultsScreen() {
  const router = useRouter();
  const { lang, t, currentTrace, user, setCurrentBooking, colors } = useApp();
  const [booking, setBooking] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [muted, setMuted] = useState(false);
  const spokenRef = useRef(false);

  if (!currentTrace) return null;

  const top3 = currentTrace.ranking?.top_3 || [];
  const decisionSummary =
    lang === 'ur'
      ? currentTrace.ranking?.decision_summary_ur
      : currentTrace.ranking?.decision_summary_en;

  // AI voice narration on mount
  useEffect(() => {
    if (spokenRef.current || muted || !decisionSummary) return;
    spokenRef.current = true;
    setNarrating(true);

    // Web uses browser SpeechSynthesis; native uses expo-speech.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new (window as any).SpeechSynthesisUtterance(decisionSummary);
        utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
        utter.rate = 1.02;
        utter.pitch = 1;
        utter.volume = 0.9;
        utter.onend = () => setNarrating(false);
        utter.onerror = () => setNarrating(false);
        (window as any).speechSynthesis.cancel();
        (window as any).speechSynthesis.speak(utter);
      } catch {
        setNarrating(false);
      }
    } else {
      try {
        Speech.speak(decisionSummary, {
          language: lang === 'ur' ? 'ur' : 'en',
          rate: 1.0,
          onDone: () => setNarrating(false),
          onError: () => setNarrating(false),
          onStopped: () => setNarrating(false),
        });
      } catch {
        setNarrating(false);
      }
    }

    return () => {
      try {
        if (Platform.OS === 'web' && (window as any).speechSynthesis) {
          (window as any).speechSynthesis.cancel();
        } else {
          Speech.stop();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionSummary]);

  const toggleNarration = () => {
    if (narrating) {
      try {
        if (Platform.OS === 'web' && (window as any).speechSynthesis) {
          (window as any).speechSynthesis.cancel();
        } else {
          Speech.stop();
        }
      } catch {}
      setNarrating(false);
      return;
    }
    setMuted(false);
    spokenRef.current = false;
    // re-trigger by toggling a state — simplest: directly call speak
    if (decisionSummary) {
      if (Platform.OS === 'web' && (window as any).SpeechSynthesisUtterance) {
        const utter = new (window as any).SpeechSynthesisUtterance(decisionSummary);
        utter.lang = lang === 'ur' ? 'ur-PK' : 'en-US';
        utter.rate = 1.02;
        utter.onend = () => setNarrating(false);
        utter.onerror = () => setNarrating(false);
        (window as any).speechSynthesis.cancel();
        (window as any).speechSynthesis.speak(utter);
      } else {
        Speech.speak(decisionSummary, {
          language: lang === 'ur' ? 'ur' : 'en',
          onDone: () => setNarrating(false),
        });
      }
      setNarrating(true);
    }
  };

  const handleBook = async (providerId: string) => {
    setBooking(true);
    try {
      const data = await confirmBooking(currentTrace.trace_id, providerId, user);
      setCurrentBooking(data);
      router.push('/booking-confirmed');
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.message || 'Try again');
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={t.results.title} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Decision summary with AI voice narration */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 380 }}
        >
          <GlassCard glow={narrating}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {narrating ? (
                  <MotiView
                    from={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1400, loop: true }}
                    style={{
                      position: 'absolute',
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: colors.brand.primary + '88',
                    }}
                  />
                ) : null}
                <LinearGradient
                  colors={colors.brand.gradient}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      color: colors.text.tertiary,
                      fontSize: 11,
                      fontWeight: '700',
                      letterSpacing: 1.2,
                    }}
                  >
                    {lang === 'ur' ? 'AI KA FAISLA' : 'AI DECISION'}
                    {narrating
                      ? lang === 'ur'
                        ? ' · 🔊 BOL RAHA HUN...'
                        : ' · 🔊 SPEAKING...'
                      : ''}
                  </Text>
                  <Pressable
                    onPress={toggleNarration}
                    style={({ pressed }) => ({
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: narrating
                        ? colors.brand.primary
                        : colors.bg.surfaceSolid,
                      borderWidth: 1,
                      borderColor: narrating
                        ? colors.brand.primary
                        : colors.border.subtle,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Ionicons
                      name={narrating ? 'volume-high' : 'volume-medium-outline'}
                      size={14}
                      color={narrating ? '#fff' : colors.text.secondary}
                    />
                  </Pressable>
                </View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 4,
                    letterSpacing: -0.2,
                  }}
                >
                  {decisionSummary}
                </Text>
                {narrating ? (
                  <View style={{ flexDirection: 'row', gap: 3, marginTop: 8, alignItems: 'center' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <MotiView
                        key={i}
                        from={{ scaleY: 0.3 }}
                        animate={{ scaleY: 1.2 }}
                        transition={{
                          type: 'timing',
                          duration: 360,
                          loop: true,
                          repeatReverse: true,
                          delay: i * 70,
                        }}
                        style={{
                          width: 3,
                          height: 14,
                          borderRadius: 1.5,
                          backgroundColor: colors.brand.primary,
                        }}
                      />
                    ))}
                    <Text
                      style={{
                        color: colors.brand.textAccent,
                        fontSize: 10,
                        fontWeight: '700',
                        marginLeft: 8,
                        letterSpacing: 0.5,
                      }}
                    >
                      {lang === 'ur' ? 'ur-PK · KHIDMAT AI VOICE' : 'en-US · KHIDMAT AI VOICE'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Intent context strip */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginVertical: spacing.xs,
          }}
        >
          <Tag
            label={currentTrace.intent?.service_category_id?.replace(/_/g, ' ')}
            icon="construct-outline"
          />
          <Tag
            label={`${currentTrace.intent?.location?.sector || ''}, ${
              currentTrace.intent?.location?.city || ''
            }`}
            icon="location-outline"
          />
          <Tag
            label={currentTrace.intent?.time?.preference?.replace(/_/g, ' ')}
            icon="time-outline"
          />
          {currentTrace.intent?.urgency !== 'normal' ? (
            <Tag
              label={currentTrace.intent.urgency}
              icon="warning-outline"
              color={
                currentTrace.intent.urgency === 'emergency'
                  ? colors.semantic.danger
                  : colors.semantic.warning
              }
            />
          ) : null}
        </View>

        {/* Pricing Engine breakdown — for the top match */}
        {currentTrace?.ranking?.pricing_top_match ? (
          <PricingBreakdownCard pricing={currentTrace.ranking.pricing_top_match} lang={lang} />
        ) : null}

        {/* Cards — tap to view detail */}
        {top3.map((p: any, i: number) => (
          <ProviderCard
            key={p.provider_id}
            rank={p.rank}
            data={p}
            lang={lang}
            index={i}
            onPress={() => router.push(`/provider/${p.provider_id}`)}
          />
        ))}

        {/* Hero CTA — view detail (or instant book) */}
        {top3.length > 0 ? (
          <GradientButton
            label={lang === 'ur' ? 'Top Provider Dekhein' : 'View Top Provider'}
            icon="eye"
            onPress={() => router.push(`/provider/${top3[0].provider_id}`)}
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const Tag = ({ label, icon, color }: any) => {
  const { colors } = useApp();
  const resolvedColor = color || colors.text.secondary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.bg.surfaceSolid,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.border.subtle,
      }}
    >
      <Ionicons name={icon} size={11} color={resolvedColor} />
      <Text
        style={{ color: resolvedColor, fontSize: 11, fontWeight: '600', letterSpacing: -0.1, textTransform: 'capitalize' }}
      >
        {label}
      </Text>
    </View>
  );
};

const PricingBreakdownCard = ({ pricing, lang }: { pricing: any; lang: 'ur' | 'en' }) => {
  const { colors, theme } = useApp();
  if (!pricing) return null;
  const isDark = theme === 'dark';
  const fmt = (n: number) => Math.abs(n).toLocaleString();
  return (
    <GlassCard>
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.6,
          marginBottom: 12,
        }}
      >
        {lang === 'ur' ? 'PRICING BREAKDOWN' : 'PRICING BREAKDOWN'}
      </Text>
      {(pricing.breakdown_lines || []).map((line: any, i: number) => {
        const negative = line.value_pkr < 0;
        const dim = line.value_pkr === 0;
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: i < pricing.breakdown_lines.length - 1 ? 0.5 : 0,
              borderBottomColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 14,
                  fontWeight: '400',
                  letterSpacing: -0.2,
                }}
              >
                {line.label}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                {line.detail}
              </Text>
            </View>
            <Text
              style={{
                color: dim ? colors.text.tertiary : colors.text.primary,
                fontSize: 14,
                fontWeight: '500',
                letterSpacing: -0.2,
              }}
            >
              {negative ? '−' : ''}PKR {fmt(line.value_pkr)}
            </Text>
          </View>
        );
      })}
      <View
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '600' }}>
          {lang === 'ur' ? 'Customer pays' : 'Customer pays'}
        </Text>
        <Text
          style={{
            color: colors.text.primary,
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: -0.5,
          }}
        >
          PKR {pricing.final_pkr?.toLocaleString?.()}
        </Text>
      </View>
    </GlassCard>
  );
};
