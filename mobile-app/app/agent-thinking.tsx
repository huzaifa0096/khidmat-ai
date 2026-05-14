/**
 * Agent Thinking Screen — now powered by the AgentWarRoom multi-agent chat.
 * Judges watch the 6 agents collaborate live before being shown results.
 */
import React, { useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/state/AppContext';
import { radii, spacing } from '../src/theme/colors';
import { Header } from '../src/components/Header';
import { GlassCard } from '../src/components/GlassCard';
import { AgentWarRoom } from '../src/components/AgentWarRoom';

export default function AgentThinkingScreen() {
  const router = useRouter();
  const { lang, t, currentTrace, colors } = useApp();

  const handleComplete = useCallback(() => {
    setTimeout(() => router.replace('/results'), 600);
  }, [router]);

  // Defer navigation to after mount to avoid "navigate before mounting Root Layout"
  useEffect(() => {
    if (!currentTrace) {
      const id = setTimeout(() => router.replace('/'), 50);
      return () => clearTimeout(id);
    }
  }, [currentTrace, router]);

  if (!currentTrace) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Header title={t.agent.thinking} showBack={false} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.textAccent} />
        </View>
      </SafeAreaView>
    );
  }

  const steps = (currentTrace?.trace?.steps || []) as any[];
  const totalTools = steps.reduce((acc: number, s: any) => acc + (s.tool_calls?.length || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header title={t.agent.thinking} showBack={false} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxxl,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {/* Hero */}
          <MotiView
            from={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 16 }}
            style={{ marginBottom: spacing.md }}
          >
            <GlassCard glow>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <MotiView
                    from={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ type: 'timing', duration: 1500, loop: true }}
                    style={{
                      position: 'absolute',
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.brand.primary + '55',
                    }}
                  />
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.brand.primary + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.brand.primary + '88',
                    }}
                  >
                    <Ionicons name="git-network" size={22} color={colors.brand.primary} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text.tertiary,
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 1.2,
                    }}
                  >
                    ANTIGRAVITY ORCHESTRATOR · WORKFLOW v1
                  </Text>
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 15,
                      fontWeight: '700',
                      letterSpacing: -0.3,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    "{currentTrace.original_input}"
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
                <Stat label="Trace" value={currentTrace.trace_id?.slice(-6) || '—'} />
                <Stat label="Agents" value={String(steps.length)} />
                <Stat label="Tools" value={String(totalTools)} />
                <Stat
                  label="Duration"
                  value={`${((currentTrace.trace?.duration_ms || 0) / 1000).toFixed(1)}s`}
                />
              </View>
            </GlassCard>
          </MotiView>

          {/* The war room — main show */}
          <AgentWarRoom
            trace={currentTrace.trace}
            intent={currentTrace.intent}
            ranking={currentTrace.ranking}
            lang={lang}
            onComplete={handleComplete}
          />

          {/* Footer hint */}
          <View style={{ marginTop: spacing.lg, alignItems: 'center' }}>
            <Text
              style={{
                color: colors.text.quaternary,
                fontSize: 11,
                fontWeight: '500',
                textAlign: 'center',
              }}
            >
              {lang === 'ur'
                ? 'Multi-agent reasoning · Auto-presenting results when council adjourns'
                : 'Multi-agent reasoning · Auto-presenting when council adjourns'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useApp();
  return (
  <View
    style={{
      flex: 1,
      backgroundColor: colors.bg.elevated,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: radii.sm,
      alignItems: 'center',
    }}
  >
    <Text
      style={{
        color: colors.text.tertiary,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.6,
      }}
    >
      {label.toUpperCase()}
    </Text>
    <Text
      style={{
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: -0.2,
      }}
    >
      {value}
    </Text>
  </View>
  );
};
