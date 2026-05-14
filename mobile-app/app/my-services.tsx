/**
 * My Services — provider can view, add, and remove the services they offer.
 * Primary service is locked (set at registration); secondary services are editable.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import {
  fetchServices,
  fetchMyProfile,
  addMyService,
  removeMyService,
} from '../src/services/api';

export default function MyServicesScreen() {
  const router = useRouter();
  const { lang, user, colors, theme, setUser } = useApp();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<any>(null);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [picker, setPicker] = useState(false);

  const providerId = user.provider?.provider_id;

  const load = async () => {
    if (!providerId) {
      setLoading(false);
      return;
    }
    try {
      const [p, cats] = await Promise.all([
        fetchMyProfile({ provider_id: providerId }),
        fetchServices(),
      ]);
      setProfile(p);
      setAllCategories(cats.categories || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [providerId]);

  const handleAdd = async (serviceId: string) => {
    if (!providerId) return;
    setSubmitting(true);
    try {
      const res = await addMyService({ provider_id: providerId, service_id: serviceId });
      if (res.success) {
        setPicker(false);
        await load();
      } else {
        Alert.alert(
          'Error',
          res.message || res.error || 'Could not add service'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Network error');
    }
    setSubmitting(false);
  };

  const handleRemove = (serviceId: string, name: string) => {
    if (!providerId) return;
    Alert.alert(
      lang === 'ur' ? 'Remove karein?' : 'Remove this service?',
      lang === 'ur'
        ? `${name} aap ki listing se hata di jayegi.`
        : `${name} will be removed from your listings.`,
      [
        { text: lang === 'ur' ? 'Cancel' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ur' ? 'Remove' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeMyService(providerId, serviceId);
            load();
          },
        },
      ]
    );
  };

  if (!providerId) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Meri Services' : 'My Services'} />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
          }}
        >
          <Ionicons name="briefcase-outline" size={48} color={colors.text.tertiary} />
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 16,
              fontWeight: '600',
              marginTop: 12,
              textAlign: 'center',
            }}
          >
            {lang === 'ur' ? 'Provider banein' : 'Become a provider'}
          </Text>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 13,
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 18,
            }}
          >
            {lang === 'ur'
              ? 'Pehle provider register karein, phir services list kar saktay hain.'
              : 'Register as a provider first, then list and manage your services.'}
          </Text>
          <GradientButton
            label={lang === 'ur' ? 'Provider Banein' : 'Become a Provider'}
            icon="briefcase"
            onPress={() => router.replace('/become-provider')}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Meri Services' : 'My Services'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  const services = profile?.services;
  const ownedIds = new Set<string>([
    services?.primary?.id,
    ...(services?.secondary?.map((s: any) => s.id) || []),
  ]);
  const available = allCategories.filter((c) => !ownedIds.has(c.id));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Meri Services' : 'My Services'}
        subtitle={`${services?.total || 1} ${
          services?.total === 1 ? 'service' : 'services'
        } listed`}
      />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary service */}
        <View>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.4,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            {lang === 'ur' ? 'PRIMARY SERVICE' : 'PRIMARY SERVICE'}
          </Text>
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: colors.brand.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="star" size={17} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '600',
                    letterSpacing: -0.3,
                  }}
                >
                  {services?.primary?.name_en}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 2 }}>
                  {lang === 'ur' ? 'Aap ki main service' : 'Your main service'}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: colors.brand.primary,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                  }}
                >
                  PRIMARY
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Secondary services list */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.4,
              }}
            >
              {lang === 'ur' ? 'ADDITIONAL SERVICES' : 'ADDITIONAL SERVICES'} ·{' '}
              {services?.secondary?.length || 0}
            </Text>
          </View>

          {(services?.secondary || []).length === 0 ? (
            <GlassCard>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 13,
                  textAlign: 'center',
                  paddingVertical: 8,
                }}
              >
                {lang === 'ur'
                  ? 'Aap aur services bhi list kar saktay hain — niche se add karein.'
                  : 'You can list additional services — add one below.'}
              </Text>
            </GlassCard>
          ) : (
            <View
              style={{
                backgroundColor: colors.bg.surfaceSolid,
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: isDark ? 0.5 : 0,
                borderColor: colors.border.divider,
              }}
            >
              {services.secondary.map((s: any, i: number) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    gap: 12,
                    borderBottomWidth: i < services.secondary.length - 1 ? 0.5 : 0,
                    borderBottomColor: isDark
                      ? colors.border.divider
                      : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      backgroundColor: colors.bg.elevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={colors.semantic.success}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 15,
                      flex: 1,
                      letterSpacing: -0.2,
                    }}
                  >
                    {s.name_en}
                  </Text>
                  <Pressable
                    onPress={() => handleRemove(s.id, s.name_en)}
                    style={({ pressed }) => ({
                      padding: 6,
                      opacity: pressed ? 0.5 : 1,
                    })}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.text.quaternary}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add service button */}
        <GradientButton
          label={
            lang === 'ur' ? 'Nayi Service Add Karein' : 'Add Another Service'
          }
          icon="add-circle"
          onPress={() => setPicker(!picker)}
          variant="primary"
          size="lg"
          style={{ marginTop: spacing.md }}
        />

        {/* Picker — list of available categories */}
        {picker ? (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 240 }}
          >
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.4,
                marginTop: 12,
                marginBottom: 8,
                marginLeft: 4,
              }}
            >
              {lang === 'ur' ? 'AVAILABLE SERVICES' : 'AVAILABLE SERVICES'} ·{' '}
              {available.length}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {available.map((c: any) => (
                <Pressable
                  key={c.id}
                  onPress={() => handleAdd(c.id)}
                  disabled={submitting}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: colors.bg.surfaceSolid,
                    borderWidth: 0.5,
                    borderColor: colors.border.divider,
                    opacity: pressed || submitting ? 0.6 : 1,
                  })}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={colors.brand.textAccent}
                  />
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 13,
                      fontWeight: '500',
                      letterSpacing: -0.1,
                    }}
                  >
                    {c.name_en}
                  </Text>
                </Pressable>
              ))}
              {available.length === 0 ? (
                <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>
                  {lang === 'ur'
                    ? 'Aap ne sab services list kar di hain!'
                    : "You've listed every available service!"}
                </Text>
              ) : null}
            </View>
          </MotiView>
        ) : null}

        {/* Provider info card */}
        <GlassCard style={{ marginTop: spacing.lg }}>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
          >
            {lang === 'ur' ? 'BUSINESS DETAILS' : 'BUSINESS DETAILS'}
          </Text>
          <Row label={lang === 'ur' ? 'Business' : 'Business'} value={profile?.provider?.business_name || '—'} />
          <Row label={lang === 'ur' ? 'Location' : 'Location'} value={`${profile?.provider?.sector || '—'}, ${profile?.provider?.city_name_en || ''}`} />
          <Row label={lang === 'ur' ? 'Price range' : 'Price range'} value={profile?.provider?.price_range || '—'} />
          <Row label={lang === 'ur' ? 'Rating' : 'Rating'} value={profile?.provider?.rating ? `${profile.provider.rating}★ · ${profile.provider.reviews_count || 0} reviews` : '—'} last />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value, last }: { label: string; value: string; last?: boolean }) => {
  const { colors, theme } = useApp();
  const isDark = theme === 'dark';
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 9,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: isDark ? colors.border.divider : 'rgba(0,0,0,0.06)',
      }}
    >
      <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>{label}</Text>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 13,
          fontWeight: '500',
          maxWidth: '60%',
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
};
