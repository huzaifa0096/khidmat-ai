/**
 * Onboarding / Sign-In — premium 4-step flow.
 * Step 1: Welcome hero
 * Step 2: Phone number
 * Step 3: OTP verification (simulated — any 4 digits work)
 * Step 4: Quick setup (city, sector, language)
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { GradientButton } from '../src/components/GradientButton';
import { GoogleSignInButton } from '../src/components/GoogleSignInButton';
import { useLiveLocation } from '../src/hooks/useLiveLocation';
import { registerProvider } from '../src/services/api';
import { Logo } from '../src/components/Logo';

const STEPS = ['welcome', 'phone', 'otp', 'profile'] as const;
type StepKey = (typeof STEPS)[number];

const CITY_OPTIONS = [
  { id: 'islamabad', name: 'Islamabad' },
  { id: 'lahore', name: 'Lahore' },
  { id: 'karachi', name: 'Karachi' },
  { id: 'rawalpindi', name: 'Rawalpindi' },
];

// Fixed demo session IDs so 2 devices can run customer ↔ provider
// against the same backend.
const DEMO_CUSTOMER = {
  id: 'U_DEMO_CUSTOMER',
  name: 'Aisha Khan',
  phone: '0300-1112233',
  email: 'aisha.customer@khidmat.demo',
  city: 'islamabad',
  sector: 'F-10',
};

const DEMO_PROVIDER = {
  id: 'U_DEMO_PROVIDER',
  name: 'Ahmed Ali',
  phone: '0300-4445566',
  email: 'ahmed.provider@khidmat.demo',
  city: 'islamabad',
  sector: 'G-13',
  business_name: 'Ahmed AC Solutions',
  primary_service: 'ac_technician',
  price_range: 'PKR 2000-6000',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { lang, setLang, user, setUser, setSignedIn, setMode, colors } = useApp();
  const [step, setStep] = useState<StepKey>('welcome');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [googleProfile, setGoogleProfile] = useState<{
    name: string;
    email: string;
    picture?: string;
  } | null>(null);

  const signInAsDemoCustomer = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setUser({
      ...user,
      ...DEMO_CUSTOMER,
      avatarSeed: DEMO_CUSTOMER.id,
      joinedAt: new Date().toISOString().slice(0, 10),
      provider: null,
    });
    setMode('customer');
    setSignedIn(true);
    router.replace('/');
  };

  const signInAsDemoProvider = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    // Ensure provider record exists in backend (idempotent)
    try {
      const res = await registerProvider({
        user_id: DEMO_PROVIDER.id,
        name: DEMO_PROVIDER.name,
        business_name: DEMO_PROVIDER.business_name,
        primary_service: DEMO_PROVIDER.primary_service,
        city: DEMO_PROVIDER.city,
        sector: DEMO_PROVIDER.sector,
        phone: DEMO_PROVIDER.phone,
        price_range: DEMO_PROVIDER.price_range,
      });
      const provider = res.provider;
      setUser({
        ...user,
        id: DEMO_PROVIDER.id,
        name: DEMO_PROVIDER.name,
        phone: DEMO_PROVIDER.phone,
        email: DEMO_PROVIDER.email,
        city: DEMO_PROVIDER.city,
        sector: DEMO_PROVIDER.sector,
        avatarSeed: DEMO_PROVIDER.id,
        joinedAt: new Date().toISOString().slice(0, 10),
        provider: {
          provider_id: provider.id,
          business_name: provider.business_name,
          primary_service: provider.primary_service,
          price_range: provider.price_range,
          description: provider.description,
          is_active: true,
        },
      });
      setMode('provider');
      setSignedIn(true);
      router.replace('/provider-home');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not sign in as demo provider');
    }
  };
  const [otp, setOtp] = useState(['', '', '', '']);
  const [city, setCity] = useState('islamabad');
  const [sector, setSector] = useState('G-13');
  const [sending, setSending] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([null, null, null, null]);

  const progress = (STEPS.indexOf(step) + 1) / STEPS.length;

  const next = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSendOtp = () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert(
        lang === 'ur' ? 'Number sahi nahi' : 'Invalid number',
        lang === 'ur' ? 'Pakistani mobile number darj karein (e.g., 0300-1234567)' : 'Please enter a valid Pakistani mobile number'
      );
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      next();
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    }, 800);
  };

  const handleOtpChange = (idx: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(-1);
    const updated = [...otp];
    updated[idx] = digits;
    setOtp(updated);
    if (digits && idx < 3) otpRefs.current[idx + 1]?.focus();
    if (!digits && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (idx === 3 && digits && updated.every((d) => d)) {
      setTimeout(() => next(), 300);
    }
  };

  const handleComplete = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const userName = name.trim() || googleProfile?.name || 'User';
    setUser({
      ...user,
      id: `U${Date.now().toString().slice(-6)}`,
      name: userName,
      phone: phone || '0300-0000000',
      city,
      sector,
      email: googleProfile?.email || user.email,
      avatarSeed: userName,
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    setSignedIn(true);
    router.replace('/');
  };

  const handleGoogleSignIn = (profile: { name: string; email: string; picture?: string }) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setGoogleProfile(profile);
    setName(profile.name);
    // Skip phone + OTP — go straight to location/profile step
    setStep('profile');
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress bar */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {step !== 'welcome' ? (
              <Pressable
                onPress={back}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.bg.surfaceSolid,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="chevron-back" size={18} color={colors.brand.textAccent} />
              </Pressable>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <View
              style={{
                flex: 1,
                height: 4,
                backgroundColor: colors.border.subtle,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <MotiView
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: 'timing', duration: 320 }}
                style={{ height: 4 }}
              >
                <LinearGradient
                  colors={colors.brand.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 4, width: '100%' }}
                />
              </MotiView>
            </View>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 12,
                fontWeight: '700',
                minWidth: 30,
                textAlign: 'right',
              }}
            >
              {STEPS.indexOf(step) + 1}/{STEPS.length}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xxxl,
            alignItems: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 440 }}>
            {step === 'welcome' && (
              <WelcomeStep
                onNext={next}
                lang={lang}
                setLang={setLang}
                onGoogleSignIn={handleGoogleSignIn}
                onDemoCustomer={signInAsDemoCustomer}
                onDemoProvider={signInAsDemoProvider}
              />
            )}
            {step === 'phone' && (
              <PhoneStep
                phone={phone}
                setPhone={setPhone}
                name={name}
                setName={setName}
                onSubmit={handleSendOtp}
                sending={sending}
                lang={lang}
              />
            )}
            {step === 'otp' && (
              <OtpStep
                otp={otp}
                otpRefs={otpRefs}
                onChange={handleOtpChange}
                onResend={() => Alert.alert('OTP', 'Use any 4 digits — this is a demo')}
                phone={phone}
                onSubmit={next}
                lang={lang}
              />
            )}
            {step === 'profile' && (
              <ProfileStep
                city={city}
                setCity={setCity}
                sector={sector}
                setSector={setSector}
                onComplete={handleComplete}
                lang={lang}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================================
// Steps
// ============================================================================

const WelcomeStep = ({ onNext, lang, setLang, onGoogleSignIn, onDemoCustomer, onDemoProvider }: any) => {
  const { colors } = useApp();
  return (
  <View style={{ alignItems: 'center', paddingTop: spacing.xxl }}>
    <MotiView
      from={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 14 }}
    >
      <View
        style={{
          shadowColor: colors.brand.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        <Logo size={96} />
      </View>
    </MotiView>

    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 250 }}
    >
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 36,
          fontWeight: '800',
          letterSpacing: -0.9,
          marginTop: spacing.xl,
          textAlign: 'center',
        }}
      >
        Khidmat AI
      </Text>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 16,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: 4,
          letterSpacing: -0.2,
        }}
      >
        {lang === 'ur'
          ? 'Ek awaaz, sub khidmat hazir'
          : 'One request, every service handled'}
      </Text>
    </MotiView>

    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 480, delay: 500 }}
      style={{ marginTop: spacing.xxl, gap: spacing.md, width: '100%' }}
    >
      <Feature icon="git-network" color={colors.ios.cyan} title={lang === 'ur' ? '6 specialized AI agents' : '6 specialized AI agents'} subtitle={lang === 'ur' ? 'Antigravity orchestrated' : 'Antigravity orchestrated'} />
      <Feature icon="people" color={colors.ios.purple} title={lang === 'ur' ? '134 verified providers' : '134 verified providers'} subtitle={lang === 'ur' ? '4 cities · 20 categories' : '4 cities · 20 categories'} />
      <Feature icon="language" color={colors.ios.green} title={lang === 'ur' ? 'Urdu, Roman Urdu, English' : 'Urdu, Roman Urdu, English'} subtitle={lang === 'ur' ? 'AI samajh leti hai sab kuch' : 'AI understands all'} />
      <Feature icon="flash" color={colors.ios.yellow} title={lang === 'ur' ? 'Crisis Mode tayyar' : 'Crisis Mode ready'} subtitle={lang === 'ur' ? 'Emergency dispatch under 30s' : 'Emergency dispatch under 30s'} />
    </MotiView>

    <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.xl, alignSelf: 'center' }}>
      <Pressable
        onPress={() => setLang('ur')}
        style={({ pressed }) => ({
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: lang === 'ur' ? colors.brand.primary : colors.bg.surfaceSolid,
          borderWidth: 1,
          borderColor: lang === 'ur' ? colors.brand.primary : colors.border.default,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: lang === 'ur' ? '#fff' : colors.text.primary, fontWeight: '700', fontSize: 13 }}>اردو</Text>
      </Pressable>
      <Pressable
        onPress={() => setLang('en')}
        style={({ pressed }) => ({
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: lang === 'en' ? colors.brand.primary : colors.bg.surfaceSolid,
          borderWidth: 1,
          borderColor: lang === 'en' ? colors.brand.primary : colors.border.default,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ color: lang === 'en' ? '#fff' : colors.text.primary, fontWeight: '700', fontSize: 13 }}>English</Text>
      </Pressable>
    </View>

    {/* DEMO QUICK SIGN-IN — for 2-device testing */}
    <View
      style={{
        marginTop: spacing.xl,
        width: '100%',
        padding: 12,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.ios.yellow + '44',
        backgroundColor: colors.ios.yellow + '10',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Ionicons name="flash" size={14} color={colors.ios.yellow} />
        <Text
          style={{
            color: colors.ios.yellow,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.2,
          }}
        >
          {lang === 'ur' ? 'DEMO · 2 DEVICES PE TEST' : 'DEMO · TEST ON 2 DEVICES'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={onDemoCustomer} style={{ flex: 1 }}>
          {({ pressed }) => (
            <View
              style={{
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                gap: 4,
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Ionicons name="person" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>
                {lang === 'ur' ? 'CUSTOMER\nAisha' : 'CUSTOMER\nAisha'}
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onDemoProvider} style={{ flex: 1 }}>
          {({ pressed }) => (
            <View
              style={{
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: colors.ios.orange,
                alignItems: 'center',
                gap: 4,
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <Ionicons name="briefcase" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>
                {lang === 'ur' ? 'PROVIDER\nAhmed AC' : 'PROVIDER\nAhmed AC'}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>

    {/* Google Sign-In */}
    <View style={{ marginTop: spacing.md, width: '100%', alignItems: 'center' }}>
      <GoogleSignInButton
        onSuccess={onGoogleSignIn}
        label={lang === 'ur' ? 'Google se Sign In' : 'Continue with Google'}
      />
    </View>

    {/* Divider */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, width: '100%' }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
      <Text
        style={{
          color: colors.text.quaternary,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          marginHorizontal: 12,
        }}
      >
        {lang === 'ur' ? 'YA' : 'OR'}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
    </View>

    <GradientButton
      label={lang === 'ur' ? 'Phone Se Shuru Karein' : 'Continue with Phone'}
      iconRight="arrow-forward"
      onPress={onNext}
      size="lg"
      style={{ marginTop: spacing.md, width: '100%' }}
    />
    <Text
      style={{
        color: colors.text.quaternary,
        fontSize: 11,
        marginTop: spacing.md,
        textAlign: 'center',
      }}
    >
      {lang === 'ur'
        ? 'Aage barhne ka matlab hai aap Terms aur Privacy se sahmat hain'
        : 'By continuing you agree to Terms and Privacy'}
    </Text>
  </View>
  );
};

const Feature = ({ icon, color, title, subtitle }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.bg.surfaceSolid,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      padding: 12,
      ...(Platform.OS === 'web'
        ? ({
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          } as any)
        : {}),
    }}
  >
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: color + '22',
        borderWidth: 1,
        borderColor: color + '55',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 }}>
        {title}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 1 }}>
        {subtitle}
      </Text>
    </View>
  </View>
  );
};

const PhoneStep = ({ phone, setPhone, name, setName, onSubmit, sending, lang }: any) => {
  const { colors } = useApp();
  return (
  <View style={{ paddingTop: spacing.lg }}>
    <Text
      style={{
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.7,
      }}
    >
      {lang === 'ur' ? 'Apna account banayein' : 'Create your account'}
    </Text>
    <Text
      style={{
        color: colors.text.secondary,
        fontSize: 14,
        marginTop: 6,
        lineHeight: 19,
      }}
    >
      {lang === 'ur'
        ? 'Phone number par OTP bhejenge — aap ke booking confirmations ke liye'
        : 'We will send an OTP for booking confirmations'}
    </Text>

    <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
      <Field label={lang === 'ur' ? 'Aap ka naam' : 'Your name'}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={lang === 'ur' ? 'Misaal: Huzaifa Naeem' : 'e.g., Huzaifa Naeem'}
          placeholderTextColor={colors.text.placeholder}
          style={[inputStyle, { backgroundColor: colors.bg.surfaceSolid, borderColor: colors.border.subtle, color: colors.text.primary }]}
        />
      </Field>
      <Field label={lang === 'ur' ? 'Mobile number' : 'Mobile number'}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.bg.surfaceSolid,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 15, marginRight: 8, fontWeight: '600' }}>
            🇵🇰 +92
          </Text>
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/[^\d-]/g, ''))}
            placeholder="300-1234567"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="phone-pad"
            maxLength={13}
            style={{
              flex: 1,
              color: colors.text.primary,
              fontSize: 15,
              paddingVertical: 13,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />
        </View>
      </Field>
    </View>

    <GradientButton
      label={
        sending
          ? lang === 'ur'
            ? 'Bhej raha hun...'
            : 'Sending OTP...'
          : lang === 'ur'
          ? 'OTP Bhejein'
          : 'Send OTP'
      }
      iconRight={sending ? undefined : 'arrow-forward'}
      onPress={onSubmit}
      loading={sending}
      disabled={phone.replace(/\D/g, '').length < 10}
      size="lg"
      style={{ marginTop: spacing.xl, width: '100%' }}
    />

    <View
      style={{
        marginTop: spacing.lg,
        padding: 12,
        borderRadius: radii.md,
        backgroundColor: colors.ios.cyan + '15',
        borderWidth: 1,
        borderColor: colors.ios.cyan + '44',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Ionicons name="information-circle" size={14} color={colors.ios.cyan} style={{ marginTop: 2 }} />
      <Text style={{ color: colors.text.secondary, fontSize: 12, flex: 1, lineHeight: 17 }}>
        {lang === 'ur'
          ? 'Demo mode: Koi bhi 4-digit OTP kaam karega'
          : 'Demo mode: Any 4-digit OTP works'}
      </Text>
    </View>
  </View>
  );
};

const OtpStep = ({ otp, otpRefs, onChange, onResend, phone, onSubmit, lang }: any) => {
  const { colors } = useApp();
  return (
  <View style={{ paddingTop: spacing.lg }}>
    <Text
      style={{
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.7,
      }}
    >
      {lang === 'ur' ? 'OTP darj karein' : 'Enter OTP'}
    </Text>
    <Text
      style={{
        color: colors.text.secondary,
        fontSize: 14,
        marginTop: 6,
        lineHeight: 19,
      }}
    >
      {lang === 'ur' ? 'Code bheja gaya hai +92 ' : 'Code sent to +92 '}
      <Text style={{ color: colors.text.primary, fontWeight: '700' }}>{phone}</Text>
    </Text>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <TextInput
          key={i}
          ref={(r) => {
            otpRefs.current[i] = r;
          }}
          value={otp[i]}
          onChangeText={(v) => onChange(i, v)}
          keyboardType="number-pad"
          maxLength={1}
          style={{
            flex: 1,
            height: 60,
            backgroundColor: colors.bg.surfaceSolid,
            borderRadius: radii.md,
            borderWidth: 1.5,
            borderColor: otp[i] ? colors.brand.primary : colors.border.subtle,
            color: colors.text.primary,
            fontSize: 26,
            fontWeight: '800',
            textAlign: 'center',
            ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
          }}
        />
      ))}
    </View>

    <Pressable
      onPress={onResend}
      style={({ pressed }) => ({
        marginTop: spacing.lg,
        alignSelf: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ color: colors.brand.textAccent, fontSize: 13, fontWeight: '700' }}>
        {lang === 'ur' ? 'Dobara bhejein?' : 'Resend code?'}
      </Text>
    </Pressable>

    <GradientButton
      label={lang === 'ur' ? 'Verify Karein' : 'Verify'}
      iconRight="checkmark"
      onPress={onSubmit}
      disabled={!otp.every((d: string) => d)}
      size="lg"
      style={{ marginTop: spacing.xl, width: '100%' }}
    />
  </View>
  );
};

