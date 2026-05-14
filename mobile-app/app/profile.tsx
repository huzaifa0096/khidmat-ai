/**
 * Profile — Apple iOS Settings-style account screen.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, lang, signOut, mode, setMode, isProvider, colors } = useApp();

  const handleSignOut = () => {
    Alert.alert(
      lang === 'ur' ? 'Sign out?' : 'Sign out?',
      lang === 'ur' ? 'Aap sign out karna chahte hain?' : 'Are you sure you want to sign out?',
      [
        { text: lang === 'ur' ? 'Cancel' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'ur' ? 'Sign out' : 'Sign out',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={lang === 'ur' ? 'Profile' : 'Profile'} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: spacing.xxxl,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: spacing.xl }}>
          {/* Avatar Hero — quieter */}
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 360 }}
            style={{ alignItems: 'center', marginVertical: spacing.lg }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                overflow: 'hidden',
              }}
            >
              <Image
                source={{ uri: `https://i.pravatar.cc/300?u=${user.avatarSeed}` }}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 22,
                fontWeight: '700',
                marginTop: spacing.md,
                letterSpacing: -0.6,
              }}
            >
              {user.name}
            </Text>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 13,
                marginTop: 2,
              }}
            >
              +92 {user.phone} · {user.city.charAt(0).toUpperCase() + user.city.slice(1)}
            </Text>
          </MotiView>

          {/* Stats row — mono */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.lg }}>
            <StatBlock value="2" label={lang === 'ur' ? 'Bookings' : 'Bookings'} />
            <StatBlock value="4.8" label={lang === 'ur' ? 'Rating' : 'Rating'} />
            <StatBlock value="PKR 2.4k" label={lang === 'ur' ? 'Saved' : 'Saved'} />
          </View>

          {/* Account section */}
          <SectionLabel text={lang === 'ur' ? 'ACCOUNT' : 'ACCOUNT'} />
          <GlassCard padded={false}>
            <Row icon="person-circle" color={colors.ios.blue} label={lang === 'ur' ? 'Personal Info' : 'Personal Info'} value={user.name} onPress={() => Alert.alert('Profile', 'Editing coming soon')} />
            <Row icon="location" color={colors.ios.red} label={lang === 'ur' ? 'Location' : 'Location'} value={`${user.sector || ''}, ${user.city.charAt(0).toUpperCase() + user.city.slice(1)}`} onPress={() => Alert.alert('Location', 'Edit in settings')} />
            <Row icon="mail" color={colors.ios.purple} label="Email" value={user.email || lang === 'ur' ? 'Set karein' : 'Not set'} onPress={() => Alert.alert('Email', 'Add your email in settings')} />
            <Row icon="card" color={colors.ios.green} label={lang === 'ur' ? 'Payment Method' : 'Payment'} value={lang === 'ur' ? 'Cash on completion' : 'Cash on completion'} onPress={() => Alert.alert('Payment', 'Add a card or wallet')} last />
          </GlassCard>

          {/* Bookings & history */}
          <SectionLabel text={lang === 'ur' ? 'ACTIVITY' : 'ACTIVITY'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <Row icon="time" color={colors.ios.cyan} label={lang === 'ur' ? 'Booking History' : 'Booking History'} onPress={() => router.push('/history')} />
            <Row icon="git-network" color={colors.ios.purple} label={lang === 'ur' ? 'Agent Trace / Logs (Audit)' : 'Agent Trace / Logs (Audit)'} value="6 agents" onPress={() => router.push('/history')} highlight />
            {isProvider ? (
              <Row icon="briefcase" color={colors.brand.primary} label={lang === 'ur' ? 'Meri Services' : 'My Services'} value="Provider" onPress={() => router.push('/my-services')} highlight />
            ) : (
              <Row icon="briefcase" color={colors.brand.primary} label={lang === 'ur' ? 'Service List Karein' : 'List Your Service'} value="Setup" onPress={() => router.push('/become-provider')} highlight />
            )}
            <Row icon="bookmark" color={colors.ios.pink} label={lang === 'ur' ? 'Saved Providers' : 'Saved Providers'} value="0" onPress={() => Alert.alert('Saved', 'Bookmark providers from their detail page')} last />
          </GlassCard>

          {/* Discovery */}
          <SectionLabel text={lang === 'ur' ? 'DISCOVER' : 'DISCOVER'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <Row icon="sparkles" color={colors.ios.yellow} label={lang === 'ur' ? 'For You — AI Recommendations' : 'For You — AI Recommendations'} onPress={() => router.push('/for-you')} highlight />
            <Row icon="map" color={colors.ios.green} label={lang === 'ur' ? 'Live Provider Map' : 'Live Provider Map'} onPress={() => router.push('/map')} highlight />
            <Row icon="analytics" color={colors.ios.indigo} label={lang === 'ur' ? 'Smart Insights' : 'Smart Insights'} onPress={() => router.push('/insights')} last />
          </GlassCard>

          {/* Provider Mode */}
          <SectionLabel text={lang === 'ur' ? 'BUSINESS' : 'BUSINESS'} style={{ marginTop: spacing.lg }} />
          {isProvider ? (
            <View
              style={{
                backgroundColor: colors.bg.surfaceSolid,
                borderRadius: radii.lg,
                overflow: 'hidden',
              }}
            >
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: colors.bg.elevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="briefcase-outline" size={18} color={colors.text.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '800', letterSpacing: -0.3 }}>
                      {user.provider?.business_name}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                      {user.provider?.primary_service?.replace(/_/g, ' ')} · {user.provider?.provider_id}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: colors.bg.elevated,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: colors.semantic.success,
                      }}
                    />
                    <Text style={{ color: colors.text.secondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                      ACTIVE
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    setMode(mode === 'provider' ? 'customer' : 'provider');
                    router.replace(mode === 'provider' ? '/' : '/provider-home');
                  }}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: colors.text.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Ionicons name="swap-horizontal" size={14} color={colors.bg.primary} />
                  <Text
                    style={{
                      color: colors.bg.primary,
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                    }}
                  >
                    {mode === 'provider'
                      ? lang === 'ur'
                        ? 'Customer Mode pe jayein'
                        : 'Switch to Customer Mode'
                      : lang === 'ur'
                      ? 'Provider Dashboard kholein'
                      : 'Open Provider Dashboard'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/become-provider')}
              style={({ pressed }) => ({
                borderRadius: radii.lg,
                overflow: 'hidden',
                backgroundColor: colors.bg.surfaceSolid,
                borderWidth: colors.text.inverse === '#000000' ? 0 : 0.5,
                borderColor: colors.border.divider,
                padding: 16,
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
                <Ionicons name="briefcase" size={18} color="#fff" />
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
                  {lang === 'ur' ? 'Provider Banein' : 'Become a Provider'}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 2 }}>
                  {lang === 'ur' ? 'Apni service list karein, earn karna shuru karein' : 'List your service and start earning'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.quaternary} />
            </Pressable>
          )}

          {/* Subscription teaser — calm card */}
          <SectionLabel text={lang === 'ur' ? 'KHIDMAT PLUS' : 'KHIDMAT PLUS'} style={{ marginTop: spacing.lg }} />
          <Pressable
            onPress={() => Alert.alert('Khidmat Plus', lang === 'ur' ? 'Coming soon — early access mein hain' : 'Coming soon — early access')}
            style={({ pressed }) => ({
              borderRadius: radii.lg,
              overflow: 'hidden',
              backgroundColor: colors.bg.surfaceSolid,
              borderWidth: 0.5,
              borderColor: colors.border.divider,
              padding: 16,
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
                backgroundColor: colors.brand.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="diamond" size={18} color={colors.brand.textAccent} />
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
                Khidmat Plus
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 2 }}>
                {lang === 'ur'
                  ? 'PKR 499/mo · Free visits · Priority dispatch'
                  : 'PKR 499/mo · Free visits · Priority dispatch'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.quaternary} />
          </Pressable>

          {/* Settings */}
          <SectionLabel text={lang === 'ur' ? 'PREFERENCES' : 'PREFERENCES'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <Row icon="settings" color={colors.ios.gray} label={lang === 'ur' ? 'Settings' : 'Settings'} onPress={() => router.push('/settings')} />
            <Row icon="speedometer" color={colors.ios.indigo} label={lang === 'ur' ? 'Admin Dashboard' : 'Admin Dashboard'} value="Demo" onPress={() => router.push('/admin')} />
            <Row icon="help-circle" color={colors.ios.teal} label={lang === 'ur' ? 'Help & Support' : 'Help & Support'} onPress={() => Alert.alert('Help', 'WhatsApp: 0300-KHIDMAT')} />
            <Row icon="information-circle" color={colors.ios.blue} label={lang === 'ur' ? 'About' : 'About'} value="v1.0" onPress={() => router.push('/settings')} last />
          </GlassCard>

          {/* Sign out */}
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              marginTop: spacing.xl,
              padding: 16,
              borderRadius: radii.md,
              backgroundColor: colors.semantic.danger + '15',
              borderWidth: 1,
              borderColor: colors.semantic.danger + '44',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.semantic.danger} />
            <Text
              style={{
                color: colors.semantic.danger,
                fontSize: 15,
                fontWeight: '700',
              }}
            >
              {lang === 'ur' ? 'Sign Out' : 'Sign Out'}
            </Text>
          </Pressable>

          {/* Footer signature */}
          <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: 4 }}>
            <Text style={{ color: colors.text.quaternary, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 }}>
              Khidmat AI · v1.0 · Powered by Google Antigravity
            </Text>
            <Text style={{ color: colors.text.quaternary, fontSize: 10, fontWeight: '500' }}>
              Member since {user.joinedAt}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatBlock = ({ value, label }: { value: string; label: string }) => {
  const { colors, theme } = useApp();
  const isDark = theme === 'dark';
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.surfaceSolid,
        borderRadius: radii.md,
        borderWidth: isDark ? 0.5 : 0,
        borderColor: isDark ? colors.border.divider : 'transparent',
        paddingVertical: 14,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: colors.text.primary,
          fontSize: 19,
          fontWeight: '700',
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
};

const Row = ({ icon, color, label, value, onPress, last, highlight }: any) => {
  const { colors, theme } = useApp();
  const isDark = theme === 'dark';
  const showDivider = !last;
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 11,
            paddingHorizontal: 14,
            borderBottomWidth: showDivider ? 0.5 : 0,
            borderBottomColor: isDark
              ? colors.border.divider
              : 'rgba(0,0,0,0.06)',
            backgroundColor: pressed ? colors.bg.elevated : 'transparent',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={15} color="#fff" />
          </View>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 15,
              fontWeight: '400',
              flex: 1,
              letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          {value ? (
            <Text style={{ color: colors.text.tertiary, fontSize: 13 }}>{value}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={14} color={colors.text.quaternary} />
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
