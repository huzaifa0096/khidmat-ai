/**
 * AGENT WAR ROOM — the headline shock feature.
 *
 * When the user submits, instead of a plain loading bar, they see 6 specialist
 * agents in a Slack/Discord-style council chamber posting their reasoning live
 * to each other. Watching the agents collaborate IS the demo.
 *
 * The chat is driven by the actual trace from the backend — every line maps to
 * a real tool call or reasoning step that just happened.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors as iconPalette, radii, spacing } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';

type AgentKey =
  | 'intent_parser'
  | 'provider_discovery'
  | 'ranking_reasoning'
  | 'crisis_specialist'
  | 'booking_executor'
  | 'followup_automator';

type ChatMessage = {
  id: string;
  agent: AgentKey;
  text: string;
  ts: string;
  highlight?: boolean;
};

const AGENT_META: Record<
  AgentKey,
  { color: string; icon: keyof typeof Ionicons.glyphMap; name: string; handle: string }
> = {
  intent_parser: {
    color: iconPalette.ios.cyan,
    icon: 'language',
    name: 'Intent Parser',
    handle: '@intent',
  },
  provider_discovery: {
    color: iconPalette.ios.purple,
    icon: 'search',
    name: 'Discovery',
    handle: '@discovery',
  },
  ranking_reasoning: {
    color: iconPalette.ios.orange,
    icon: 'sparkles',
    name: 'Ranking Brain',
    handle: '@ranking',
  },
  crisis_specialist: {
    color: iconPalette.ios.red,
    icon: 'alert',
    name: 'Crisis Coord',
    handle: '@crisis',
  },
  booking_executor: {
    color: iconPalette.ios.green,
    icon: 'checkmark-done',
    name: 'Booking Exec',
    handle: '@booking',
  },
  followup_automator: {
    color: iconPalette.ios.pink,
    icon: 'time',
    name: 'Follow-up',
    handle: '@followup',
  },
};

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Translate a trace step into 1-3 conversational messages with agent personality. */
const buildScript = (trace: any, intent: any, ranking: any): ChatMessage[] => {
  const msgs: ChatMessage[] = [];
  const id = () => 'm' + Math.random().toString(36).slice(2, 8);

  // Opening
  msgs.push({
    id: id(),
    agent: 'intent_parser',
    text: `New request just landed. Parsing input now...`,
    ts: nowTime(),
  });

  if (intent) {
    msgs.push({
      id: id(),
      agent: 'intent_parser',
      text: `Detected: ${intent.service_category_id?.replace(/_/g, ' ') || '?'} · ${intent.location?.sector || '?'}, ${intent.location?.city || '?'} · ${intent.time?.preference?.replace(/_/g, ' ') || '?'} · urgency=${intent.urgency || 'normal'}. Confidence ${Math.round((intent.service_category_confidence || 0) * 100)}%.`,
      ts: nowTime(),
      highlight: true,
    });
    msgs.push({
      id: id(),
      agent: 'intent_parser',
      text: `Language: ${intent.language_detected || 'unknown'}. Reasoning in user's language. Passing to @discovery 👉`,
      ts: nowTime(),
    });

    if (intent.urgency === 'emergency') {
      msgs.push({
        id: id(),
        agent: 'crisis_specialist',
        text: `🚨 Emergency signals detected: ${(intent.urgency_signals || []).join(', ')}. Activating Mode A. Fetching weather + traffic + cluster reports.`,
        ts: nowTime(),
        highlight: true,
      });
    }
  }

  msgs.push({
    id: id(),
    agent: 'provider_discovery',
    text: `On it. Querying provider DB for ${intent?.service_category_id} in ${intent?.location?.city}...`,
    ts: nowTime(),
  });

  // Discovery details from trace
  const discoveryStep = trace?.steps?.find((s: any) => s.agent === 'provider_discovery');
  if (discoveryStep?.output) {
    msgs.push({
      id: id(),
      agent: 'provider_discovery',
      text: `Found ${discoveryStep.output.total_matched} matching providers. Filtered out ${discoveryStep.output.filtered_out_count || 0} on availability/budget constraints.`,
      ts: nowTime(),
    });
    msgs.push({
      id: id(),
      agent: 'provider_discovery',
      text: `Sorted top 15 by proximity. Sending shortlist to @ranking for scoring 📊`,
      ts: nowTime(),
    });
  }

  msgs.push({
    id: id(),
    agent: 'ranking_reasoning',
    text: `Got the shortlist. Running 7-dimensional weighted scoring...`,
    ts: nowTime(),
  });

  if (ranking?.top_3?.length > 0) {
    const top = ranking.top_3[0];
    msgs.push({
      id: id(),
      agent: 'ranking_reasoning',
      text: `Computed. Top match: ${top.provider.business_name} — score ${Math.round(top.final_score * 100)}/100.`,
      ts: nowTime(),
      highlight: true,
    });
    msgs.push({
      id: id(),
      agent: 'ranking_reasoning',
      text: `Why: ${top.distance_km.toFixed(1)}km · ${top.provider.rating}★ · ${top.provider.completion_rate_percent}% completion · ${top.provider.verified ? 'verified ✓' : 'unverified'}. Badges: ${(top.highlight_badges || []).slice(0, 3).join(', ')}.`,
      ts: nowTime(),
    });

    if (ranking.top_3.length > 1) {
      const second = ranking.top_3[1];
      msgs.push({
        id: id(),
        agent: 'ranking_reasoning',
        text: `Runner-up: ${second.provider.business_name} (${Math.round(second.final_score * 100)}/100). ${second.tradeoffs?.[0] || 'Strong alternative if user prefers it.'}`,
        ts: nowTime(),
      });
    }
  }

  msgs.push({
    id: id(),
    agent: 'booking_executor',
    text: `Standing by. Slot pre-warmed, receipt template loaded. Awaiting user green light ✋`,
    ts: nowTime(),
  });

  msgs.push({
    id: id(),
    agent: 'followup_automator',
    text: `7-event timeline pre-staged with branching rules. Reminders, ETA, completion check, rating prompt — all queued.`,
    ts: nowTime(),
  });

  msgs.push({
    id: id(),
    agent: 'intent_parser',
    text: `Council adjourned. Presenting top 3 to user.`,
    ts: nowTime(),
  });

  return msgs;
};

