/**
 * Provider Home — dashboard for service providers.
 * Shows job feed (pending + confirmed), earnings, ratings, online/offline toggle.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { GlassCard } from '../src/components/GlassCard';
import { CancelBookingSheet } from '../src/components/CancelBookingSheet';
import { ProviderAICoach } from '../src/components/ProviderAICoach';
import { ProviderCounterSheet } from '../src/components/ProviderCounterSheet';
import { fetchMyJobs, fetchMyEarnings, respondToJob, cancelBooking, fetchMyProfile } from '../src/services/api';

export default function ProviderHomeScreen() {
  const router = useRouter();
  const { lang, user, setMode, signOut, colors } = useApp();
  const [jobs, setJobs] = useState<any>({ pending: [], confirmed: [], completed_today: 0 });
  const [earnings, setEarnings] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [counterJob, setCounterJob] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      Promise.all([
        fetchMyJobs(user.id, user.provider?.provider_id).catch(() => null),
        fetchMyEarnings(user.provider?.provider_id).catch(() => null),
        user.provider?.provider_id
          ? fetchMyProfile({ provider_id: user.provider.provider_id }).catch(() => null)
          : Promise.resolve(null),
      ])
        .then(([j, e, p]) => {
          if (mounted) {
            if (j) setJobs(j);
            if (e) setEarnings(e);
            if (p) setProfile(p);
          }
        })
        .finally(() => mounted && setLoading(false));
    };
    load();
    const id = setInterval(load, 12000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user.id, user.provider?.provider_id]);

  const handleAcceptJob = async (jobId: string) => {
    try {
      const res = await respondToJob(jobId, 'accept');
      setJobs((j: any) => {
        const accepted = j.pending.find((p: any) => p.job_id === jobId);
        return {
          ...j,
          pending: j.pending.filter((p: any) => p.job_id !== jobId),
          confirmed:
            res?.is_real_booking && accepted
              ? [{ ...accepted, status: 'confirmed' }, ...j.confirmed]
              : j.confirmed,
        };
      });
      Alert.alert(
        lang === 'ur' ? 'Accept ✓' : 'Accepted ✓',
        res?.is_real_booking
          ? lang === 'ur'
            ? 'Customer ke device pe live update ho gayi — booking confirmed!'
            : "Customer's screen just flipped to Confirmed — live!"
          : lang === 'ur'
          ? 'Customer ko notification gayi'
          : 'Customer notified'
      );
    } catch {}
  };

  const handleDeclineJob = async (jobId: string) => {
    try {
      await respondToJob(jobId, 'decline');
      setJobs((j: any) => ({
        ...j,
        pending: j.pending.filter((p: any) => p.job_id !== jobId),
      }));
    } catch {}
  };

  const handleCancelConfirmed = async ({ reason_code, reason }: { reason_code: string; reason: string }) => {
    if (!cancellingJobId) return;
    const res = await cancelBooking(cancellingJobId, {
      by_party: 'provider',
      reason_code,
      reason,
    });
    if (res?.success) {
      setJobs((j: any) => ({
        ...j,
        confirmed: j.confirmed.filter((c: any) => c.job_id !== cancellingJobId),
      }));
      Alert.alert(
        lang === 'ur' ? 'Cancel ho gayi' : 'Cancelled',
        lang === 'ur' ? 'Customer ko notification gayi' : 'Customer has been notified'
      );
    }
    setCancellingJobId(null);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 480, paddingHorizontal: spacing.xl }}>
          {/* Top nav */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.border.default,
                }}
              >
                <LinearGradient
                  colors={['#FF9F0A', '#FF375F'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="briefcase" size={17} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 17,
                    fontWeight: '800',
                    letterSpacing: -0.3,
                  }}
                >
                  {user.provider?.business_name || user.name}
                </Text>
                <Text
                  style={{
                    color: colors.text.tertiary,
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 1.2,
                  }}
                >
                  PROVIDER MODE · {user.provider?.provider_id || '—'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => router.push('/chats')}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.bg.surfaceSolid,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={colors.text.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/profile')}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.bg.surfaceSolid,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="person-circle-outline" size={19} color={colors.text.primary} />
              </Pressable>
            </View>
          </View>

          {/* Online/Offline toggle */}
          <GlassCard padded={false}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                gap: 12,
              }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {isOnline ? (
                  <MotiView
                    from={{ scale: 0.9, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true }}
                    style={{
                      position: 'absolute',
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: colors.semantic.success + '88',
                    }}
                  />
                ) : null}
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: isOnline ? colors.semantic.success : colors.ios.gray,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontSize: 15,
                    fontWeight: '700',
                    letterSpacing: -0.2,
                  }}
                >
                  {isOnline ? (lang === 'ur' ? 'Aap online hain' : "You're online") : lang === 'ur' ? 'Aap offline hain' : "You're offline"}
                </Text>
                <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                  {isOnline
                    ? lang === 'ur'
                      ? 'Naye jobs aap ko mil saktay hain'
                      : 'New jobs will be matched to you'
                    : lang === 'ur'
                    ? 'Aap ko jobs nahi milengi'
                    : "You won't receive new jobs"}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: colors.border.subtle, true: colors.semantic.success }}
                thumbColor="#fff"
              />
            </View>
          </GlassCard>

          {/* AI Business Coach — personalized weekly tips */}
          <ProviderAICoach earnings={earnings} profile={profile} />

          {/* My Services — inline list with add button */}
          <View style={{ marginTop: spacing.md }}>
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
                  letterSpacing: 0.5,
                }}
              >
                {lang === 'ur' ? 'MERI SERVICES' : 'MY SERVICES'} · {profile?.services?.total ?? 1}
              </Text>
              <Pressable
                onPress={() => router.push('/my-services')}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text
                  style={{
                    color: colors.brand.textAccent,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {lang === 'ur' ? 'Manage' : 'Manage'} →
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                backgroundColor: colors.bg.surfaceSolid,
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: 0.5,
                borderColor: colors.border.divider,
              }}
            >
              {/* Primary service row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border.divider,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    backgroundColor: colors.brand.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="star" size={14} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 14,
                      fontWeight: '500',
                      letterSpacing: -0.2,
                    }}
                  >
                    {profile?.services?.primary?.name_en ||
                      user.provider?.primary_service?.replace(/_/g, ' ') ||
                      'Primary service'}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                    Primary
                  </Text>
                </View>
              </View>

              {/* Secondary services */}
              {(profile?.services?.secondary || []).map((s: any, i: number) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    gap: 10,
                    borderBottomWidth: 0.5,
                    borderBottomColor: colors.border.divider,
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
                      size={14}
                      color={colors.semantic.success}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 14,
                      flex: 1,
                      letterSpacing: -0.2,
                    }}
                  >
                    {s.name_en}
                  </Text>
                </View>
              ))}

              {/* Add another row */}
              <Pressable onPress={() => router.push('/my-services')}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      gap: 10,
                      backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        backgroundColor: colors.brand.primary + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.brand.textAccent} />
                    </View>
                    <Text
                      style={{
                        color: colors.brand.textAccent,
                        fontSize: 14,
                        flex: 1,
                        fontWeight: '500',
                        letterSpacing: -0.2,
                      }}
                    >
                      {lang === 'ur' ? 'Nayi service add karein' : 'Add another service'}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.text.quaternary} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Earnings overview */}
          <View style={{ marginTop: spacing.md }}>
            <SectionLabel text={lang === 'ur' ? 'EARNINGS' : 'EARNINGS'} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <EarningBlock
                label={lang === 'ur' ? 'AAJ' : 'TODAY'}
                amount={earnings?.today_pkr ?? 0}
                color={colors.ios.green}
                icon="cash"
                highlight
              />
              <EarningBlock
                label={lang === 'ur' ? 'HAFTA' : 'WEEK'}
                amount={earnings?.week_pkr ?? 0}
                color={colors.ios.cyan}
                icon="calendar"
              />
              <EarningBlock
                label={lang === 'ur' ? 'MAHEENA' : 'MONTH'}
                amount={earnings?.month_pkr ?? 0}
                color={colors.ios.purple}
                icon="trending-up"
              />
            </View>

            {/* 7-day mini chart */}
            {earnings?.series_7d ? (
              <View
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: radii.md,
                  backgroundColor: colors.bg.surfaceSolid,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                    LAST 7 DAYS
                  </Text>
                  <Text style={{ color: colors.semantic.success, fontSize: 11, fontWeight: '800' }}>
                    +{Math.round(((earnings.series_7d[earnings.series_7d.length - 1].amount - earnings.series_7d[0].amount) / Math.max(1, earnings.series_7d[0].amount)) * 100)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 50, gap: 6 }}>
                  {earnings.series_7d.map((s: any, i: number) => {
                    const max = Math.max(...earnings.series_7d.map((x: any) => x.amount));
                    const h = (s.amount / max) * 100;
                    return (
                      <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                        <View
                          style={{
                            width: '100%',
                            height: `${h}%`,
                            borderRadius: 3,
                            backgroundColor: colors.brand.accent,
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {earnings.series_7d.map((s: any, i: number) => (
                    <Text key={i} style={{ flex: 1, color: colors.text.quaternary, fontSize: 8, fontWeight: '700', textAlign: 'center' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
            <Mini icon="star" color={colors.brand.primary} value={earnings?.rating?.toFixed(1) || '4.7'} label={lang === 'ur' ? 'RATING' : 'RATING'} />
            <Mini icon="people" color={colors.brand.primary} value={String(earnings?.reviews_count || 23)} label={lang === 'ur' ? 'REVIEWS' : 'REVIEWS'} />
            <Mini icon="checkmark-done" color={colors.brand.primary} value={String(earnings?.bookings_completed || 14)} label={lang === 'ur' ? 'JOBS' : 'JOBS'} />
            <Mini icon="trending-up" color={colors.brand.primary} value={`PKR ${earnings?.avg_per_job_pkr || 2150}`} label={lang === 'ur' ? 'AVG' : 'AVG'} small />
          </View>

          {/* Pending jobs */}
          <SectionLabel text={lang === 'ur' ? `PENDING REQUESTS · ${jobs.pending?.length || 0}` : `PENDING REQUESTS · ${jobs.pending?.length || 0}`} style={{ marginTop: spacing.lg }} />
          {loading ? (
            <ActivityIndicator color={colors.brand.textAccent} />
          ) : jobs.pending?.length === 0 ? (
            <GlassCard>
              <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                <Ionicons name="checkmark-done-circle" size={32} color={colors.semantic.success} />
                <Text style={{ color: colors.text.secondary, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                  {lang === 'ur' ? 'Sab pending jobs handle ho gayi!' : 'All caught up — no pending requests'}
                </Text>
              </View>
            </GlassCard>
          ) : (
            jobs.pending?.map((j: any, i: number) => (
              <MotiView
                key={j.job_id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300, delay: i * 80 }}
                style={{ marginBottom: 10 }}
              >
                <JobCard
                  job={j}
                  lang={lang}
                  onAccept={() => handleAcceptJob(j.job_id)}
                  onDecline={() => handleDeclineJob(j.job_id)}
                  onCounter={() => setCounterJob(j)}
                />
              </MotiView>
            ))
          )}

          {/* Confirmed jobs */}
          <SectionLabel text={lang === 'ur' ? `CONFIRMED · ${jobs.confirmed?.length || 0}` : `CONFIRMED · ${jobs.confirmed?.length || 0}`} style={{ marginTop: spacing.lg }} />
          {jobs.confirmed?.length === 0 ? (
            <GlassCard>
              <Text style={{ color: colors.text.tertiary, fontSize: 13, textAlign: 'center', paddingVertical: 10 }}>
                {lang === 'ur' ? 'Koi confirmed job nahi' : 'No confirmed jobs yet'}
              </Text>
            </GlassCard>
          ) : (
            jobs.confirmed?.slice(0, 5).map((j: any, i: number) => (
              <View
                key={j.job_id}
                style={{
                  backgroundColor: colors.bg.surfaceSolid,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  padding: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: colors.semantic.success + '22',
                    borderWidth: 1,
                    borderColor: colors.semantic.success + '55',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.semantic.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text.primary, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>
                    {j.service_text}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 11, marginTop: 1 }}>
                    {j.customer_name} · {j.sector} · {new Date(j.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>
                <Text style={{ color: colors.ios.green, fontSize: 11, fontWeight: '700', marginRight: 6 }}>
                  {j.price_estimate}
                </Text>
                {j.is_real ? (
                  <>
                    <Pressable
                      onPress={() => router.push(`/chat/${j.job_id}`)}
                      style={({ pressed }) => ({
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.brand.primary + '55',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1,
                        marginRight: 6,
                      })}
                    >
                      <Ionicons name="chatbubbles" size={14} color={colors.brand.textAccent} />
                    </Pressable>
                    <Pressable
                      onPress={() => setCancellingJobId(j.job_id)}
                      style={({ pressed }) => ({
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: colors.semantic.danger + '55',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1,
                      })}
                    >
                      <Ionicons name="close" size={14} color={colors.semantic.danger} />
                    </Pressable>
                  </>
                ) : null}
              </View>
            ))
          )}

          {/* Switch back to customer */}
          <View style={{ marginTop: spacing.xl, gap: 8 }}>
            <Pressable
              onPress={() => {
                setMode('customer');
                router.replace('/');
              }}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: radii.md,
                backgroundColor: colors.bg.surfaceSolid,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Ionicons name="swap-horizontal" size={17} color={colors.brand.textAccent} />
              <Text style={{ color: colors.brand.textAccent, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 }}>
                {lang === 'ur' ? 'Customer Mode pe wapas jayein' : 'Switch to Customer Mode'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <Text
            style={{
              color: colors.text.quaternary,
              fontSize: 10,
              textAlign: 'center',
              marginTop: spacing.lg,
              fontWeight: '600',
              letterSpacing: 0.3,
            }}
          >
            Khidmat AI Provider OS · Powered by Antigravity · 6 specialized agents matching customers to you
          </Text>
        </View>
      </ScrollView>

      <CancelBookingSheet
        visible={!!cancellingJobId}
        onClose={() => setCancellingJobId(null)}
        onConfirm={handleCancelConfirmed}
        byParty="provider"
        lang={lang}
      />

      <ProviderCounterSheet
        visible={!!counterJob}
        onClose={() => setCounterJob(null)}
        jobId={counterJob?.job_id || ''}
        customerOfferedPkr={
          (() => {
            const est = counterJob?.price_estimate || '';
            const num = parseInt(String(est).replace(/[^\d]/g, '').slice(0, 5), 10);
            return num || 2000;
          })()
        }
        onCounterSent={() => {
          // Remove from pending list since status is now pending_customer_counter_response
          setJobs((j: any) => ({
            ...j,
            pending: j.pending.filter((p: any) => p.job_id !== counterJob?.job_id),
          }));
        }}
      />
    </SafeAreaView>
  );
}

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

const EarningBlock = ({ label, amount, color, icon, highlight }: any) => {
  const { colors } = useApp();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: highlight ? color + '15' : colors.bg.surfaceSolid,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: highlight ? color + '88' : colors.border.subtle,
        padding: 12,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Ionicons name={icon} size={11} color={color} />
        <Text style={{ color: colors.text.tertiary, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 }}>
        PKR {amount.toLocaleString()}
      </Text>
    </View>
  );
};

const Mini = ({ icon, color, value, label, small }: any) => {
  const { colors } = useApp();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.surfaceSolid,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        padding: 10,
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text style={{ color: colors.text.primary, fontSize: small ? 11 : 15, fontWeight: '800', letterSpacing: -0.3 }}>
        {value}
      </Text>
      <Text style={{ color: colors.text.tertiary, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
};

const JobCard = ({ job, lang, onAccept, onDecline, onCounter }: any) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      backgroundColor: colors.bg.surfaceSolid,
      borderRadius: radii.lg,
      overflow: 'hidden',
    }}
  >
    {/* Top header — flat elevated surface, no gradient */}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: colors.bg.elevated,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border.divider,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons
          name={job.is_real ? 'flash' : 'alarm-outline'}
          size={12}
          color={job.is_real ? colors.semantic.success : colors.brand.textAccent}
        />
        <Text
          style={{
            color: job.is_real ? colors.semantic.success : colors.brand.textAccent,
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 0.8,
          }}
        >
          {job.is_real
            ? `LIVE BOOKING · ${job.job_id?.slice(-5) || ''}`
            : `NEW REQUEST · ${job.scheduled_in}min`}
        </Text>
      </View>
      <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700' }}>
        {job.distance_km} km
      </Text>
    </View>

    <View style={{ padding: 14 }}>
      <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 19 }}>
        {job.service_text}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="person" size={11} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '600' }}>
            {job.customer_name}
          </Text>
        </View>
        <Text style={{ color: colors.text.quaternary, fontSize: 12 }}>·</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location" size={11} color={colors.text.tertiary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '600' }}>
            {job.sector}
          </Text>
        </View>
        <Text style={{ color: colors.text.quaternary, fontSize: 12 }}>·</Text>
        <Text style={{ color: colors.text.primary, fontSize: 12, fontWeight: '700' }}>
          {job.price_estimate}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        <Pressable
          onPress={onDecline}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: colors.bg.elevated,
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: '700' }}>
            {lang === 'ur' ? 'Decline' : 'Decline'}
          </Text>
        </Pressable>
        {job.is_real && onCounter ? (
          <Pressable
            onPress={onCounter}
            style={({ pressed }) => ({
              flex: 1.3,
              paddingVertical: 10,
              borderRadius: radii.pill,
              backgroundColor: colors.brand.accent + '22',
              borderWidth: 1,
              borderColor: colors.brand.accent + '55',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="swap-horizontal" size={12} color={colors.brand.accent} />
            <Text style={{ color: colors.brand.accent, fontSize: 12, fontWeight: '700' }}>
              {lang === 'ur' ? 'Counter' : 'Counter'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => ({
            flex: 1.5,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: colors.brand.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="checkmark" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
            {lang === 'ur' ? 'Accept' : 'Accept'}
          </Text>
        </Pressable>
      </View>
    </View>
  </View>
  );
};
