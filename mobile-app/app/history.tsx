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

            <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
              {lang === 'ur' ? 'Agent Traces' : 'Agent Traces'} · {traces.length}
            </Text>
            <View
              style={{
                backgroundColor: colors.bg.surfaceSolid,
                borderRadius: radii.lg,
                overflow: 'hidden',
                borderWidth: 0.5,
                borderColor: colors.border.divider,
              }}
            >
              {traces.slice(0, 10).map((tr, i) => (
                <MotiView
                  key={tr.trace_id}
                  from={{ opacity: 0, translateY: 4 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', delay: i * 40 }}
                >
                  <Pressable onPress={() => router.push(`/trace/${tr.trace_id}`)}>
                    {({ pressed }) => (
                      <View
                        style={{
                          backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                          paddingVertical: 11,
                          paddingHorizontal: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          borderBottomWidth: i < Math.min(traces.length, 10) - 1 ? 0.5 : 0,
                          borderBottomColor: colors.border.divider,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 11,
                              fontWeight: '500',
                              letterSpacing: 0.2,
                            }}
                          >
                            {tr.trace_id}
                          </Text>
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontSize: 14,
                              marginTop: 2,
                              letterSpacing: -0.2,
                              fontWeight: '400',
                            }}
                            numberOfLines={1}
                          >
                            {tr.user_input}
                          </Text>
                        </View>
                        <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>
                          {tr.steps?.length || 0} steps
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.text.quaternary} />
                      </View>
                    )}
                  </Pressable>
                </MotiView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
