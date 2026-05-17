/**
 * AgentActivityStream — Live "Agent Activity" panel for the home screen.
 *
 * Polls /api/traces every 8s, shows the latest 3 agent orchestration runs
 * with their agent chain + reasoning preview. Makes "Agent Trace / Logs"
 * Deliverable visible on the home screen — judges don't need to navigate
 * 3 levels deep to find traces.
 *
 * Tap any row → full trace detail at /trace/[trace_id]
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useApp } from '../state/AppContext';
import { radii, spacing } from '../theme/colors';
import { fetchTraces } from '../services/api';

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

export const AgentActivityStream = () => {
  const { colors, lang } = useApp();
  const router = useRouter();
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchTraces();
        if (mounted) setTraces((data?.traces || []).slice(0, 3));
      } catch {}
      if (mounted) setLoading(false);
    };
    load();
    const t = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const formatAgo = (iso?: string) => {
    if (!iso) return '';
    try {
      const ms = Date.now() - new Date(iso).getTime();
      const sec = Math.floor(ms / 1000);
      if (sec < 60) return `${sec}s ago`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}m ago`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}h ago`;
      return `${Math.floor(hr / 24)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <View
      style={{
        marginTop: spacing.lg,
        padding: 14,
        borderRadius: radii.lg,
        backgroundColor: colors.bg.surfaceSolid,
        gap: 10,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.brand.textAccent + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="git-network" size={16} color={colors.brand.textAccent} />
          </View>
          <View>
            <Text style={{ color: colors.text.primary, fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }}>
              {lang === 'ur' ? 'Agent Activity' : 'Agent Activity'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <MotiView
                from={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
                style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.semantic.success }}
              />
              <Text style={{ color: colors.text.tertiary, fontSize: 11 }}>
                {lang === 'ur'
                  ? `${traces.length} recent runs · live`
                  : `${traces.length} recent runs · live`}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/history')}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
        >
          <Text style={{ color: colors.brand.textAccent, fontSize: 12, fontWeight: '700' }}>
            {lang === 'ur' ? 'View All →' : 'View All →'}
          </Text>
        </Pressable>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.brand.textAccent} />
        </View>
      ) : traces.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.text.tertiary, fontSize: 12, textAlign: 'center' }}>
            {lang === 'ur'
              ? 'Ek service search karein — trace yahaan dikhega'
              : 'Search a service — trace will appear here'}
          </Text>
        </View>
      ) : (
        traces.map((tr, i) => {
          const agents: string[] = (tr.steps || [])
            .map((s: any) => s.agent)
            .filter(Boolean);
          const uniqAgents = Array.from(new Set(agents));
          return (
            <MotiView
              key={tr.trace_id}
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 250, delay: i * 60 }}
            >
              <Pressable
                onPress={() => router.push(`/trace/${tr.trace_id}`)}
                style={({ pressed }) => ({
                  padding: 10,
                  borderRadius: radii.md,
                  backgroundColor: pressed ? colors.bg.elevated : 'transparent',
                  borderWidth: 0.5,
                  borderColor: colors.border.divider,
                  gap: 6,
                })}
              >
                {/* Top row: trace id + duration + ago */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}
                  >
                    {tr.trace_id?.slice(-8) || '—'}
                  </Text>
                  <Text style={{ color: colors.text.tertiary, fontSize: 10 }}>
                    {tr.duration_ms ? `${tr.duration_ms}ms · ` : ''}{formatAgo(tr.completed_at || tr.started_at)}
                  </Text>
                </View>

                {/* User input preview */}
                <Text
                  numberOfLines={1}
                  style={{ color: colors.text.primary, fontSize: 13, fontWeight: '600' }}
                >
                  "{tr.user_input || tr.original_input || 'agent run'}"
                </Text>

                {/* Agent chain icons */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  {uniqAgents.map((ag, idx) => (
                    <View
                      key={ag}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: colors.brand.textAccent + '15',
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
        })
      )}
    </View>
  );
};
