/**
 * Live Provider Tracking — Uber-style screen showing the provider's
 * simulated position moving toward the customer's location. Polls the
 * backend every 2 seconds for fresh position + ETA + distance.
 *
 * Uses the existing RealMap (Leaflet WebView) component which is already
 * proven on Android + iOS + Web.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../../src/state/AppContext';
import { radii, spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { RealMap } from '../../src/components/RealMap';
import { fetchTracking } from '../../src/services/api';

export default function TrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, lang } = useApp();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const poll = async () => {
      try {
        const data = await fetchTracking(id as string);
        if (!mounted) return;
        if (data?.error) {
          setError(data.error);
        } else {
          setTracking(data);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Connection failed');
      }
      if (mounted) setLoading(false);
    };
    poll();
    const intv = setInterval(poll, 2500);
    return () => {
      mounted = false;
      clearInterval(intv);
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Live Tracking' : 'Live Tracking'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.brand.textAccent} size="large" />
          <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
            {lang === 'ur' ? 'Provider ki position load ho rahi hai...' : 'Loading provider position...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tracking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Live Tracking' : 'Live Tracking'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 12 }}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
            {lang === 'ur' ? 'Tracking shuru nahi ho saki' : 'Cannot start tracking'}
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
            {error || 'Booking ID not found'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: radii.pill,
              backgroundColor: colors.brand.primary,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {lang === 'ur' ? 'Wapas' : 'Go Back'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { customer, provider, status, eta_minutes, distance_km, progress } = tracking;

  // Markers for the map: provider (orange) + customer (purple)
  const markers = [
    {
      id: 'provider',
      lat: provider.lat,
      lng: provider.lng,
      label: provider.business_name,
      color: '#f05423',
    },
    {
      id: 'customer',
      lat: customer.lat,
      lng: customer.lng,
      label: lang === 'ur' ? 'Aap yahaan hain' : 'Your location',
      color: '#3e003f',
    },
  ];

  // Calculate map center between provider and customer
  const centerLat = (provider.lat + customer.lat) / 2;
  const centerLng = (provider.lng + customer.lng) / 2;

  const statusBadgeColor =
    status === 'arrived'
      ? colors.semantic.success
      : status === 'en_route'
      ? colors.brand.accent
      : colors.text.tertiary;
  const statusLabel =
    status === 'arrived'
      ? lang === 'ur'
        ? 'Pohunch gaye'
        : 'Arrived'
      : status === 'en_route'
      ? lang === 'ur'
        ? 'Raaste mein'
        : 'En route'
      : status === 'completed'
      ? lang === 'ur'
        ? 'Complete'
        : 'Completed'
      : lang === 'ur'
      ? 'Shuru nahi hua'
      : 'Not started';

  const handleCall = () => {
    if (provider.phone) {
      Linking.openURL(`tel:${provider.phone}`).catch(() => {});
    }
  };

  const handleChat = () => {
    router.push(`/chat/${id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Live Tracking' : 'Live Tracking'}
        subtitle={id as string}
      />

      {/* Map area */}
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1 }}>
          <RealMap
            center={{ lat: centerLat, lng: centerLng }}
            zoom={14}
            markers={markers}
          />
        </View>

        {/* Status pill (top-center) */}
        <View
          style={{
            position: 'absolute',
            top: 12,
            alignSelf: 'center',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: colors.bg.primary,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <MotiView
            from={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusBadgeColor }}
          />
          <Text style={{ color: statusBadgeColor, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
            {statusLabel.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Bottom info card */}
      <View
        style={{
          backgroundColor: colors.bg.primary,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.lg,
          paddingTop: spacing.md,
          gap: spacing.md,
        }}
      >
        {/* Provider info row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {provider.profile_image ? (
            <Image
              source={{ uri: provider.profile_image }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.bg.elevated,
              }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.brand.primary + '22',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={22} color={colors.brand.textAccent} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 }}>
              {provider.business_name}
            </Text>
            <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
              {provider.phone || '—'}
            </Text>
          </View>
        </View>

        {/* ETA + distance row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid, alignItems: 'center' }}>
            <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
              {lang === 'ur' ? 'ETA' : 'ETA'}
            </Text>
            <Text
              style={{
                color: colors.brand.textAccent,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginTop: 2,
              }}
            >
              {eta_minutes}
              <Text style={{ fontSize: 13, color: colors.text.tertiary, fontWeight: '600' }}> min</Text>
            </Text>
          </View>
          <View style={{ flex: 1, padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid, alignItems: 'center' }}>
            <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
              {lang === 'ur' ? 'DISTANCE' : 'DISTANCE'}
            </Text>
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginTop: 2,
              }}
            >
              {distance_km.toFixed(1)}
              <Text style={{ fontSize: 13, color: colors.text.tertiary, fontWeight: '600' }}> km</Text>
            </Text>
          </View>
          <View style={{ flex: 1, padding: 12, borderRadius: radii.lg, backgroundColor: colors.bg.surfaceSolid, alignItems: 'center' }}>
            <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }}>
              {lang === 'ur' ? 'PROGRESS' : 'PROGRESS'}
            </Text>
            <Text
              style={{
                color: colors.semantic.success,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                marginTop: 2,
              }}
            >
              {Math.round(progress * 100)}
              <Text style={{ fontSize: 13, color: colors.text.tertiary, fontWeight: '600' }}>%</Text>
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.bg.elevated,
            overflow: 'hidden',
          }}
        >
          <MotiView
            from={{ width: '0%' as any }}
            animate={{ width: `${Math.round(progress * 100)}%` as any }}
            transition={{ type: 'timing', duration: 600 }}
            style={{
              height: '100%',
              backgroundColor: colors.brand.accent,
            }}
          />
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={handleChat}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: radii.pill,
              backgroundColor: colors.bg.elevated,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="chatbubbles" size={14} color={colors.text.primary} />
            <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700' }}>
              {lang === 'ur' ? 'Chat' : 'Chat'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCall}
            disabled={!provider.phone}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: radii.pill,
              backgroundColor: colors.brand.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="call" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
              {lang === 'ur' ? 'Call' : 'Call'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