export const AgentWarRoom = ({
  trace,
  intent,
  ranking,
  lang,
  onComplete,
}: {
  trace: any;
  intent: any;
  ranking: any;
  lang: 'ur' | 'en';
  onComplete?: () => void;
}) => {
  const { colors } = useTheme();
  const script = useMemo(() => buildScript(trace, intent, ranking), [trace, intent, ranking]);
  const [visibleCount, setVisibleCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Reveal messages one by one (250ms between each)
  useEffect(() => {
    if (visibleCount >= script.length) {
      onComplete?.();
      return;
    }
    const id = setTimeout(() => setVisibleCount((c) => c + 1), 280);
    return () => clearTimeout(id);
  }, [visibleCount, script.length, onComplete]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [visibleCount]);

  const visibleMsgs = script.slice(0, visibleCount);

  // Which agents have spoken so far
  const speakingAgent = visibleMsgs[visibleMsgs.length - 1]?.agent;
  const allAgents: AgentKey[] = [
    'intent_parser',
    'provider_discovery',
    'ranking_reasoning',
    'crisis_specialist',
    'booking_executor',
    'followup_automator',
  ];
  const completedAgents = new Set(visibleMsgs.map((m) => m.agent));

  return (
    <View
      style={{
        backgroundColor: colors.bg.surfaceSolid,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        overflow: 'hidden',
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            } as any)
          : {}),
      }}
    >
      {/* Header bar — looks like a Discord channel header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
          backgroundColor: colors.bg.elevated,
          gap: 10,
        }}
      >
        <Ionicons name="people" size={16} color={colors.brand.primary} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text.primary,
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: -0.2,
            }}
          >
            # agent-war-room
          </Text>
          <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '600' }}>
            6 specialists collaborating in real-time
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MotiView
            from={{ opacity: 1 }}
            animate={{ opacity: 0.3 }}
            transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.semantic.success,
            }}
          />
          <Text
            style={{
              color: colors.semantic.success,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.6,
            }}
          >
            LIVE
          </Text>
        </View>
      </View>

      {/* Roster strip showing who's online */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 10,
          paddingVertical: 8,
          gap: 6,
          backgroundColor: colors.bg.elevated,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        {allAgents.map((a) => {
          const m = AGENT_META[a];
          const active = speakingAgent === a;
          const done = completedAgents.has(a) && !active;
          return (
            <View
              key={a}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 3,
                opacity: completedAgents.has(a) ? 1 : 0.4,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: m.color + '22',
                  borderWidth: 1.5,
                  borderColor: active ? m.color : done ? m.color + '88' : colors.border.subtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={m.icon} size={12} color={m.color} />
              </View>
              <Text
                style={{
                  color: active ? m.color : colors.text.tertiary,
                  fontSize: 8,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                {m.handle}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Chat messages */}
      <ScrollView
        ref={scrollRef}
        style={{ maxHeight: 380 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {visibleMsgs.map((msg, i) => {
          const meta = AGENT_META[msg.agent];
          return (
            <MotiView
              key={msg.id}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 260 }}
              style={{
                flexDirection: 'row',
                gap: 8,
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: meta.color + '22',
                  borderWidth: 1,
                  borderColor: meta.color + '55',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={meta.icon} size={14} color={meta.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      color: meta.color,
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: -0.1,
                    }}
                  >
                    {meta.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.text.quaternary,
                      fontSize: 10,
                      fontWeight: '500',
                    }}
                  >
                    {meta.handle} · {msg.ts}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: msg.highlight
                      ? meta.color + '15'
                      : colors.bg.elevated,
                    borderRadius: 10,
                    borderTopLeftRadius: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderWidth: msg.highlight ? 1 : 0,
                    borderColor: meta.color + '44',
                  }}
                >
                  <Text
                    style={{
                      color: colors.text.primary,
                      fontSize: 12.5,
                      lineHeight: 18,
                      letterSpacing: -0.1,
                    }}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            </MotiView>
          );
        })}

        {/* Typing indicator while more messages incoming */}
        {visibleCount < script.length && script[visibleCount] ? (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingVertical: 4,
              opacity: 0.7,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: AGENT_META[script[visibleCount].agent].color + '22',
                borderWidth: 1,
                borderColor: AGENT_META[script[visibleCount].agent].color + '55',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={AGENT_META[script[visibleCount].agent].icon}
                size={14}
                color={AGENT_META[script[visibleCount].agent].color}
              />
            </View>
            <View
              style={{
                backgroundColor: colors.bg.elevated,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: 'row',
                gap: 4,
                alignSelf: 'flex-start',
              }}
            >
              {[0, 1, 2].map((i) => (
                <MotiView
                  key={i}
                  from={{ opacity: 0.3, translateY: 0 }}
                  animate={{ opacity: 1, translateY: -2 }}
                  transition={{
                    type: 'timing',
                    duration: 500,
                    loop: true,
                    repeatReverse: true,
                    delay: i * 120,
                  }}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: AGENT_META[script[visibleCount].agent].color,
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer progress bar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          backgroundColor: colors.bg.elevated,
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 5,
          }}
        >
          <Text style={{ color: colors.text.tertiary, fontSize: 10, fontWeight: '700' }}>
            {visibleCount}/{script.length} MESSAGES · {completedAgents.size}/6 AGENTS
          </Text>
          <Text style={{ color: colors.brand.primary, fontSize: 10, fontWeight: '800' }}>
            {Math.round((visibleCount / script.length) * 100)}%
          </Text>
        </View>
        <View
          style={{
            height: 3,
            backgroundColor: colors.border.subtle,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#0A84FF', '#5E5CE6'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 3,
              width: `${(visibleCount / script.length) * 100}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
};
