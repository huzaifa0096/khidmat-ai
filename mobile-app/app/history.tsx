/**
 * Booking history.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { fetchBookings, fetchTraces } from '../src/services/api';

export default function HistoryScreen() {
  const router = useRouter();
  const { lang, t, user, colors } = useApp();
  const [bookings, setBookings] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchBookings(user.id), fetchTraces()])
      .then(([b, tr]) => {
        setBookings(b.bookings || []);
        setTraces(tr.traces || []);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={lang === 'ur' ? 'History' : 'History'} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {loading ? (
          <ActivityIndicator color={colors.brand.textAccent} style={{ marginTop: 50 }} />
        ) : (
          <>
            <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ur' ? 'Bookings' : 'Bookings'} · {bookings.length}
            </Text>
            {bookings.length === 0 ? (
              <Text style={{ color: colors.text.tertiary, fontSize: 13, textAlign: 'center', marginTop: 30 }}>
                {lang === 'ur' ? 'Abhi tak koi booking nahi' : 'No bookings yet'}
              </Text>
            ) : (
              <View
                style={{
                  backgroundColor: colors.bg.surfaceSolid,
                  borderRadius: radii.lg,
                  overflow: 'hidden',
                  borderWidth: 0.5,
                  borderColor: colors.border.divider,
                }}
              >
                {bookings.map((b, i) => {
                  const statusOk = b.status === 'confirmed' || b.status === 'completed';
                  const statusBad = b.status?.startsWith('cancelled') || b.status === 'declined_by_provider';
                  const dotColor = statusOk
                    ? colors.semantic.success
                    : statusBad
                    ? colors.semantic.danger
                    : colors.ios.orange;
                  return (
                    <MotiView
                      key={b.booking_id}
                      from={{ opacity: 0, translateY: 4 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', delay: i * 50 }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderBottomWidth: i < bookings.length - 1 ? 0.5 : 0,
                          borderBottomColor: colors.border.divider,
                        }}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontSize: 14,
                              fontWeight: '500',
                              letterSpacing: -0.2,
                            }}
                            numberOfLines={1}
                          >
                            {b.provider.business_name}
                          </Text>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 12,
                              marginTop: 1,
                            }}
                            numberOfLines={1}
                          >
                            {b.service.category_name_en} · {b.location.address_text}
                          </Text>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {new Date(b.scheduled_for).toLocaleString()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: colors.text.tertiary,
                            fontSize: 11,
                            textTransform: 'capitalize',
                          }}
                        >
                          {(b.status || '').replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            )}

            <View style={{ height: spacing.lg }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="git-network" size={13} color={colors.brand.textAccent} />
              <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                {lang === 'ur' ? 'Agent Traces' : 'Agent Traces'} · {traces.length}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {traces.slice(0, 15).map((tr, i) => {
                const agents: string[] = (tr.steps || [])
                  .map((s: any) => s.agent)
                  .filter(Boolean);
                const uniqAgents = Array.from(new Set(agents));
                const AGENT_ICON: Record<string, any> = {
                  intent_parser: 'language',
                  provider_discovery: 'search',
                  ranking_reasoning: 'podium',
                  booking_executor: 'checkmark-done',
                  followup_automator: 'time',
                  crisis_specialist: 'warning',
                  bargain_negotiator: 'cash',
                };
                const AGENT_LABEL: Record<string, string> = {
                  intent_parser: 'Intent',
                  provider_discovery: 'Discovery',
                  ranking_reasoning: 'Ranking',
                  booking_executor: 'Booking',
                  followup_automator: 'Follow-up',
                  crisis_specialist: 'Crisis',
                  bargain_negotiator: 'Bargain',
                };
                return (
                  <MotiView
                    key={tr.trace_id}
                    from={{ opacity: 0, translateY: 4 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', delay: i * 40 }}
                  >
                    <Pressable
                      onPress={() => router.push(`/trace/${tr.trace_id}`)}
                      style={({ pressed }) => ({
                        padding: 12,
                        borderRadius: radii.lg,
                        backgroundColor: colors.bg.surfaceSolid,
                        borderWidth: 0.5,
                        borderColor: colors.border.divider,
                        opacity: pressed ? 0.7 : 1,
                        gap: 6,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                          {tr.trace_id?.slice(-10) || '—'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: colors.text.tertiary, fontSize: 10 }}>
                            {tr.duration_ms ? `${tr.duration_ms}ms` : ''}
                          </Text>
                          <Ionicons name="chevron-forward" size={12} color={colors.text.quaternary} />
                        </View>
                      </View>
                      <Text
                        style={{
                          color: colors.text.primary,
                          fontSize: 14,
                          fontWeight: '600',
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={1}
                      >
                        "{tr.user_input || 'agent run'}"
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        {uniqAgents.map((ag, idx) => (
                          <View
                            key={ag}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <View
                              style={{
                                paddingHorizontal: 7,
                                paddingVertical: 3,
                                borderRadius: 999,
                                backgroundColor: colors.brand.textAccent + '18',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Ionicons
                                name={AGENT_ICON[ag] || 'flash'}
                                size={9}
                                color={colors.brand.textAccent}
                              />
                              <Text
                                style={{
                                  color: colors.brand.textAccent,
                                  fontSize: 9,
                                  fontWeight: '700',
                                }}
                              >
                                {AGENT_LABEL[ag] || ag.slice(0, 6)}
                              </Text>
                            </View>
                            {idx < uniqAgents.length - 1 ? (
                              <Text style={{ color: colors.text.quaternary, fontSize: 9 }}>→</Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </Pressable>
                  </MotiView>
                );
              })}
              {traces.length === 0 ? (
                <Text style={{ color: colors.text.tertiary, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                  {lang === 'ur'
                    ? 'Abhi tak koi agent run nahi'
                    : 'No agent runs yet — search a service to create one'}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
