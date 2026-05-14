/**
 * Follow-up Timeline — visualizes the 7-event lifecycle from the Follow-up Automator.
 */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../src/state/AppContext';
import { colors as iconPalette, radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { fetchBookings } from '../src/services/api';

const eventTypeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  reminder_24h: 'alarm',
  provider_status_check: 'logo-whatsapp',
  user_eta_update: 'navigate',
  service_progress_check: 'pulse',
  completion_check: 'checkmark-done',
  rating_prompt: 'star',
  rebooking_prompt: 'refresh',
};

const eventTypeColors: Record<string, string> = {
  reminder_24h: iconPalette.brand.secondary,
  provider_status_check: iconPalette.semantic.success,
  user_eta_update: iconPalette.brand.primaryLight,
  service_progress_check: iconPalette.semantic.warning,
  completion_check: iconPalette.semantic.success,
  rating_prompt: iconPalette.semantic.warning,
  rebooking_prompt: iconPalette.brand.accent,
};

export default function TimelineScreen() {
  const router = useRouter();
  const { lang, t, currentBooking, setCurrentBooking, user, colors } = useApp();
  const [hydrating, setHydrating] = React.useState(!currentBooking?.followup_plan);

  React.useEffect(() => {
    if (currentBooking?.followup_plan) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBookings(user.id);
        const latest = (data?.bookings || []).find((b: any) => b.followup_plan);
        if (!cancelled && latest) {
          setCurrentBooking({
            booking: latest,
            followup_plan: latest.followup_plan,
            trace_id: latest.trace_id,
          });
        }
      } catch {}
      if (!cancelled) setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBooking?.followup_plan]);

  if (hydrating) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={t.followup.title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentBooking?.followup_plan) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={t.followup.title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
            {lang === 'ur' ? 'Koi active booking nahi' : 'No active booking'}
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            {lang === 'ur'
              ? 'Pehle ek service book karein — phir follow-up timeline yahan dikhe gi'
              : 'Book a service first — the follow-up timeline will appear here'}
          </Text>
          <GradientButton
            label={lang === 'ur' ? 'Home Wapas' : 'Go Home'}
            icon="home"
            onPress={() => router.replace('/')}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }
  const fu = currentBooking.followup_plan;
  const events = fu.events || [];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={t.followup.title} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={{ color: colors.text.secondary, fontSize: 14, marginBottom: spacing.sm }}>
          {t.followup.subtitle}
        </Text>

        {/* Branching rules summary */}
        <GlassCard>
          <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            {lang === 'ur' ? 'Automation Plan' : 'Automation Plan'}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
            <Stat label={lang === 'ur' ? 'Events' : 'Events'} value={String(fu.total_events_scheduled)} />
            <Stat label={lang === 'ur' ? 'Branching Rules' : 'Branching Rules'} value={String(fu.branching_rules?.length || 0)} />
            <Stat label={lang === 'ur' ? 'Language' : 'Language'} value={fu.language?.toUpperCase() || '—'} />
          </View>
        </GlassCard>

        {/* Timeline */}
        {events.map((e: any, i: number) => {
          const trig = new Date(e.trigger_at);
          const msg = lang === 'ur' ? e.message_ur : e.message_en;
          const icon = eventTypeIcons[e.type] || 'ellipse';
          const color = eventTypeColors[e.type] || colors.brand.primary;
          return (
            <MotiView
              key={e.event_id}
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', delay: i * 100 }}
              style={{ flexDirection: 'row', gap: 12 }}
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: color,
                  }}
                >
                  <Ionicons name={icon} size={16} color={color} />
                </View>
                {i < events.length - 1 ? (
                  <View style={{ width: 2, flex: 1, backgroundColor: colors.border.default, marginTop: 4 }} />
                ) : null}
              </View>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <View
                  style={{
                    backgroundColor: colors.bg.surface,
                    padding: 12,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700' }}>
                      {e.type.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: colors.bg.elevated,
                      }}
                    >
                      <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600' }}>
                        {e.channel?.toUpperCase()} · {e.audience}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 4 }}>
                    {trig.toLocaleString()}
                  </Text>
                  <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                    {msg}
                  </Text>
                  {e.expected_response ? (
                    <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="git-branch" size={11} color={colors.brand.secondary} />
                      <Text style={{ color: colors.brand.secondary, fontSize: 11 }}>
                        Expects: {e.expected_response}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </MotiView>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value }: any) => {
  const { colors } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.elevated, padding: 10, borderRadius: 10, alignItems: 'center' }}>
      <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
};
