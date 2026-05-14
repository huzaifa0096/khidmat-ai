/**
 * Provider Detail — hero photo, name+rating, About, See More Photos, Book Now.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useApp } from '../../src/state/AppContext';
import { radii, spacing } from '../../src/theme/colors';
import { confirmBooking, parseAndRank, createDirectBooking } from '../../src/services/api';
import { getProviderImage, getServicePortfolio } from '../../src/utils/providerImage';


export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { lang, currentTrace, setCurrentBooking, user, colors, theme } = useApp();
  const isDark = theme === 'dark';
  const [booking, setBooking] = useState(false);

  // Find matching provider from currentTrace.ranking.top_3
  const top = currentTrace?.ranking?.top_3 || [];
  const data = top.find((t: any) => t.provider_id === id) || top[0];

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, marginTop: 12 }}>
            Provider not found
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: radii.pill,
              backgroundColor: colors.brand.primary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const p = data.provider;
  const reasoning = lang === 'ur' ? data.reasoning_ur : data.reasoning_en;

  const handleBook = async () => {
    setBooking(true);

    // Sanitised payload — only the fields backend expects (no extra UI fields).
    const userPayload = {
      id: user?.id || 'U001',
      name: user?.name || 'Demo User',
      phone: user?.phone || '0300-1234567',
    };
    const provId = p?.id || (id as string);

    if (!provId) {
      setBooking(false);
      Alert.alert(lang === 'ur' ? 'Booking nahi ho saki' : 'Booking Failed', 'Provider not found');
      return;
    }

    // Path 1: existing trace
    const tryWithTrace = async (tid?: string) => {
      if (!tid) return null;
      try {
        const res = await confirmBooking(tid, provId, userPayload);
        if (res && !res.error) return res;
      } catch {}
      return null;
    };

    // Path 2: synthesise a fresh trace, then confirm
    const tryFreshTrace = async () => {
      try {
        const synthInput =
          lang === 'ur'
            ? `${(p?.primary_service || 'service').replace(/_/g, ' ')} chahiye ${p?.sector || 'G-13'} mein`
            : `Need ${(p?.primary_service || 'service').replace(/_/g, ' ')} in ${p?.sector || 'G-13'}`;
        const fresh = await parseAndRank(synthInput, userPayload.id);
        if (fresh?.trace_id) {
          const res = await confirmBooking(fresh.trace_id, provId, userPayload);
          if (res && !res.error) return res;
        }
      } catch {}
      return null;
    };

    // Path 3: direct /api/bookings endpoint — bypasses the trace entirely.
    const tryDirectBooking = async () => {
      try {
        const intent = {
          service_category_id: p?.primary_service || 'plumber',
          location: {
            city: p?.city || user?.city || 'islamabad',
            sector: p?.sector || user?.sector || 'G-13',
          },
          time: { preference: 'now' },
          urgency: 'normal',
          language_detected: lang === 'ur' ? 'roman_urdu' : 'english',
        };
        const res = await createDirectBooking({
          provider_id: provId,
          user: userPayload,
          intent,
          time_preference: 'now',
        });
        // Direct endpoint returns the booking object directly (not wrapped in {booking})
        if (res && !res.error && res.booking_id) {
          // Shape it to match what booking-confirmed expects
          return { booking: res };
        }
      } catch {}
      return null;
    };

    try {
      let result =
        (await tryWithTrace(currentTrace?.trace_id)) ||
        (await tryFreshTrace()) ||
        (await tryDirectBooking());

      if (!result) {
        throw new Error(lang === 'ur' ? 'Phir try karein' : 'Please try again');
      }

      setCurrentBooking(result);
      router.push('/booking-confirmed');
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Booking nahi ho saki' : 'Booking Failed',
        e?.message || (lang === 'ur' ? 'Phir try karein' : 'Please try again')
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: getProviderImage(p) }}
            style={{ width: '100%', height: 320, backgroundColor: colors.bg.elevated }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
          />

          {/* Top nav */}
          <View
            style={{
              position: 'absolute',
              top: spacing.md,
              left: spacing.md,
              right: spacing.md,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={20} color="#000" />
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'rgba(255,255,255,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="bookmark-outline" size={18} color="#000" />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: -28 }}>
          {/* Header card */}
          <View
            style={{
              backgroundColor: colors.bg.surfaceSolid,
              borderRadius: radii.xl,
              padding: 18,
              borderWidth: isDark ? 0.5 : 1,
              borderColor: colors.border.divider,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 22,
                    fontWeight: '800',
                    letterSpacing: -0.5,
                  }}
                >
                  {p.business_name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Ionicons name="location" size={13} color={colors.text.tertiary} />
                  <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>
                    {data.distance_km.toFixed(1)} km · {p.sector}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="star" size={15} color="#FFC900" />
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 16,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                    }}
                  >
                    {p.rating}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 17,
                    fontWeight: '800',
                    marginTop: 6,
                    letterSpacing: -0.4,
                  }}
                >
                  {p.price_range?.split('-')[0] || 'PKR 1500'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>est. price</Text>
              </View>
            </View>
          </View>

          {/* Trust + Pricing strip */}
          {(data.trust || data.pricing) ? (
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginTop: 10,
              }}
            >
              {data.trust ? (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg.surfaceSolid,
                    borderRadius: radii.lg,
                    padding: 12,
                    borderWidth: isDark ? 0.5 : 1,
                    borderColor: colors.border.divider,
                  }}
                >
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.4 }}>
                    TRUST SCORE
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 19, fontWeight: '800', marginTop: 4 }}>
                    {data.trust.score}
                    <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>/100</Text>
                  </Text>
                  <Text style={{ color: colors.brand.textAccent, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                    {data.trust.tier_label}
                  </Text>
                </View>
              ) : null}
              {data.pricing ? (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg.surfaceSolid,
                    borderRadius: radii.lg,
                    padding: 12,
                    borderWidth: isDark ? 0.5 : 1,
                    borderColor: colors.border.divider,
                  }}
                >
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600', letterSpacing: 0.4 }}>
                    AI ESTIMATE
                  </Text>
                  <Text style={{ color: colors.text.primary, fontSize: 19, fontWeight: '800', marginTop: 4 }}>
                    PKR {data.pricing.final_pkr?.toLocaleString?.()}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                    {data.pricing.urgency} · {data.pricing.distance_km}km
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* About */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: spacing.xl,
            }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 17,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {lang === 'ur' ? 'About' : 'About Me'}
            </Text>
            <Pressable
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.bg.surfaceSolid,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isDark ? 0.5 : 1,
                borderColor: colors.border.divider,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.text.primary} />
            </Pressable>
          </View>
          <Text
            style={{
              color: colors.text.secondary,
              fontSize: 13,
              lineHeight: 19,
              marginTop: 8,
              letterSpacing: -0.1,
            }}
          >
            {reasoning}{' '}
            <Text style={{ color: colors.brand.textAccent, fontWeight: '600' }}>See More</Text>
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.lg }}>
            <Stat label="Reviews" value={p.reviews_count} colors={colors} />
            <Stat label="Years" value={p.experience_years} colors={colors} />
            <Stat
              label="Completed"
              value={`${p.completion_rate_percent}%`}
              colors={colors}
            />
          </View>

          {/* See More Photos */}
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 17,
              fontWeight: '700',
              letterSpacing: -0.3,
              marginTop: spacing.xl,
              marginBottom: 12,
            }}
          >
            {lang === 'ur' ? 'See More Photos' : 'See More Photos'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {getServicePortfolio(p).map((url, i) => (
              <Image
                key={i}
                source={{ uri: url }}
                style={{
                  width: 160,
                  height: 110,
                  borderRadius: radii.md,
                  backgroundColor: colors.bg.elevated,
                }}
              />
            ))}
          </ScrollView>

          {/* Highlight badges */}
          {data.highlight_badges?.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.lg }}>
              {data.highlight_badges.map((b: string) => (
                <View
                  key={b}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radii.pill,
                    backgroundColor: colors.bg.elevated,
                  }}
                >
                  <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '600' }}>
                    {b}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Book Now */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.lg,
          backgroundColor: colors.bg.primary,
          borderTopWidth: isDark ? 0.5 : 1,
          borderTopColor: colors.border.divider,
        }}
      >
        <Pressable onPress={handleBook} disabled={booking}>
          {({ pressed }) => (
            <View
              style={{
                paddingVertical: 16,
                borderRadius: radii.pill,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                opacity: pressed || booking ? 0.75 : 1,
              }}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}>
                    {lang === 'ur' ? 'Book Now' : 'Book Now'}
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color="#fff" />
                </>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const Stat = ({ label, value, colors }: any) => (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.surfaceSolid,
      borderRadius: radii.md,
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: colors.border.divider,
    }}
  >
    <Text style={{ color: colors.text.primary, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 }}>
      {value}
    </Text>
    <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
      {label}
    </Text>
  </View>
);
