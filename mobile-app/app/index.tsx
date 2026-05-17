/**
 * Home — clean services dashboard with search, promo banner, service grid.
 * Layout inspired by modern home-services apps. Functionality preserved:
 * tap search/chip → submits via parseAndRank → agent pipeline → results.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Logo } from '../src/components/Logo';
import { parseAndRank, fetchStateSummary } from '../src/services/api';

const SERVICES = (colors: any) => [
  {
    id: 'ac_technician',
    label_en: 'AC Technician',
    label_ur: 'AC Tech',
    icon: 'snow' as const,
    color: '#4DA8FF',
    accent: '#0A84FF',
    sub_en: '50+ providers',
    sub_ur: '50+ providers',
  },
  {
    id: 'plumber',
    label_en: 'Plumber',
    label_ur: 'Plumber',
    icon: 'water' as const,
    color: '#0A84FF',
    accent: '#0066CC',
    sub_en: '42+ providers',
    sub_ur: '42+ providers',
  },
  {
    id: 'electrician',
    label_en: 'Electrician',
    label_ur: 'Electrician',
    icon: 'flash' as const,
    color: '#FFC900',
    accent: '#FF9F0A',
    sub_en: '38+ providers',
    sub_ur: '38+ providers',
  },
  {
    id: 'tutor',
    label_en: 'Tutor',
    label_ur: 'Tutor',
    icon: 'school' as const,
    color: '#BF5AF2',
    accent: '#7A3DC1',
    sub_en: '25+ providers',
    sub_ur: '25+ providers',
  },
  {
    id: 'beautician',
    label_en: 'Beautician',
    label_ur: 'Beautician',
    icon: 'sparkles' as const,
    color: '#FF6F87',
    accent: '#E04060',
    sub_en: '30+ providers',
    sub_ur: '30+ providers',
  },
  {
    id: 'cleaner',
    label_en: 'Cleaner',
    label_ur: 'Safai',
    icon: 'leaf' as const,
    color: '#30D158',
    accent: '#1FA847',
    sub_en: '45+ providers',
    sub_ur: '45+ providers',
  },
  {
    id: 'mechanic',
    label_en: 'Mechanic',
    label_ur: 'Mistri',
    icon: 'construct' as const,
    color: '#FF9F0A',
    accent: '#D67A00',
    sub_en: '20+ providers',
    sub_ur: '20+ providers',
  },
  {
    id: 'carpenter',
    label_en: 'Carpenter',
    label_ur: 'Barhai',
    icon: 'hammer' as const,
    color: '#A0522D',
    accent: '#7A3D1F',
    sub_en: '18+ providers',
    sub_ur: '18+ providers',
  },
  {
    id: 'painter',
    label_en: 'Painter',
    label_ur: 'Painter',
    icon: 'brush' as const,
    color: '#FF453A',
    accent: '#D32420',
    sub_en: '15+ providers',
    sub_ur: '15+ providers',
  },
];

const QUICK_SAMPLES_UR = [
  'Mujhe kal subah G-13 mein AC technician chahiye',
  'Plumber chahiye DHA Phase 5 Lahore mein abhi',
  'Ghar mein pani bhar gaya hai, foran plumber bhejo',
];
const QUICK_SAMPLES_EN = [
  'I need an AC technician in G-13 tomorrow morning',
  'Plumber needed in DHA Phase 5 Lahore right now',
  'Water flooding at home, send plumber immediately',
];

export default function HomeScreen() {
  const router = useRouter();
  const { lang, setLang, t, setCurrentTrace, user, colors, theme, isProvider } = useApp();
  const isDark = theme === 'dark';
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    fetchStateSummary().then(setStats).catch(() => {});
  }, []);

  const samples = lang === 'ur' ? QUICK_SAMPLES_UR : QUICK_SAMPLES_EN;

  const handleSubmit = async (input?: string) => {
    const query = (input ?? text).trim();
    if (!query) {
      Alert.alert(
        lang === 'ur' ? 'Khali' : 'Empty',
        lang === 'ur' ? 'Kuch likhein ya service tap karein' : 'Please type or tap a service'
      );
      return;
    }
    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    try {
      const data = await parseAndRank(query, user.id);
      setCurrentTrace({ ...data, original_input: query });
      await new Promise((r) => setTimeout(r, 50));
      if (data.intent?.urgency === 'emergency') {
        router.push('/crisis');
      } else if (data.needs_clarification) {
        Alert.alert(
          lang === 'ur' ? 'Maazrat' : 'Need more info',
          lang === 'ur'
            ? data.intent.clarification_question_ur
            : data.intent.clarification_question_en
        );
      } else {
        router.push('/agent-thinking');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Backend not reachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickService = (label: string) => {
    const q = lang === 'ur'
      ? `Mujhe ${label} chahiye ${user.sector || 'G-13'} mein`
      : `I need a ${label} in ${user.sector || 'G-13'}`;
    handleSubmit(q);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingBottom: spacing.huge,
            paddingHorizontal: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header — avatar + welcome + bell */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingTop: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <Pressable onPress={() => router.push('/profile')}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: colors.brand.primary + '33',
                }}
              >
                <Image
                  source={{ uri: `https://i.pravatar.cc/200?u=${user.avatarSeed}` }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 12,
                  fontWeight: '500',
                }}
              >
                {lang === 'ur' ? 'Khush amdeed' : 'Welcome'}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  marginTop: 1,
                }}
              >
                Hello {user.name.split(' ')[0]}
              </Text>
            </View>
            <Pressable
              onPress={() => setLang(lang === 'ur' ? 'en' : 'ur')}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.bg.surfaceSolid,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isDark ? 0.5 : 1,
                borderColor: colors.border.divider,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: colors.text.primary, fontWeight: '700', fontSize: 12 }}>
                {lang === 'ur' ? 'EN' : 'اردو'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/chats')}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.bg.surfaceSolid,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isDark ? 0.5 : 1,
                borderColor: colors.border.divider,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="chatbubbles-outline" size={17} color={colors.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/history')}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: colors.brand.textAccent + '18',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.brand.textAccent + '40',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="git-network-outline" size={17} color={colors.brand.textAccent} />
            </Pressable>
          </View>

          {/* Hero title */}
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 26,
              fontWeight: '800',
              letterSpacing: -0.7,
              lineHeight: 32,
              marginBottom: spacing.md,
            }}
          >
            {lang === 'ur' ? 'Aap ko kaun si\nservice chahiye?' : 'What service do\nyou want to use?'}
          </Text>

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.bg.surfaceSolid,
              borderRadius: radii.pill,
              paddingHorizontal: 14,
              borderWidth: isDark ? 0.5 : 1,
              borderColor: colors.border.divider,
              marginBottom: spacing.lg,
            }}
          >
            <Ionicons name="search" size={17} color={colors.text.tertiary} />
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={lang === 'ur' ? 'Apni service search karein' : 'Search for your service'}
              placeholderTextColor={colors.text.placeholder}
              multiline={false}
              maxLength={200}
              style={{
                flex: 1,
                color: colors.text.primary,
                fontSize: 14,
                paddingVertical: 13,
                paddingHorizontal: 10,
                letterSpacing: -0.2,
                ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
              }}
              onSubmitEditing={() => handleSubmit()}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => handleSubmit()}
              disabled={loading}
              style={({ pressed }) => ({
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || loading ? 0.6 : 1,
              })}
            >
              <Ionicons name={loading ? 'hourglass' : 'arrow-forward'} size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Promotional banner */}
          <Pressable onPress={() => handleSubmit(samples[0])}>
            {({ pressed }) => (
              <MotiView
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 360 }}
                style={{ opacity: pressed ? 0.85 : 1, marginBottom: spacing.lg }}
              >
                <LinearGradient
                  colors={[colors.brand.primary, colors.brand.secondary] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: radii.xl,
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 132,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 26,
                        fontWeight: '800',
                        letterSpacing: -0.5,
                      }}
                    >
                      {lang === 'ur' ? 'AI Powered' : 'AI Powered'}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.92)',
                        fontSize: 13,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      {lang === 'ur'
                        ? '8 specialist agents · Best provider 30 sec mein'
                        : '8 specialist agents · Best provider in 30 sec'}
                    </Text>
                    <View
                      style={{
                        marginTop: 12,
                        backgroundColor: 'rgba(255,255,255,0.22)',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radii.pill,
                        alignSelf: 'flex-start',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="sparkles" size={13} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                        {lang === 'ur' ? 'Abhi try karein' : 'Try Now'}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: '#ffffff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={require('../assets/logo.png')}
                      style={{ width: 78, height: 78 }}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </MotiView>
            )}
          </Pressable>

          {/* Section: Services grid — collapsible (3 visible by default) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {lang === 'ur' ? 'Services' : 'Services'}
            </Text>
            <Pressable onPress={() => setShowAllServices((v) => !v)}>
              <Text style={{ color: colors.brand.textAccent, fontSize: 13, fontWeight: '600' }}>
                {showAllServices
                  ? lang === 'ur' ? 'Less' : 'Less'
                  : lang === 'ur' ? 'Show more' : 'Show more'}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 12,
            }}
          >
            {SERVICES(colors)
              .slice(0, showAllServices ? SERVICES(colors).length : 3)
              .map((s, i) => (
                <MotiView
                  key={s.id}
                  from={{ opacity: 0, translateY: 8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: i * 50 }}
                  style={{ width: '32%' }}
                >
                  <Pressable onPress={() => handleQuickService(lang === 'ur' ? s.label_ur : s.label_en)}>
                    {({ pressed }) => (
                      <View
                        style={{
                          backgroundColor: colors.bg.surfaceSolid,
                          borderRadius: radii.lg,
                          paddingVertical: 16,
                          paddingHorizontal: 8,
                          minHeight: 116,
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          opacity: pressed ? 0.7 : 1,
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            backgroundColor: s.color,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={s.icon} size={20} color="#fff" />
                        </View>
                        <View style={{ alignItems: 'center', gap: 2 }}>
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontSize: 12,
                              fontWeight: '700',
                              letterSpacing: -0.2,
                              textAlign: 'center',
                            }}
                            numberOfLines={1}
                          >
                            {lang === 'ur' ? s.label_ur : s.label_en}
                          </Text>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 10,
                              fontWeight: '500',
                              textAlign: 'center',
                            }}
                            numberOfLines={1}
                          >
                            {lang === 'ur' ? s.sub_ur : s.sub_en}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                </MotiView>
              ))}
          </View>

          {/* Section: Examples */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: spacing.xl,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: -0.3,
              }}
            >
              {lang === 'ur' ? 'Try Examples' : 'Try Examples'}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.bg.surfaceSolid,
              borderRadius: radii.lg,
              overflow: 'hidden',
              borderWidth: isDark ? 0.5 : 1,
              borderColor: colors.border.divider,
            }}
          >
            {samples.map((s, i) => (
              <Pressable key={s} onPress={() => handleSubmit(s)}>
                {({ pressed }) => (
                  <View
                    style={{
                      paddingVertical: 13,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                      borderBottomWidth: i < samples.length - 1 ? 0.5 : 0,
                      borderBottomColor: colors.border.divider,
                    }}
                  >
                    <Ionicons
                      name={i === 2 ? 'warning' : i === 1 ? 'flash' : 'snow'}
                      size={16}
                      color={i === 2 ? colors.semantic.danger : colors.text.tertiary}
                    />
                    <Text
                      style={{
                        color: colors.text.primary,
                        fontSize: 13,
                        flex: 1,
                        letterSpacing: -0.2,
                        lineHeight: 18,
                      }}
                    >
                      {s}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Provider/Customer CTA */}
          <Pressable
            onPress={() => router.push(isProvider ? '/my-services' : '/become-provider')}
            style={({ pressed }) => ({
              marginTop: spacing.xl,
              borderRadius: radii.lg,
              backgroundColor: colors.bg.surfaceSolid,
              borderWidth: isDark ? 0.5 : 1,
              borderColor: colors.border.divider,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
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
              <Ionicons name="briefcase" size={17} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 14,
                  fontWeight: '600',
                  letterSpacing: -0.2,
                }}
              >
                {isProvider
                  ? lang === 'ur' ? 'Meri Services manage karein' : 'Manage my services'
                  : lang === 'ur' ? 'Apni service list karein' : 'List your service'}
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 2 }}>
                {isProvider
                  ? lang === 'ur' ? 'Services add karein, edit karein' : 'Add and edit your offerings'
                  : lang === 'ur' ? 'Provider banein, earn karna shuru karein' : 'Become a provider, start earning'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.text.tertiary} />
          </Pressable>

          {/* Footer */}
          <Text
            style={{
              color: colors.text.quaternary,
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 0.4,
              textAlign: 'center',
              marginTop: spacing.xl,
            }}
          >
            8 AGENTS ONLINE · {stats?.providers_total || 134} PROVIDERS
          </Text>
          <Text
            style={{
              color: colors.text.quaternary,
              fontSize: 10,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            Powered by Google Antigravity
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
