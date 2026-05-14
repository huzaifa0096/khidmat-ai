/**
 * Live Provider Map — real interactive map (Leaflet/Google Maps).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../src/state/AppContext';
import { colors as iconPalette, radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { RealMap } from '../src/components/RealMap';
import { fetchServices, fetchCities, api } from '../src/services/api';

const CATEGORY_COLORS: Record<string, string> = {
  ac_technician: iconPalette.ios.cyan,
  plumber: iconPalette.ios.blue,
  electrician: iconPalette.ios.yellow,
  carpenter: '#A1887F',
  painter: iconPalette.ios.red,
  cleaner: iconPalette.ios.green,
  tutor: iconPalette.ios.purple,
  beautician: iconPalette.ios.pink,
  mobile_repair: iconPalette.ios.mint,
  car_mechanic: iconPalette.ios.indigo,
};

export default function MapScreen() {
  const { lang, user, colors } = useApp();
  const [selectedCity, setSelectedCity] = useState(user.city || 'islamabad');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedProvider, setPinnedProvider] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, s] = await Promise.all([fetchCities(), fetchServices()]);
        setCities(c.cities || []);
        setCategories(s.categories || []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get('/api/providers', {
        params: { city: selectedCity, limit: 200, ...(selectedCat ? { category: selectedCat } : {}) },
      })
      .then((r) => {
        if (mounted) setProviders(r.data.providers || []);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [selectedCity, selectedCat]);

  const cityData = cities.find((c) => c.id === selectedCity);

  const center = useMemo(() => {
    if (cityData?.center) return cityData.center;
    if (providers.length > 0) return providers[0].location;
    return { lat: 33.6844, lng: 73.0479 };
  }, [cityData, providers]);

  const userLocation = useMemo(() => {
    if (!cityData) return null;
    const sec = cityData.sectors?.find((s: any) => s.id === user.sector);
    return sec ? { lat: sec.lat, lng: sec.lng } : cityData.center;
  }, [cityData, user.sector]);

  const markers = useMemo(
    () =>
      providers.slice(0, 100).map((p) => ({
        id: p.id,
        lat: p.location.lat,
        lng: p.location.lng,
        color: CATEGORY_COLORS[p.primary_service] || colors.brand.primary,
        label: p.business_name,
        subtitle: `${p.primary_service.replace(/_/g, ' ')} · ${p.rating}★ · ${p.sector}`,
      })),
    [providers]
  );

  const handleMarkerPress = (id: string) => {
    const p = providers.find((x) => x.id === id);
    if (p) setPinnedProvider(p);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Live Provider Map' : 'Live Provider Map'}
        subtitle={`${providers.length} providers in ${cityData?.name_en || ''}`}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 560, paddingHorizontal: spacing.xl }}>
          {/* City selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            style={{ marginBottom: spacing.md }}
          >
            {cities.map((c) => {
              const active = selectedCity === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setSelectedCity(c.id);
                    setPinnedProvider(null);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? colors.brand.primary : colors.bg.surfaceSolid,
                    borderWidth: 1,
                    borderColor: active ? colors.brand.primary : colors.border.default,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: active ? '#fff' : colors.text.primary,
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                    }}
                  >
                    {c.name_en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Category filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
            style={{ marginBottom: spacing.md }}
          >
            <Pressable
              onPress={() => {
                setSelectedCat(null);
                setPinnedProvider(null);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: !selectedCat ? colors.brand.primary + '22' : colors.bg.surfaceSolid,
                borderWidth: 1,
                borderColor: !selectedCat ? colors.brand.primary : colors.border.subtle,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: !selectedCat ? colors.brand.primary : colors.text.secondary,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                All
              </Text>
            </Pressable>
            {categories.slice(0, 12).map((c: any) => {
              const color = CATEGORY_COLORS[c.id] || colors.brand.primary;
              const active = selectedCat === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setSelectedCat(active ? null : c.id);
                    setPinnedProvider(null);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? color + '33' : colors.bg.surfaceSolid,
                    borderWidth: 1,
                    borderColor: active ? color : colors.border.subtle,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: active ? color : colors.text.secondary, fontSize: 11, fontWeight: '700' }}>
                    {c.name_en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Real Map */}
          <GlassCard padded={false}>
            <View style={{ position: 'relative' }}>
              <RealMap
                center={center}
                zoom={12}
                markers={markers}
                userLocation={userLocation}
                onMarkerPress={handleMarkerPress}
                height={420}
              />

              {/* Loading overlay */}
              {loading && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(6,7,13,0.5)',
                    borderRadius: radii.lg,
                  }}
                >
                  <ActivityIndicator color={colors.brand.textAccent} />
                </View>
              )}

              {/* Stats overlay */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  backgroundColor: 'rgba(6,7,13,0.75)',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MotiView
                  from={{ opacity: 1 }}
                  animate={{ opacity: 0.3 }}
                  transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.semantic.success }}
                />
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.4,
                  }}
                >
                  {markers.length} LIVE
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Pinned provider details */}
          {pinnedProvider && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 280 }}
              style={{ marginTop: spacing.md }}
            >
              <GlassCard glow>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: (CATEGORY_COLORS[pinnedProvider.primary_service] || colors.brand.primary) + '33',
                      borderWidth: 1,
                      borderColor: CATEGORY_COLORS[pinnedProvider.primary_service] || colors.brand.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="person"
                      size={22}
                      color={CATEGORY_COLORS[pinnedProvider.primary_service] || colors.brand.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 }}>
                      {pinnedProvider.business_name}
                    </Text>
                    <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }}>
                      {pinnedProvider.sector} · {pinnedProvider.primary_service.replace(/_/g, ' ')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                      <Inline icon="star" color={colors.ios.yellow} text={`${pinnedProvider.rating}★`} />
                      <Inline icon="cash" color={colors.ios.green} text={pinnedProvider.price_range} />
                      <Inline icon="time" color={colors.ios.cyan} text={`${pinnedProvider.avg_response_minutes}m`} />
                    </View>
                  </View>
                  <Pressable onPress={() => setPinnedProvider(null)}>
                    <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                  </Pressable>
                </View>
              </GlassCard>
            </MotiView>
          )}

          {/* Category density bar */}
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 1.4,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              DENSITY · {cityData?.name_en || ''}
            </Text>
            <GlassCard>
              {categories.slice(0, 6).map((c: any) => {
                const count = providers.filter((p) => p.primary_service === c.id).length;
                const max = Math.max(
                  1,
                  ...categories.map((cc: any) => providers.filter((p) => p.primary_service === cc.id).length)
                );
                const pct = (count / max) * 100;
                const color = CATEGORY_COLORS[c.id] || colors.brand.primary;
                return (
                  <View key={c.id} style={{ marginVertical: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: colors.text.primary, fontSize: 12, fontWeight: '600' }}>
                        {c.name_en}
                      </Text>
                      <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700' }}>{count}</Text>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: colors.border.subtle,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ height: 4, width: `${pct}%`, backgroundColor: color, borderRadius: 2 }} />
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Inline = ({ icon, color, text }: any) => {
  const { colors } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={{ color: colors.text.secondary, fontSize: 11, fontWeight: '600' }}>{text}</Text>
    </View>
  );
};
