/**
 * Settings — iOS-style preferences screen with toggles and sections.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { Logo } from '../src/components/Logo';

export default function SettingsScreen() {
  const { lang, setLang, theme, setTheme, colors } = useApp();
  const dividerColor = theme === 'dark' ? colors.border.subtle : 'transparent';
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [autoLocation, setAutoLocation] = useState(true);
  const [voiceNarration, setVoiceNarration] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={lang === 'ur' ? 'Settings' : 'Settings'} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: spacing.xl }}>
          {/* Language */}
          <SectionLabel text={lang === 'ur' ? 'LANGUAGE' : 'LANGUAGE'} />
          <GlassCard padded={false}>
            <Pressable onPress={() => setLang('ur')}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: theme === 'dark' ? colors.border.subtle : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🇵🇰</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                      اردو · Roman Urdu
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>Pakistan default</Text>
                  </View>
                  {lang === 'ur' && <Ionicons name="checkmark-circle" size={20} color={colors.brand.textAccent} />}
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setLang('en')}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>🇬🇧</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                      English (US)
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>International</Text>
                  </View>
                  {lang === 'en' && <Ionicons name="checkmark-circle" size={20} color={colors.brand.textAccent} />}
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Notifications */}
          <SectionLabel text={lang === 'ur' ? 'NOTIFICATIONS' : 'NOTIFICATIONS'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <ToggleRow icon="notifications" color={colors.ios.red} label={lang === 'ur' ? 'Push Notifications' : 'Push Notifications'} value={pushNotifications} onChange={setPushNotifications} />
            <ToggleRow icon="chatbox-ellipses" color={colors.ios.green} label="SMS" value={smsNotifications} onChange={setSmsNotifications} />
            <ToggleRow icon="logo-whatsapp" color={colors.ios.green} label="WhatsApp" value={whatsappNotifications} onChange={setWhatsappNotifications} />
            <ToggleRow icon="warning" color={colors.ios.orange} label={lang === 'ur' ? 'Emergency Alerts' : 'Emergency Alerts'} value={emergencyAlerts} onChange={setEmergencyAlerts} last />
          </GlassCard>

          {/* Appearance — Theme picker */}
          <SectionLabel text={lang === 'ur' ? 'APPEARANCE' : 'APPEARANCE'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <Pressable onPress={() => setTheme('dark')}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme === 'dark' ? colors.border.subtle : 'transparent',
                    backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: '#0A0A0F',
                      borderWidth: 1,
                      borderColor: colors.border.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="moon" size={17} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                      {lang === 'ur' ? 'Dark Mode' : 'Dark Mode'}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                      {lang === 'ur' ? 'Default · Premium night feel' : 'Default · Premium night feel'}
                    </Text>
                  </View>
                  {theme === 'dark' && <Ionicons name="checkmark-circle" size={20} color={colors.brand.textAccent} />}
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => setTheme('light')}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 13,
                    paddingHorizontal: 14,
                    gap: 12,
                    backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: '#F2F2F7',
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.10)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="sunny" size={17} color="#FF9F0A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                      {lang === 'ur' ? 'Light Mode' : 'Light Mode'}
                    </Text>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                      {lang === 'ur' ? 'Sunlight-friendly · iOS style' : 'Sunlight-friendly · iOS style'}
                    </Text>
                  </View>
                  {theme === 'light' && <Ionicons name="checkmark-circle" size={20} color={colors.brand.textAccent} />}
                </View>
              )}
            </Pressable>
          </GlassCard>

          {/* Experience */}
          <SectionLabel text={lang === 'ur' ? 'EXPERIENCE' : 'EXPERIENCE'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <ToggleRow icon="volume-high" color={colors.ios.cyan} label={lang === 'ur' ? 'AI Voice Narration' : 'AI Voice Narration'} value={voiceNarration} onChange={setVoiceNarration} />
            <ToggleRow icon="phone-portrait" color={colors.ios.pink} label={lang === 'ur' ? 'Haptic Feedback' : 'Haptic Feedback'} value={hapticFeedback} onChange={setHapticFeedback} />
            <ToggleRow icon="locate" color={colors.ios.blue} label={lang === 'ur' ? 'Auto-detect Location' : 'Auto-detect Location'} value={autoLocation} onChange={setAutoLocation} last />
          </GlassCard>

          {/* About */}
          <SectionLabel text={lang === 'ur' ? 'ABOUT' : 'ABOUT'} style={{ marginTop: spacing.lg }} />
          <GlassCard>
            <View style={{ alignItems: 'center', gap: 4, paddingVertical: 6 }}>
              <View style={{ marginBottom: 8 }}>
                <Logo size={60} />
              </View>
              <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>
                Khidmat AI
              </Text>
              <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>Version 1.0.0 · Build 2026.05</Text>
              <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 }}>
                {lang === 'ur'
                  ? 'Pakistan ki informal economy ke liye 6-agent AI orchestrator. Antigravity par built.'
                  : '6-agent AI orchestrator for Pakistan\'s informal economy. Built on Antigravity.'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Badge label="#AISeekho 2026" color={colors.brand.primary} />
                <Badge label="Challenge 2" color={colors.ios.purple} />
                <Badge label="Antigravity" color={colors.ios.cyan} />
              </View>
            </View>
          </GlassCard>

          {/* Legal & Support */}
          <SectionLabel text={lang === 'ur' ? 'LEGAL & SUPPORT' : 'LEGAL & SUPPORT'} style={{ marginTop: spacing.lg }} />
          <GlassCard padded={false}>
            <LinkRow icon="document-text" label={lang === 'ur' ? 'Terms of Service' : 'Terms of Service'} onPress={() => Alert.alert('Terms', 'Coming soon')} />
            <LinkRow icon="shield-checkmark" label={lang === 'ur' ? 'Privacy Policy' : 'Privacy Policy'} onPress={() => Alert.alert('Privacy', 'Coming soon')} />
            <LinkRow icon="help-circle" label={lang === 'ur' ? 'Help Center' : 'Help Center'} onPress={() => Alert.alert('Help', 'WhatsApp: 0300-KHIDMAT')} />
            <LinkRow icon="chatbubbles" label={lang === 'ur' ? 'Contact Support' : 'Contact Support'} onPress={() => Alert.alert('Support', 'support@khidmat.ai')} last />
          </GlassCard>

          <Text
            style={{
              color: colors.text.quaternary,
              fontSize: 11,
              textAlign: 'center',
              marginTop: spacing.xl,
              fontWeight: '500',
            }}
          >
            Made with 💙 in Pakistan
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ToggleRow = ({ icon, color, label, value, onChange, last }: any) => {
  const { colors, theme } = useApp();
  const isDark = theme === 'dark';
  const showDivider = !last;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderBottomWidth: showDivider ? 0.5 : 0,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
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
      <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: '400', flex: 1, letterSpacing: -0.2 }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bg.elevated, true: colors.semantic.success }}
        thumbColor="#fff"
        ios_backgroundColor={colors.bg.elevated}
      />
    </View>
  );
};

const LinkRow = ({ icon, label, onPress, last }: any) => {
  const { colors, theme } = useApp();
  const showDivider = !last && theme === 'dark';
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 13,
            paddingHorizontal: 14,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: theme === 'dark' ? colors.border.subtle : 'transparent',
            backgroundColor: pressed ? colors.bg.elevated : 'transparent',
            gap: 12,
          }}
        >
          <Ionicons name={icon} size={18} color={colors.text.secondary} />
          <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '500', flex: 1 }}>
            {label}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
        </View>
      )}
    </Pressable>
  );
};

const Badge = ({ label, color }: any) => (
  <View
    style={{
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: color + '22',
      borderWidth: 1,
      borderColor: color + '55',
    }}
  >
    <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 0.4 }}>
      {label}
    </Text>
  </View>
);

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
