/**
 * Trace Detail Viewer — shows the complete agent trace for one orchestration run.
 * Designed for the hackathon "Agent Trace / Logs" deliverable requirement:
 *   - reasoning steps
 *   - agent interactions
 *   - action execution logs
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/state/AppContext';
import { radii, spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { GlassCard } from '../../src/components/GlassCard';
import { fetchTrace, exportTrace, BACKEND_URL } from '../../src/services/api';

const AGENT_META: Record<string, { icon: any; label: string }> = {
  intent_parser: { icon: 'language', label: 'Intent Parser' },
  provider_discovery: { icon: 'search', label: 'Provider Discovery' },
  trust_engine: { icon: 'shield-checkmark', label: 'Trust Engine' },
  ranking_reasoning: { icon: 'sparkles', label: 'Ranking & Reasoning' },
  pricing_engine: { icon: 'calculator', label: 'Pricing Engine' },
  crisis_specialist: { icon: 'alert', label: 'Crisis Specialist' },
  booking_executor: { icon: 'checkmark-done', label: 'Booking Executor' },
  followup_automator: { icon: 'time', label: 'Follow-up Automator' },
};

export default function TraceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, colors } = useApp();
  const [trace, setTrace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetchTrace(id)
      .then(setTrace)
      .catch(() => Alert.alert('Error', 'Could not load trace'))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStep = (idx: number) => {
    const next = new Set(expandedSteps);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    setExpandedSteps(next);
  };

  const handleExportJSON = () => {
    if (!id) return;
    const url = `${BACKEND_URL}/api/traces/${id}/export`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Alert.alert('JSON URL', url);
    }
  };

  if (loading || !trace) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title="Agent Trace" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  const steps = trace.steps || [];
  const totalTools = steps.reduce((acc: number, s: any) => acc + (s.tool_calls?.length || 0), 0);
  const uniqueAgents = new Set(steps.map((s: any) => s.agent)).size;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        title={lang === 'ur' ? 'Agent Trace' : 'Agent Trace'}
        subtitle={trace.trace_id}
        rightIcon="download-outline"
        onRightPress={handleExportJSON}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 560, paddingHorizontal: spacing.xl }}>
          {/* Header summary */}
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 380 }}
          >
            <GlassCard>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: '500',
                  letterSpacing: 0.4,
                }}
              >
                Antigravity Orchestrator · {trace.workflow_id}
              </Text>
              <Text
                style={{
                  color: colors.text.primary,
                  fontSize: 17,
                  fontWeight: '600',
                  letterSpacing: -0.4,
                  marginTop: 6,
                  lineHeight: 22,
                }}
                numberOfLines={3}
              >
                "{trace.user_input}"
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
                <Stat label="Steps" value={String(steps.length)} colors={colors} />
                <Stat label="Agents" value={`${uniqueAgents}/8`} colors={colors} />
                <Stat label="Tools" value={String(totalTools)} colors={colors} />
                <Stat
                  label="Duration"
                  value={`${((trace.duration_ms || 0) / 1000).toFixed(1)}s`}
                  colors={colors}
                />
              </View>
            </GlassCard>
          </MotiView>

          {/* Reasoning + Interactions + Action Logs combined as expandable steps */}
          <Text
            style={{
              color: colors.text.tertiary,
              fontSize: 11,
              fontWeight: '500',
              letterSpacing: 0.4,
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
              marginLeft: 4,
            }}
          >
            Reasoning · Interactions · Tool calls
          </Text>

          {steps.map((step: any, i: number) => {
            const meta = AGENT_META[step.agent] || {
              icon: 'cog',
              label: step.agent,
            };
            const expanded = expandedSteps.has(i);
            return (
              <MotiView
                key={i}
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 240, delay: i * 50 }}
                style={{ marginBottom: 8 }}
              >
                <Pressable onPress={() => toggleStep(i)}>
                  {({ pressed }) => (
                    <View
                      style={{
                        backgroundColor: colors.bg.surfaceSolid,
                        borderRadius: radii.lg,
                        borderWidth: 0.5,
                        borderColor: colors.border.divider,
                        padding: 14,
                        opacity: pressed ? 0.92 : 1,
                      }}
                    >
                      {/* Top row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: colors.bg.elevated,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={meta.icon} size={15} color={colors.text.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 11,
                              fontWeight: '500',
                              letterSpacing: 0.2,
                            }}
                          >
                            Step {step.step ?? i + 1}
                          </Text>
                          <Text
                            style={{
                              color: colors.text.primary,
                              fontSize: 14,
                              fontWeight: '500',
                              letterSpacing: -0.2,
                              marginTop: 1,
                            }}
                          >
                            {meta.label}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              color: colors.text.tertiary,
                              fontSize: 12,
                            }}
                          >
                            {step.tool_calls?.length || 0} tools
                          </Text>
                          {step.duration_ms != null ? (
                            <Text
                              style={{
                                color: colors.text.quaternary,
                                fontSize: 11,
                                marginTop: 1,
                              }}
                            >
                              {step.duration_ms} ms
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.text.quaternary}
                        />
                      </View>

                      {/* Reasoning text — always visible */}
                      {step.reasoning_text ? (
                        <Text
                          style={{
                            color: colors.text.secondary,
                            fontSize: 13,
                            lineHeight: 19,
                            marginTop: 10,
                            letterSpacing: -0.1,
                          }}
                        >
                          {step.reasoning_text}
                        </Text>
                      ) : null}

                      {/* Expanded details */}
                      {expanded ? (
                        <View
                          style={{
                            marginTop: 14,
                            paddingTop: 14,
                            borderTopWidth: 0.5,
                            borderTopColor: colors.border.divider,
                            gap: 12,
                          }}
                        >
                          {/* Tool calls */}
                          {step.tool_calls && step.tool_calls.length > 0 ? (
                            <View>
                              <Text
                                style={{
                                  color: colors.text.tertiary,
                                  fontSize: 11,
                                  fontWeight: '500',
                                  letterSpacing: 0.3,
                                  marginBottom: 8,
                                }}
                              >
                                Tool calls
                              </Text>
                              {step.tool_calls.map((tc: any, j: number) => (
                                <View
                                  key={j}
                                  style={{
                                    backgroundColor: colors.bg.elevated,
                                    borderRadius: 10,
                                    padding: 10,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: colors.text.primary,
                                      fontSize: 12,
                                      fontWeight: '500',
                                      letterSpacing: -0.1,
                                    }}
                                  >
                                    {tc.tool}
                                    {tc.calls ? ` · ×${tc.calls}` : ''}
                                  </Text>
                                  {tc.args ? (
                                    <Text
                                      style={{
                                        color: colors.text.tertiary,
                                        fontSize: 11,
                                        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                                        marginTop: 3,
                                      }}
                                    >
                                      {JSON.stringify(tc.args).slice(0, 180)}
                                    </Text>
                                  ) : null}
                                  {tc.result ? (
                                    <Text
                                      style={{
                                        color: colors.text.tertiary,
                                        fontSize: 11,
                                        fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                                        marginTop: 2,
                                      }}
                                      numberOfLines={2}
                                    >
                                      → {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result).slice(0, 180)}
                                    </Text>
                                  ) : null}
                                </View>
                              ))}
                            </View>
                          ) : null}

                          {/* Output preview */}
                          {step.output ? (
                            <View>
                              <Text
                                style={{
                                  color: colors.text.tertiary,
                                  fontSize: 11,
                                  fontWeight: '500',
                                  letterSpacing: 0.3,
                                  marginBottom: 8,
                                }}
                              >
                                Output
                              </Text>
                              <View
                                style={{
                                  backgroundColor: colors.bg.elevated,
                                  borderRadius: 10,
                                  padding: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    color: colors.text.secondary,
                                    fontSize: 11,
                                    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                                    lineHeight: 15,
                                  }}
                                  numberOfLines={8}
                                >
                                  {JSON.stringify(step.output, null, 2).slice(0, 500)}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  )}
                </Pressable>
              </MotiView>
            );
          })}

          {/* Final state */}
          {trace.final_state ? (
            <GlassCard style={{ marginTop: spacing.lg }}>
              <Text
                style={{
                  color: colors.text.tertiary,
                  fontSize: 11,
                  fontWeight: '500',
                  letterSpacing: 0.4,
                  marginBottom: 8,
                }}
              >
                Final state
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: 12,
                  fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
                  lineHeight: 17,
                }}
              >
                {JSON.stringify(trace.final_state, null, 2)}
              </Text>
            </GlassCard>
          ) : null}

          {/* Export JSON CTA */}
          <Pressable onPress={handleExportJSON} style={{ marginTop: spacing.lg }}>
            {({ pressed }) => (
              <View
                style={{
                  paddingVertical: 13,
                  borderRadius: radii.pill,
                  backgroundColor: colors.brand.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  opacity: pressed ? 0.85 : 1,
                }}
              >
                <Ionicons name="download-outline" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 }}>
                  {lang === 'ur' ? 'Export JSON' : 'Export full trace'}
                </Text>
              </View>
            )}
          </Pressable>

          <Text
            style={{
              color: colors.text.quaternary,
              fontSize: 10,
              textAlign: 'center',
              marginTop: spacing.md,
              fontWeight: '500',
              letterSpacing: 0.3,
            }}
          >
            This trace is auditable and judge-exportable as JSON
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value, colors }: any) => (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.elevated,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: radii.sm,
      alignItems: 'center',
    }}
  >
    <Text
      style={{
        color: colors.text.tertiary,
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 3,
        letterSpacing: -0.3,
      }}
    >
      {value}
    </Text>
  </View>
);
