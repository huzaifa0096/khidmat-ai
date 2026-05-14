/**
 * Smart Insights — Mode B of Crisis Specialist (Challenge 1 crossover).
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { fetchInsights } from '../src/services/api';

export default function InsightsScreen() {
  const { lang, t, colors } = useApp();
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights()
      .then(setInsights)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={t.insights.title} />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={{ color: colors.text.secondary, fontSize: 14 }}>{t.insights.subtitle}</Text>

        {loading ? (
          <ActivityIndicator color={colors.brand.textAccent} style={{ marginTop: 50 }} />
        ) : (
          <>
            <GlassCard>
              <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                {t.insights.executive}
              </Text>
              <Text style={{ color: colors.text.primary, fontSize: 14, marginTop: 6, lineHeight: 20 }}>
                {lang === 'ur' ? insights?.executive_summary_ur : insights?.executive_summary_en}
              </Text>
            </GlassCard>

            {(insights?.insights || []).map((ins: any, i: number) => (
              <MotiView
                key={ins.id}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', delay: i * 120 }}
              >
                <GlassCard>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.brand.accent + '22',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="trending-up" size={16} color={colors.brand.accent} />
                    </View>
                    <Text style={{ color: colors.text.tertiary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>
                      {ins.type?.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 6 }}>
                    {lang === 'ur' ? ins.title_ur || ins.title_en : ins.title_en}
                  </Text>
                  <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>{ins.impact}</Text>

                  {/* Recommended action */}
                  <View
                    style={{
                      marginTop: 10,
                      backgroundColor: colors.bg.elevated,
                      padding: 10,
                      borderRadius: radii.md,
                      borderLeftWidth: 3,
                      borderLeftColor: colors.brand.primary,
                    }}
                  >
                    <Text style={{ color: colors.brand.primaryLight, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                      {lang === 'ur' ? 'Tajweez' : 'Recommended Action'}
                    </Text>
                    <Text style={{ color: colors.text.primary, fontSize: 13, marginTop: 4 }}>
                      {ins.recommended_action?.details}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <Tag label={ins.recommended_action?.priority || 'medium'} color={colors.semantic.warning} />
                      <Tag label={ins.recommended_action?.action_type?.replace('_', ' ')} color={colors.brand.secondary} />
                    </View>
                  </View>

                  {/* Simulated execution */}
                  {ins.simulated_execution ? (
                    <View
                      style={{
                        marginTop: 10,
                        backgroundColor: colors.semantic.success + '14',
                        padding: 10,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: colors.semantic.success + '44',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="checkmark-done-circle" size={14} color={colors.semantic.success} />
                        <Text style={{ color: colors.semantic.success, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                          {lang === 'ur' ? 'Khud Kaar Action' : 'Simulated Execution'}
                        </Text>
                      </View>
                      <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>
                        {ins.simulated_execution.action_taken}
                      </Text>
                      <Text style={{ color: colors.semantic.success, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
                        → {ins.simulated_execution.result}
                      </Text>
                    </View>
                  ) : null}
                </GlassCard>
              </MotiView>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const Tag = ({ label, color }: any) => (
  <View
    style={{
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: color + '22',
      borderWidth: 1,
      borderColor: color + '55',
    }}
  >
    <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
  </View>
);
