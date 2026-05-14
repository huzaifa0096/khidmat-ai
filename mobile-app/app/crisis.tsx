/**
 * Crisis Mode — Apple-style urgent UI with calm precision (not panic).
 */
import React from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { GradientButton } from '../src/components/GradientButton';
import { confirmBooking, fetchTraces, parseAndRank } from '../src/services/api';

export default function CrisisScreen() {
  const router = useRouter();
  const { lang, t, currentTrace, setCurrentTrace, user, setCurrentBooking, colors } = useApp();
  const [booking, setBooking] = React.useState(false);
  const [hydrating, setHydrating] = React.useState(!currentTrace?.crisis);
  const [demoTrigger, setDemoTrigger] = React.useState(0);

  // Fallback: if currentTrace is empty (page reload, deep-link, or direct tab tap),
  // (1) try the most recent crisis trace; (2) if none, auto-fire a demo emergency
  // so the Crisis Mode tab is never empty during a demo.
  React.useEffect(() => {
    if (currentTrace?.crisis) {
      setHydrating(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setHydrating(true);
      // 1. Try most recent crisis trace
      try {
        const data = await fetchTraces();
        const recentCrisis = (data?.traces || []).find((tr: any) =>
          tr.steps?.some((s: any) => s.agent === 'crisis_specialist')
        );
        if (!cancelled && recentCrisis) {
          const intentStep = recentCrisis.steps.find((s: any) => s.agent === 'intent_parser');
          const crisisStep = recentCrisis.steps.find(
            (s: any) => s.agent === 'crisis_specialist' && s.output
          );
          const rankStep = recentCrisis.steps.find((s: any) => s.agent === 'ranking_reasoning');
          if (crisisStep?.output) {
            setCurrentTrace({
              trace_id: recentCrisis.trace_id,
              intent: intentStep?.output,
              crisis: crisisStep?.output,
              ranking: rankStep?.output,
              original_input: recentCrisis.user_input,
            });
            setHydrating(false);
            return;
          }
        }
      } catch {}

      // 2. No prior crisis — auto-fire a demo emergency so judges see the flow
      try {
        const demoInput =
          lang === 'ur'
            ? 'Ghar mein pani bhar gaya hai foran plumber bhejo G-10'
            : 'Water flooding at home, send plumber immediately G-10';
        const data = await parseAndRank(demoInput, user.id || 'U001');
        if (!cancelled && data?.crisis) {
          setCurrentTrace({
            trace_id: data.trace_id,
            intent: data.intent,
            crisis: data.crisis,
            ranking: data.ranking,
            original_input: demoInput,
          });
        }
      } catch {}
      if (!cancelled) setHydrating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentTrace?.crisis, demoTrigger]);

  if (hydrating) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Crisis Mode' : 'Crisis Mode'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.semantic.danger} />
          <Text style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 12 }}>
            {lang === 'ur' ? 'Crisis assessment load ho raha hai...' : 'Loading crisis assessment...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTrace?.crisis) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={lang === 'ur' ? 'Crisis Mode' : 'Crisis Mode'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Ionicons name="alert-circle" size={48} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
            {lang === 'ur' ? 'Koi active crisis nahi' : 'No active crisis'}
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
            {lang === 'ur'
              ? 'Emergency input se Crisis Mode trigger hota hai. Home pe ja kar try karein:'
              : 'Crisis Mode is triggered by emergency input. Try one of these from home:'}
          </Text>
          <View style={{ marginTop: 16, gap: 6 }}>
            <Text style={{ color: colors.semantic.danger, fontSize: 12, fontWeight: '600' }}>
              • "Ghar mein pani bhar gaya hai foran plumber bhejo G-10"
            </Text>
            <Text style={{ color: colors.semantic.danger, fontSize: 12, fontWeight: '600' }}>
              • "Water flooding at home, send plumber immediately"
            </Text>
          </View>
          <GradientButton
            label={lang === 'ur' ? 'Demo Crisis Chalayein' : 'Run Demo Crisis'}
            icon="flash"
            onPress={() => setDemoTrigger((n) => n + 1)}
            variant="danger"
            style={{ marginTop: 24 }}
          />
          <GradientButton
            label={lang === 'ur' ? 'Home Wapas' : 'Go Home'}
            icon="home"
            onPress={() => router.replace('/')}
            variant="ghost"
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const crisis = currentTrace.crisis;
  const assessment = crisis.crisis_assessment;
  const dispatch = crisis.dispatch_plan;
  const top3 = currentTrace.ranking?.top_3 || [];

  const severityColor =
    assessment.severity === 'critical'
      ? colors.semantic.danger
      : assessment.severity === 'high'
      ? colors.ios.orange
      : assessment.severity === 'medium'
      ? colors.semantic.warning
      : colors.semantic.info;

  const handleEmergencyBook = async () => {
    if (top3.length === 0) {
      Alert.alert('No provider available', 'No emergency-eligible provider found');
      return;
    }
    setBooking(true);
    try {
      const data = await confirmBooking(currentTrace.trace_id, top3[0].provider_id, user, 'now');
      setCurrentBooking(data);
      router.replace('/booking-confirmed');
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.message);
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      {/* Pulsing emergency banner */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <MotiView
          from={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
        >
          <LinearGradient
            colors={colors.brand.gradientEmergency}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
            }}
          >
            <MotiView
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 600, loop: true, repeatReverse: true }}
            >
              <Ionicons name="warning" size={26} color="#fff" />
            </MotiView>
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}
              >
                {t.crisis.title}
              </Text>
              <Text style={{ color: '#fff', fontSize: 12, opacity: 0.92, marginTop: 1 }}>
                {t.crisis.subtitle}
              </Text>
            </View>
          </LinearGradient>
        </MotiView>
      </View>

      <Header
        title={assessment.type?.replace(/_/g, ' ').toUpperCase()}
        subtitle={`Confidence ${Math.round(assessment.confidence * 100)}%`}
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Assessment */}
        <GlassCard variant="tinted" tintColor={severityColor}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                }}
              >
                {lang === 'ur' ? 'HALAAT KA JAIZA' : 'CRISIS ASSESSMENT'}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 22,
                  fontWeight: '800',
                  marginTop: 4,
                  letterSpacing: -0.4,
                  textTransform: 'capitalize',
                }}
              >
                {assessment.type?.replace(/_/g, ' ')}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radii.pill,
                backgroundColor: severityColor + '22',
                borderWidth: 1,
                borderColor: severityColor + '88',
              }}
            >
              <Text
                style={{
                  color: severityColor,
                  fontSize: 11,
                  fontWeight: '800',
                  letterSpacing: 0.6,
                }}
              >
                {assessment.severity.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <Pill label={lang === 'ur' ? 'Yaqeen' : 'Confidence'} value={`${Math.round(assessment.confidence * 100)}%`} />
            <Pill label={lang === 'ur' ? 'Area-wide' : 'Area-wide'} value={assessment.area_wide ? 'YES' : 'NO'} />
            <Pill label={lang === 'ur' ? 'Saboot' : 'Evidence'} value={String(assessment.evidence?.length || 0)} />
          </View>

          <View style={{ marginTop: spacing.md, gap: 6 }}>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
              }}
            >
              {lang === 'ur' ? 'SABOOT' : 'EVIDENCE CHAIN'}
            </Text>
            {assessment.evidence?.map((ev: string, i: number) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color={severityColor}
                  style={{ marginTop: 3 }}
                />
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: 13,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {ev}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Dispatch */}
        <GlassCard>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
            }}
          >
            {lang === 'ur' ? 'DISPATCH PLAN' : 'DISPATCH PLAN'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
            <Pill
              label="Primary"
              value={String(dispatch.primary_providers?.length || 0)}
              color={colors.semantic.danger}
            />
            <Pill
              label="Secondary"
              value={String(dispatch.secondary_providers?.length || 0)}
              color={colors.ios.orange}
            />
            <Pill
              label={lang === 'ur' ? 'Backup' : 'Redundancy'}
              value={dispatch.redundancy ? '✓' : '✗'}
              color={colors.semantic.success}
            />
          </View>
          {dispatch.primary_providers?.map((p: any, i: number) => (
            <View
              key={i}
              style={{
                marginTop: spacing.sm,
                padding: 12,
                backgroundColor: colors.bg.elevated,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.semantic.success + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="person" size={18} color={colors.semantic.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    letterSpacing: -0.3,
                  }}
                >
                  {p.business_name}
                </Text>
                <Text
                  style={{ color: colors.text.tertiary, fontSize: 12, marginTop: 1, textTransform: 'capitalize' }}
                >
                  {p.role}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    color: colors.semantic.warning,
                    fontSize: 18,
                    fontWeight: '800',
                    letterSpacing: -0.3,
                  }}
                >
                  {p.eta_minutes}m
                </Text>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                  }}
                >
                  ETA
                </Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Area Alert */}
        {crisis.area_alert ? (
          <GlassCard variant="tinted" tintColor={colors.ios.orange}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="megaphone" size={18} color={colors.ios.orange} />
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                }}
              >
                {t.crisis.areaAlert.toUpperCase()} · {crisis.area_alert.audience_estimated} USERS
              </Text>
            </View>
            <Text
              style={{
                color: colors.text.primary,
                fontSize: 14,
                marginTop: spacing.sm,
                lineHeight: 20,
                letterSpacing: -0.2,
              }}
            >
              {lang === 'ur' ? crisis.area_alert.message_ur : crisis.area_alert.message_en}
            </Text>
          </GlassCard>
        ) : null}

        {/* Pricing */}
        <GlassCard>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                }}
              >
                {t.crisis.surcharge.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 22,
                  fontWeight: '800',
                  marginTop: 4,
                  letterSpacing: -0.4,
                }}
              >
                {crisis.pricing.estimated_cost_pkr}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radii.pill,
                backgroundColor: colors.semantic.warning + '22',
                borderWidth: 1,
                borderColor: colors.semantic.warning + '88',
              }}
            >
              <Text
                style={{
                  color: colors.semantic.warning,
                  fontSize: 14,
                  fontWeight: '800',
                  letterSpacing: 0.4,
                }}
              >
                {crisis.pricing.emergency_surcharge_multiplier}×
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 12,
              marginTop: 8,
              lineHeight: 17,
            }}
          >
            {crisis.pricing.surcharge_reason}
          </Text>
        </GlassCard>

        {/* Outcome */}
        {crisis.outcome_projection ? (
          <GlassCard>
            <Text
              style={{
                color: colors.text.tertiary,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.2,
              }}
            >
              {lang === 'ur' ? 'OUTCOME PROJECTION' : 'OUTCOME PROJECTION'}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <BeforeAfter
                label="Before"
                color={colors.semantic.danger}
                text={crisis.outcome_projection.before}
              />
              <BeforeAfter
                label="After"
                color={colors.semantic.success}
                text={crisis.outcome_projection.after}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                marginTop: spacing.md,
                alignItems: 'center',
                backgroundColor: colors.bg.elevated,
                padding: 12,
                borderRadius: radii.md,
              }}
            >
              <Ionicons name="speedometer" size={22} color={colors.semantic.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 13 }}>
                  {lang === 'ur' ? 'Response time' : 'Response time'}
                </Text>
                <Text
                  style={{
                    color: colors.semantic.success,
                    fontSize: 17,
                    fontWeight: '800',
                    letterSpacing: -0.3,
                  }}
                >
                  {crisis.outcome_projection.metrics.response_time_minutes}min
                  <Text style={{ color: colors.text.tertiary, fontWeight: '500', fontSize: 13 }}>
                    {'  vs '}{crisis.outcome_projection.metrics.vs_baseline_minutes}min
                  </Text>
                </Text>
              </View>
              <Text
                style={{
                  color: colors.semantic.success,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                }}
              >
                ↓{crisis.outcome_projection.metrics.improvement_percent}%
              </Text>
            </View>
          </GlassCard>
        ) : null}

        <GradientButton
          label={lang === 'ur' ? 'Foran Dispatch Karein' : 'Dispatch Now'}
          icon="rocket"
          onPress={handleEmergencyBook}
          loading={booking}
          variant="danger"
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const Pill = ({ label, value, color }: any) => {
  const { colors } = useApp();
  const resolvedColor = color || colors.text.primary;
  return (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.elevated,
      paddingVertical: 10,
      borderRadius: radii.md,
      alignItems: 'center',
    }}
  >
    <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color: resolvedColor, fontSize: 18, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 }}>
      {value}
    </Text>
  </View>
  );
};

const BeforeAfter = ({ label, color, text }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.elevated,
      padding: 12,
      borderRadius: radii.md,
      borderLeftWidth: 3,
      borderLeftColor: color,
    }}
  >
    <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4, lineHeight: 16 }}>
      {text}
    </Text>
  </View>
  );
};