const ProfileStep = ({ city, setCity, sector, setSector, onComplete, lang }: any) => {
  const { colors } = useApp();
  const location = useLiveLocation();

  const handleAutoDetect = async () => {
    const result = await location.detect();
    if (result) {
      setCity(result.city);
      setSector(result.sector);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  };

  return (
    <View style={{ paddingTop: spacing.lg }}>
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.7,
        }}
      >
        {lang === 'ur' ? 'Aap ka location' : 'Your location'}
      </Text>
      <Text
        style={{
          color: colors.text.secondary,
          fontSize: 14,
          marginTop: 6,
          lineHeight: 19,
        }}
      >
        {lang === 'ur'
          ? 'Hum aap ke nearby providers dikhayenge'
          : 'We will show providers near you'}
      </Text>

      {/* Live location detect button */}
      <Pressable onPress={handleAutoDetect} style={{ marginTop: spacing.lg }}>
        {({ pressed }) => (
          <View
            style={{
              padding: 14,
              borderRadius: radii.md,
              backgroundColor:
                location.status === 'ready'
                  ? colors.semantic.success + '15'
                  : colors.brand.primary + '15',
              borderWidth: 1.5,
              borderColor:
                location.status === 'ready'
                  ? colors.semantic.success + '88'
                  : colors.brand.primary + '88',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.7 : 1,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor:
                  location.status === 'ready'
                    ? colors.semantic.success + '33'
                    : colors.brand.primary + '33',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={
                  location.status === 'detecting'
                    ? 'sync'
                    : location.status === 'ready'
                    ? 'checkmark-circle'
                    : 'locate'
                }
                size={18}
                color={location.status === 'ready' ? colors.semantic.success : colors.brand.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color:
                    location.status === 'ready' ? colors.semantic.success : colors.brand.primary,
                  fontSize: 13,
                  fontWeight: '800',
                  letterSpacing: 0.4,
                }}
              >
                {location.status === 'detecting'
                  ? lang === 'ur'
                    ? 'LOCATION DETECT KAR RAHE HAIN...'
                    : 'DETECTING YOUR LOCATION...'
                  : location.status === 'ready'
                  ? lang === 'ur'
                    ? 'LOCATION MIL GAYI ✓'
                    : 'LOCATION DETECTED ✓'
                  : lang === 'ur'
                  ? 'MERI LIVE LOCATION USE KAREIN'
                  : 'USE MY LIVE LOCATION'}
              </Text>
              <Text style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2 }}>
                {location.status === 'ready' && location.match
                  ? `${location.match.sector}, ${location.match.city_name} · ${location.match.distance_km.toFixed(1)} km away`
                  : location.error
                  ? location.error
                  : lang === 'ur'
                  ? 'Browser geolocation se auto-fill'
                  : 'Auto-fills city + sector via geolocation'}
              </Text>
            </View>
          </View>
        )}
      </Pressable>

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
        <Text
          style={{
            color: colors.text.quaternary,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1,
            marginHorizontal: 12,
          }}
        >
          {lang === 'ur' ? 'YA MANUAL' : 'OR MANUAL'}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
      </View>

      <Text
        style={{
          color: colors.text.tertiary,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1.2,
          marginBottom: 10,
        }}
      >
        {lang === 'ur' ? 'CITY' : 'CITY'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CITY_OPTIONS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCity(c.id)}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: city === c.id ? colors.brand.primary : colors.bg.surfaceSolid,
              borderWidth: 1,
              borderColor: city === c.id ? colors.brand.primary : colors.border.default,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: city === c.id ? '#fff' : colors.text.primary, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field label={lang === 'ur' ? 'Sector/Area' : 'Sector/Area'} style={{ marginTop: spacing.lg }}>
        <TextInput
          value={sector}
          onChangeText={setSector}
          placeholder={lang === 'ur' ? 'Misaal: G-13, F-10, DHA Phase 5' : 'e.g., G-13, F-10, DHA Phase 5'}
          placeholderTextColor={colors.text.placeholder}
          style={[inputStyle, { backgroundColor: colors.bg.surfaceSolid, borderColor: colors.border.subtle, color: colors.text.primary }]}
        />
      </Field>

      <GradientButton
        label={lang === 'ur' ? 'Khidmat AI Shuru Karein' : 'Enter Khidmat AI'}
        iconRight="sparkles"
        onPress={onComplete}
        size="lg"
        style={{ marginTop: spacing.xxl, width: '100%' }}
      />
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
          marginLeft: 4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
};

const inputStyle: any = {
  borderRadius: radii.md,
  borderWidth: 1,
  fontSize: 15,
  paddingHorizontal: 14,
  paddingVertical: 13,
  ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
};
