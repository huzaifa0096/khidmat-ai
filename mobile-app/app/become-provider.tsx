/**
 * Become a Provider — quick onboarding to register as a service provider.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/state/AppContext';
import { colors as iconPalette, radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { fetchServices, registerProvider } from '../src/services/api';

const CATEGORY_ICONS: Record<string, { icon: any; color: string }> = {
  ac_technician: { icon: 'snow', color: iconPalette.ios.cyan },
  plumber: { icon: 'water', color: iconPalette.ios.blue },
  electrician: { icon: 'flash', color: iconPalette.ios.yellow },
  carpenter: { icon: 'hammer', color: '#A1887F' },
  painter: { icon: 'brush', color: iconPalette.ios.red },
  cleaner: { icon: 'leaf', color: iconPalette.ios.green },
  tutor: { icon: 'school', color: iconPalette.ios.purple },
  beautician: { icon: 'sparkles', color: iconPalette.ios.pink },
  mobile_repair: { icon: 'phone-portrait', color: iconPalette.ios.mint },
  laptop_repair: { icon: 'laptop', color: iconPalette.ios.purple },
  pest_control: { icon: 'bug', color: iconPalette.ios.orange },
  car_mechanic: { icon: 'car-sport', color: iconPalette.ios.indigo },
  bike_mechanic: { icon: 'bicycle', color: iconPalette.ios.gray },
  photographer: { icon: 'camera', color: iconPalette.ios.orange },
  event_decorator: { icon: 'balloon', color: iconPalette.ios.pink },
  catering: { icon: 'restaurant', color: iconPalette.ios.red },
  mason: { icon: 'construct', color: '#A1887F' },
  geyser_repair: { icon: 'flame', color: iconPalette.ios.orange },
  ro_water: { icon: 'water', color: iconPalette.ios.teal },
  generator_repair: { icon: 'battery-charging', color: iconPalette.ios.yellow },
};

export default function BecomeProviderScreen() {
  const router = useRouter();
  const { lang, user, setUser, setMode, colors } = useApp();
  const inputStyle: any = {
    backgroundColor: colors.bg.surfaceSolid,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [businessName, setBusinessName] = useState(`${user.name} Services`);
  const [primaryService, setPrimaryService] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState('1500-5000');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices()
      .then((r) => setCategories(r.categories || []))
      .catch(() => {});
  }, []);

  const valid = businessName.trim().length > 2 && primaryService;

  const handleSubmit = async () => {
    if (!valid) {
      Alert.alert(
        lang === 'ur' ? 'Mukammal karein' : 'Incomplete',
        lang === 'ur' ? 'Business name aur service select karein' : 'Enter business name and pick a service'
      );
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setSubmitting(true);
    try {
      const res = await registerProvider({
        user_id: user.id,
        name: user.name,
        business_name: businessName.trim(),
        primary_service: primaryService!,
        city: user.city,
        sector: user.sector || 'G-13',
        phone: user.phone,
        price_range: `PKR ${priceRange}`,
        description: description || undefined,
      });
      if (res.success && res.provider) {
        setUser({
          ...user,
          provider: {
            provider_id: res.provider.id,
            business_name: res.provider.business_name,
            primary_service: res.provider.primary_service,
            price_range: res.provider.price_range,
            description: res.provider.description,
            is_active: true,
          },
        });
        setMode('provider');
        // Navigate immediately — don't depend on Alert.alert button onPress
        // (web/some Android builds drop the callback)
        router.replace('/provider-home');
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (e: any) {
      Alert.alert(
        lang === 'ur' ? 'Error' : 'Error',
        e?.response?.data?.error || e?.message || 'Could not register'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={lang === 'ur' ? 'Provider Banein' : 'Become a Provider'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: spacing.xl }}>
            {/* Hero */}
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380 }}
              style={{ alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl }}
            >
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 22,
                  overflow: 'hidden',
                  shadowColor: colors.brand.primary,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.45,
                  shadowRadius: 24,
                  elevation: 12,
                }}
              >
                <LinearGradient
                  colors={['#FF9F0A', '#FF375F'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="briefcase" size={36} color="#fff" />
                </LinearGradient>
              </View>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 26,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                {lang === 'ur' ? 'Apni service list karein' : 'List your service'}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 14,
                  marginTop: 4,
                  textAlign: 'center',
                  lineHeight: 19,
                  maxWidth: 320,
                }}
              >
                {lang === 'ur'
                  ? 'Customers aap ko AI ke through dhoondhenge — kuch hi minutes mein live'
                  : 'Customers find you via AI — go live in minutes'}
              </Text>
            </MotiView>

            {/* Why join — benefits */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
              <Benefit icon="people" color={colors.ios.cyan} value="2.3k+" label={lang === 'ur' ? 'CUSTOMERS' : 'CUSTOMERS'} />
              <Benefit icon="trending-up" color={colors.ios.green} value="96%" label={lang === 'ur' ? 'MATCH RATE' : 'MATCH RATE'} />
              <Benefit icon="time" color={colors.ios.purple} value="< 5 min" label={lang === 'ur' ? 'SETUP' : 'SETUP'} />
            </View>

            {/* Business name */}
            <SectionLabel text={lang === 'ur' ? 'BUSINESS DETAILS' : 'BUSINESS DETAILS'} />
            <GlassCard>
              <Field label={lang === 'ur' ? 'Business name' : 'Business name'}>
                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder={lang === 'ur' ? 'Misaal: Ali AC Services' : 'e.g., Ali AC Services'}
                  placeholderTextColor={colors.text.placeholder}
                  style={inputStyle}
                />
              </Field>
              <Field label={lang === 'ur' ? 'Price range (PKR)' : 'Price range (PKR)'} style={{ marginTop: 10 }}>
                <TextInput
                  value={priceRange}
                  onChangeText={setPriceRange}
                  placeholder="1500-5000"
                  placeholderTextColor={colors.text.placeholder}
                  style={inputStyle}
                />
              </Field>
              <Field label={lang === 'ur' ? 'Description (optional)' : 'Description (optional)'} style={{ marginTop: 10 }}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={lang === 'ur' ? 'Aap ki khasoosiyat...' : 'Tell us your specialty...'}
                  placeholderTextColor={colors.text.placeholder}
                  multiline
                  style={[inputStyle, { minHeight: 60, textAlignVertical: 'top' }]}
                />
              </Field>
            </GlassCard>

            {/* Service category */}
            <SectionLabel text={lang === 'ur' ? 'AAP KAUN SI SERVICE DETE HAIN?' : 'WHICH SERVICE DO YOU OFFER?'} style={{ marginTop: spacing.lg }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((c: any) => {
                const meta = CATEGORY_ICONS[c.id] || { icon: 'briefcase', color: colors.brand.primary };
                const active = primaryService === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setPrimaryService(c.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: active ? meta.color + '33' : colors.bg.surfaceSolid,
                      borderWidth: 1,
                      borderColor: active ? meta.color : colors.border.subtle,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons name={meta.icon} size={13} color={meta.color} />
                    <Text
                      style={{
                        color: active ? meta.color : colors.text.primary,
                        fontSize: 12,
                        fontWeight: '700',
                        letterSpacing: -0.1,
                      }}
                    >
                      {c.name_en}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={12} color={meta.color} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Location summary */}
            <View
              style={{
                marginTop: spacing.lg,
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: colors.ios.cyan + '15',
                borderWidth: 1,
                borderColor: colors.ios.cyan + '44',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="location" size={16} color={colors.ios.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>
                  {lang === 'ur' ? 'AAP KI LOCATION' : 'YOUR LOCATION'}
                </Text>
                <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '600', marginTop: 1 }}>
                  {user.sector || '—'}, {user.city.charAt(0).toUpperCase() + user.city.slice(1)}
                </Text>
              </View>
              <Text style={{ color: iconPalette.ios.cyan, fontSize: 11, fontWeight: '700' }}>
                {lang === 'ur' ? 'Settings se change karein' : 'Edit in settings'}
              </Text>
            </View>

            {/* Submit */}
            <GradientButton
              label={
                submitting
                  ? lang === 'ur'
                    ? 'Register kar rahe hain...'
                    : 'Registering...'
                  : lang === 'ur'
                  ? 'Provider Banein'
                  : 'List My Service'
              }
              icon={submitting ? undefined : 'rocket'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={!valid}
              variant="secondary"
              size="lg"
              style={{ marginTop: spacing.xl }}
            />

            <Text
              style={{
                color: colors.text.quaternary,
                fontSize: 11,
                textAlign: 'center',
                marginTop: spacing.md,
                lineHeight: 16,
                paddingHorizontal: 12,
              }}
            >
              {lang === 'ur'
                ? 'Provider banne ka matlab hai aap Khidmat AI ke service quality standards se sahmat hain'
                : 'Becoming a provider means you agree to our service quality standards'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Benefit = ({ icon, color, value, label }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.surfaceSolid,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    }}
  >
    <Ionicons name={icon} size={16} color={color} />
    <Text style={{ color: colors.text.primary, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 }}>
      {value}
    </Text>
    <Text style={{ color: colors.text.tertiary, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
      {label}
    </Text>
  </View>
  );
};

const Field = ({ label, children, style }: any) => {
  const { colors } = useApp();
  return (
    <View style={style}>
      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.2,
          marginBottom: 6,
        }}
      >
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
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
          marginBottom: 10,
          marginLeft: 4,
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
};
